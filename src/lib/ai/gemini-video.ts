const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

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

export type GeminiVideoStartResult =
  | { ok: true; operationName: string }
  | { ok: false; error: string };

/**
 * Kicks off a long-running Veo generation job. Gemini's video models don't
 * return the finished clip inline — this starts the operation and returns
 * its name for polling via `pollGeminiVideoOperation`.
 */
export async function startGeminiVideoGeneration(
  prompt: string,
  options: { model: string; aspectRatio: string; apiKey?: string | null },
): Promise<GeminiVideoStartResult> {
  const apiKey = resolveApiKey(options.apiKey);
  if (!apiKey) return { ok: false, error: "No Gemini API key is configured for this invitation." };

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${options.model}:predictLongRunning?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { aspectRatio: options.aspectRatio },
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      console.error("Gemini video generation failed to start", body);
      return { ok: false, error: `Gemini API error (${response.status})` };
    }

    const data = await response.json();
    const operationName = data.name as string | undefined;
    if (!operationName) return { ok: false, error: "Gemini API returned no operation name." };

    return { ok: true, operationName };
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
      return { status: "FAILED", error: `Gemini API error (${response.status})` };
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
