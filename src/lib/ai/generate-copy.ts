import {
  celebrantNames,
  eventCategoryFor,
  fillContent,
  type EventCategoryContent,
} from "@/lib/event-categories";

export type InvitationCopyInput = {
  brideName: string;
  groomName: string;
  weddingDateDisplay: string;
  venueName?: string;
  language?: string;
  customMessage?: string;
  /** Which celebration this is — decides the voice and the vocabulary. */
  eventCategory?: string;
  /** The chosen design's own copy, used as the template fallback when set. */
  themeContent?: Partial<EventCategoryContent> | null;
};

export type InvitationCopy = {
  heroHeadline: string;
  heroSubline: string;
  invitationLetter: string;
  storyHeadline: string;
  hashtags: string[];
  seoTitle: string;
  seoDescription: string;
  source: "anthropic" | "openai" | "template";
};

function buildSystemPrompt(input: InvitationCopyInput) {
  const category = eventCategoryFor(input.eventCategory);
  return `You are an invitation copywriter. Given the hosts' details, write warm,
elegant, concise copy for a ${category.label.toLowerCase()} invitation website. Respond with
ONLY a JSON object matching this exact shape, no markdown fences, no commentary:
{
  "heroHeadline": string (max 8 words, e.g. "${category.content.heroHeadline}"),
  "heroSubline": string (one sentence invitation line),
  "invitationLetter": string (2-3 sentence formal invitation paragraph),
  "storyHeadline": string (max 4 words, for a photo section, e.g. "${category.content.storyHeadline}"),
  "hashtags": string[] (3 hashtags built from the names, no # symbol),
  "seoTitle": string (under 60 chars),
  "seoDescription": string (under 155 chars)
}`;
}

function buildUserPrompt(input: InvitationCopyInput) {
  const category = eventCategoryFor(input.eventCategory);
  return `Occasion: ${category.label}
${category.primaryNameLabel}: ${input.brideName}
${category.secondaryNameLabel}: ${input.groomName || "not specified"}
${category.dateLabel}: ${input.weddingDateDisplay}
Venue: ${input.venueName ?? "not specified"}
Language: ${input.language ?? "English"}
Extra notes from the hosts: ${input.customMessage ?? "none"}`;
}

function parseJsonResponse(text: string): Omit<InvitationCopy, "source"> | null {
  try {
    const cleaned = text.trim().replace(/^```json\s*|```$/g, "");
    const parsed = JSON.parse(cleaned);
    if (!parsed.heroHeadline || !parsed.invitationLetter) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function generateWithAnthropic(
  input: InvitationCopyInput,
): Promise<InvitationCopy | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 600,
      system: buildSystemPrompt(input),
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    }),
  });

  if (!response.ok) {
    console.error("Anthropic generation failed", await response.text());
    return null;
  }

  const data = await response.json();
  const text = data.content?.[0]?.text as string | undefined;
  if (!text) return null;

  const parsed = parseJsonResponse(text);
  return parsed ? { ...parsed, source: "anthropic" } : null;
}

async function generateWithOpenAI(
  input: InvitationCopyInput,
): Promise<InvitationCopy | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(input) },
        { role: "user", content: buildUserPrompt(input) },
      ],
    }),
  });

  if (!response.ok) {
    console.error("OpenAI generation failed", await response.text());
    return null;
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content as string | undefined;
  if (!text) return null;

  const parsed = parseJsonResponse(text);
  return parsed ? { ...parsed, source: "openai" } : null;
}

/**
 * Deterministic, non-AI fallback so the wizard always produces usable copy
 * even with no provider key configured. It reads from the chosen design's own
 * copy where it has some, and from the event category's otherwise — which is
 * why a birthday never falls back to a wedding letter. Clearly tagged
 * `source: "template"` so the UI can be honest about what generated it.
 */
function generateTemplateCopy(input: InvitationCopyInput): InvitationCopy {
  const category = eventCategoryFor(input.eventCategory);
  const content: EventCategoryContent = { ...category.content, ...(input.themeContent ?? {}) };
  const names = celebrantNames(category, input.brideName, input.groomName);
  const values = { names, date: input.weddingDateDisplay, venue: input.venueName };
  const nameSlug = `${input.brideName}${input.groomName}`.replace(/[^a-zA-Z0-9]+/g, "");

  return {
    heroHeadline: content.heroHeadline,
    heroSubline: fillContent(content.heroSubline, values),
    invitationLetter: fillContent(content.invitationLetter, values),
    storyHeadline: content.storyHeadline,
    hashtags: [nameSlug, `${nameSlug}${content.hashtagSuffix}`, `Our${content.hashtagSuffix}`],
    seoTitle: `${names} — ${category.label} ${new Date().getFullYear()}`,
    seoDescription: `${fillContent(content.heroSubline, values)}${
      input.venueName ? ` · ${input.venueName}` : ""
    }`.slice(0, 155),
    source: "template",
  };
}

export async function generateInvitationCopy(
  input: InvitationCopyInput,
): Promise<InvitationCopy> {
  const anthropicResult = await generateWithAnthropic(input).catch((error) => {
    console.error("Anthropic call threw", error);
    return null;
  });
  if (anthropicResult) return anthropicResult;

  const openAiResult = await generateWithOpenAI(input).catch((error) => {
    console.error("OpenAI call threw", error);
    return null;
  });
  if (openAiResult) return openAiResult;

  return generateTemplateCopy(input);
}
