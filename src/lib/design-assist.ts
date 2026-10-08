import { z } from "zod";
export const DESIGN_FONTS = ["Playfair Display", "Cormorant Garamond", "Great Vibes", "Inter", "EB Garamond"] as const;
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const designSuggestionSchema = z.object({
  palette: z.object({ primary: color, secondary: color, accent: color, background: color, foreground: color }),
  fonts: z.object({ display: z.enum(DESIGN_FONTS), body: z.enum(DESIGN_FONTS), script: z.enum(DESIGN_FONTS) }),
  elements: z.array(z.object({ key: z.string().min(1).max(150), color, fontSize: z.number().min(10).max(90), fontRole: z.enum(["display", "body", "script"]), align: z.enum(["left", "center", "right"]), width: z.number().min(20).max(100), x: z.number().min(-35).max(35), y: z.number().min(-35).max(35), bold: z.boolean(), showBackground: z.boolean() })).max(150),
});
export type DesignSuggestion = z.infer<typeof designSuggestionSchema>;
export function safeDesignSuggestion(input: unknown, allowedKeys: string[]) {
  const result = designSuggestionSchema.parse(input);
  const allowed = new Set(allowedKeys);
  const returned = new Set(result.elements.map((element) => element.key));
  if (result.elements.some((element) => !allowed.has(element.key))) throw new Error("Unknown text layer");
  if (returned.size !== allowed.size || returned.size !== result.elements.length) throw new Error("Every current text layer needs one suggestion");
  return result;
}
export function suggestionStyles(suggestion: DesignSuggestion) { return Object.fromEntries(suggestion.elements.map(({ key, ...style }) => [key, style])); }
