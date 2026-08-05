export type InvitationCopyInput = {
  brideName: string;
  groomName: string;
  weddingDateDisplay: string;
  venueName?: string;
  language?: string;
  customMessage?: string;
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

const SYSTEM_PROMPT = `You are a luxury wedding invitation copywriter. Given a couple's
details, write warm, elegant, concise copy for their wedding website. Respond with ONLY
a JSON object matching this exact shape, no markdown fences, no commentary:
{
  "heroHeadline": string (max 8 words, e.g. "We're Getting Married"),
  "heroSubline": string (one sentence invitation line),
  "invitationLetter": string (2-3 sentence formal invitation paragraph),
  "storyHeadline": string (max 4 words, for a photo/story section, e.g. "Forever Us"),
  "hashtags": string[] (3 wedding hashtags combining both names, no # symbol),
  "seoTitle": string (under 60 chars),
  "seoDescription": string (under 155 chars)
}`;

function buildUserPrompt(input: InvitationCopyInput) {
  return `Bride: ${input.brideName}
Groom: ${input.groomName}
Wedding date: ${input.weddingDateDisplay}
Venue: ${input.venueName ?? "not specified"}
Language: ${input.language ?? "English"}
Extra notes from the couple: ${input.customMessage ?? "none"}`;
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
      system: SYSTEM_PROMPT,
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
        { role: "system", content: SYSTEM_PROMPT },
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
 * even with no provider key configured. Clearly tagged `source: "template"`
 * so the UI can be honest about what actually generated it.
 */
function generateTemplateCopy(input: InvitationCopyInput): InvitationCopy {
  const names = `${input.brideName} & ${input.groomName}`;
  return {
    heroHeadline: "We're Getting Married",
    heroSubline: `Join us as we celebrate our wedding — ${input.weddingDateDisplay}`,
    invitationLetter: `Together with our families, we joyfully invite you to celebrate our wedding. ${
      input.venueName ? `We can't wait to see you at ${input.venueName}. ` : ""
    }Your presence would mean the world to us as we begin this new chapter.`,
    storyHeadline: "Forever Us",
    hashtags: [
      `${input.brideName}${input.groomName}`.replace(/\s+/g, ""),
      `${input.brideName}Weds${input.groomName}`.replace(/\s+/g, ""),
      "OurWedding",
    ],
    seoTitle: `${names} — Wedding ${new Date().getFullYear()}`,
    seoDescription: `Join us as we celebrate the wedding of ${names}. ${input.weddingDateDisplay}${
      input.venueName ? ` · ${input.venueName}` : ""
    }`,
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
