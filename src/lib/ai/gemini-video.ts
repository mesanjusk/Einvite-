const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

// Gemini only serves video (Veo) models to some keys, the available IDs
// differ by tier, and Google retires them over time — so a template that
// pins one ("veo-3.0-generate-001") starts 404ing the day that ID stops
// being served to the key in use. Templates saved with this sentinel ask
// the key's own model list at generation time instead.
export const AUTO_VIDEO_MODEL = "auto";

// The generation method Veo's long-running video models advertise in
// ListModels — what separates them from the text and image models.
const LONG_RUNNING_METHOD = "predictLongRunning";

export const NO_VIDEO_MODEL_ERROR =
  "This Gemini API key can't reach any video (Veo) model. Veo needs a paid-tier key — enable billing on the key in Google AI Studio, or use a different key.";

// Google's 429 text ("You exceeded your current quota, please check your plan
// and billing details") reads as though the allowance ran out. For Veo on a
// free-tier key there was never an allowance: the models are listed, they
// just carry no quota, so the very first request of the day gets this. Left
// unexplained it sends couples looking through their usage for spend that
// isn't there.
export const VEO_QUOTA_HINT =
  "Note: video generation isn't included in the Gemini free tier at all — if this is the first video attempted on this key, enable billing on it in Google AI Studio rather than waiting for quota to reset.";

export type VideoPromptInvitationInput = {
  brideName: string;
  groomName: string;
  weddingDateDisplay: string;
  venueName?: string | null;
  customMessage?: string | null;
  colorPalette?: { primary: string; secondary: string; accent: string } | null;
  eventNames?: string[];
  photoCount?: number;
};

export type VideoPromptTemplateInput = {
  promptTemplate: string;
  styleKeywords?: string[];
  aspectRatio: string;
  durationSeconds: number;
};

const PLACEHOLDER_PATTERN = /\{\{\s*(\w+)\s*\}\}/g;

/**
 * Resolves a template's `{{placeholder}}` prompt against the couple's own
 * captured invitation details — the same names, date, venue, and theme
 * colors already on file for the website/PDF — plus the template's style
 * keywords, so admins can author reusable prompts without hardcoding a
 * couple's details.
 */
export function buildVideoPrompt(
  invitation: VideoPromptInvitationInput,
  template: VideoPromptTemplateInput,
): string {
  const placeholders: Record<string, string> = {
    brideName: invitation.brideName,
    groomName: invitation.groomName,
    coupleNames: `${invitation.brideName} & ${invitation.groomName}`,
    weddingDate: invitation.weddingDateDisplay,
    venueName: invitation.venueName ?? "",
    customMessage: invitation.customMessage ?? "",
    primaryColor: invitation.colorPalette?.primary ?? "",
    accentColor: invitation.colorPalette?.accent ?? "",
    events: invitation.eventNames?.join(", ") ?? "",
    style: template.styleKeywords?.join(", ") ?? "",
  };

  const resolved = template.promptTemplate.replace(PLACEHOLDER_PATTERN, (match, key: string) =>
    key in placeholders ? placeholders[key] : match,
  );

  const details = [
    `Couple: ${placeholders.coupleNames}.`,
    `Wedding date: ${placeholders.weddingDate}.`,
    invitation.venueName ? `Venue: ${invitation.venueName}.` : null,
    template.styleKeywords?.length ? `Style: ${template.styleKeywords.join(", ")}.` : null,
    `Aspect ratio ${template.aspectRatio}, about ${template.durationSeconds}s.`,
  ]
    .filter(Boolean)
    .join(" ");

  return `${resolved}\n\n${details}`;
}

/**
 * True if a key is available for this generation — either the couple's own
 * (from Google AI Studio, entered on their invitation) or the platform's
 * shared GEMINI_API_KEY. The couple's own key always takes priority.
 */
export function isGeminiVideoConfigured(customApiKey?: string | null): boolean {
  return Boolean(customApiKey || process.env.GEMINI_API_KEY);
}

function resolveApiKey(customApiKey?: string | null): string | null {
  return customApiKey || process.env.GEMINI_API_KEY || null;
}

/**
 * Gemini reports the useful part of a failure in the JSON body ("models/…
 * is not found for API version v1beta"), not the status line — reporting
 * only the status left couples staring at "Gemini API error (404)" with
 * nothing to act on.
 */
function describeApiError(status: number, body: string): string {
  try {
    const message = (JSON.parse(body) as { error?: { message?: string } }).error?.message;
    if (message) return `Gemini API error (${status}): ${message}`;
  } catch {
    // Body wasn't JSON — fall back to the bare status.
  }
  return `Gemini API error (${status})`;
}

type ListedModel = { name?: string; supportedGenerationMethods?: string[] };

export type GeminiVideoModelList = { models: string[]; error?: string };

/**
 * The video-capable model IDs this particular key can actually reach, from
 * Gemini's own ListModels. Never throws — a listing that fails reports why
 * alongside whatever it did read, so the caller can tell "this key has no
 * Veo access" (a billing problem) apart from "this key is rejected outright"
 * (a typo) instead of blaming the tier for both.
 */
export async function listGeminiVideoModels(apiKey: string): Promise<GeminiVideoModelList> {
  const models: string[] = [];
  let pageToken: string | undefined;

  try {
    do {
      const url = new URL(`${GEMINI_API_BASE}/models`);
      url.searchParams.set("key", apiKey);
      url.searchParams.set("pageSize", "200");
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const response = await fetch(url.toString());
      if (!response.ok) {
        const body = await response.text();
        console.error("Gemini model listing failed", body);
        return { models, error: describeApiError(response.status, body) };
      }

      const data = (await response.json()) as { models?: ListedModel[]; nextPageToken?: string };
      for (const model of data.models ?? []) {
        if (model.name && model.supportedGenerationMethods?.includes(LONG_RUNNING_METHOD)) {
          models.push(model.name.replace(/^models\//, ""));
        }
      }
      pageToken = data.nextPageToken;
    } while (pageToken);
  } catch (error) {
    console.error("Gemini model listing threw", error);
    return { models, error: "Could not reach the Gemini API." };
  }

  return { models };
}

/**
 * Scores a Veo model ID so the newest family wins, full quality beats
 * "fast", and a stable release beats a preview of the same generation.
 */
function modelRank(model: string): number {
  const version = Number.parseFloat(/^veo-(\d+(?:\.\d+)?)/.exec(model)?.[1] ?? "0");
  return version * 100 + (model.includes("fast") ? 0 : 10) + (model.includes("preview") ? 0 : 1);
}

/**
 * Picks which model to generate with: the template's own choice when the
 * key can reach it, otherwise the best video model the key does have. Veo
 * models are preferred, but any long-running video model is better than
 * failing outright.
 */
export function pickVideoModel(available: string[], preferred?: string | null): string | null {
  if (preferred && preferred !== AUTO_VIDEO_MODEL && available.includes(preferred)) {
    return preferred;
  }

  const veo = available.filter((model) => model.startsWith("veo-"));
  const candidates = veo.length > 0 ? veo : available;
  return [...candidates].sort((a, b) => modelRank(b) - modelRank(a))[0] ?? null;
}

export type GeminiVideoStartResult =
  | { ok: true; operationName: string; model: string }
  | { ok: false; error: string };

function requestVideoGeneration(
  prompt: string,
  options: { model: string; aspectRatio: string; apiKey: string },
) {
  return fetch(
    `${GEMINI_API_BASE}/models/${options.model}:predictLongRunning?key=${options.apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { aspectRatio: options.aspectRatio },
      }),
    },
  );
}

/**
 * Kicks off a long-running Veo generation job. Gemini's video models don't
 * return the finished clip inline — this starts the operation and returns
 * its name for polling via `pollGeminiVideoOperation`, plus the model it
 * actually ran on (which may not be the template's, see below).
 *
 * A template pins a model ID, but whether that ID exists for a given key is
 * outside the template's control — an unreachable one comes back as a 404
 * naming the model. Rather than failing the generation on that, this asks
 * the key which video models it does have and retries once with the best of
 * them; only a key with no video models at all is a dead end.
 */
export async function startGeminiVideoGeneration(
  prompt: string,
  options: { model: string; aspectRatio: string; apiKey?: string | null },
): Promise<GeminiVideoStartResult> {
  const apiKey = resolveApiKey(options.apiKey);
  if (!apiKey) return { ok: false, error: "No Gemini API key is configured for this invitation." };

  try {
    let model = options.model;

    if (!model || model === AUTO_VIDEO_MODEL) {
      const listed = await listGeminiVideoModels(apiKey);
      const resolved = pickVideoModel(listed.models);
      if (!resolved) return { ok: false, error: listed.error ?? NO_VIDEO_MODEL_ERROR };
      model = resolved;
    }

    let response = await requestVideoGeneration(prompt, { ...options, model, apiKey });

    if (response.status === 404) {
      const listed = await listGeminiVideoModels(apiKey);
      const fallback = pickVideoModel(
        listed.models.filter((candidate) => candidate !== model),
      );
      if (!fallback) {
        const body = await response.text();
        console.error("Gemini video generation failed to start", body);
        // The 404 names a model nobody can act on; what the couple needs to
        // know is that this key has no video model to fall back to.
        return { ok: false, error: listed.error ?? NO_VIDEO_MODEL_ERROR };
      }
      console.warn(`Gemini model ${model} is unavailable for this key — retrying with ${fallback}`);
      model = fallback;
      response = await requestVideoGeneration(prompt, { ...options, model, apiKey });
    }

    if (!response.ok) {
      const body = await response.text();
      console.error("Gemini video generation failed to start", body);
      const message = describeApiError(response.status, body);
      return {
        ok: false,
        error: response.status === 429 ? `${message} ${VEO_QUOTA_HINT}` : message,
      };
    }

    const data = await response.json();
    const operationName = data.name as string | undefined;
    if (!operationName) return { ok: false, error: "Gemini API returned no operation name." };

    return { ok: true, operationName, model };
  } catch (error) {
    console.error("Gemini video generation call threw", error);
    return { ok: false, error: "Could not reach the Gemini API." };
  }
}

export type GeminiVideoPollResult =
  | { status: "PROCESSING" }
  | { status: "COMPLETED"; videoUrl: string }
  | { status: "FAILED"; error: string };

/**
 * Polls a previously started operation. The signed video URI Gemini returns
 * requires the API key to fetch, so callers should proxy/download it rather
 * than exposing it to the browser directly.
 */
export async function pollGeminiVideoOperation(
  operationName: string,
  customApiKey?: string | null,
): Promise<GeminiVideoPollResult> {
  const apiKey = resolveApiKey(customApiKey);
  if (!apiKey) return { status: "FAILED", error: "No Gemini API key is configured for this invitation." };

  try {
    const response = await fetch(`${GEMINI_API_BASE}/${operationName}?key=${apiKey}`);
    if (!response.ok) {
      const body = await response.text();
      console.error("Gemini video operation poll failed", body);
      return { status: "FAILED", error: describeApiError(response.status, body) };
    }

    const data = await response.json();
    if (!data.done) return { status: "PROCESSING" };

    if (data.error) {
      return { status: "FAILED", error: data.error.message ?? "Gemini reported a failure." };
    }

    const videoUri =
      data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ??
      data.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) return { status: "FAILED", error: "Gemini finished but returned no video." };

    return { status: "COMPLETED", videoUrl: `${videoUri}${videoUri.includes("?") ? "&" : "?"}key=${apiKey}` };
  } catch (error) {
    console.error("Gemini video operation poll threw", error);
    return { status: "FAILED", error: "Could not reach the Gemini API." };
  }
}
