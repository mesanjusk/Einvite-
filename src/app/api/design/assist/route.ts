import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/admin-guard";
import { authorizeInvitationAccess } from "@/lib/invitation-access";
import { suggestMediaDesign } from "@/lib/ai/design-assist";
export const maxDuration = 60;
const inputSchema = z.object({ invitationId: z.string().regex(/^[a-f0-9]{24}$/).optional(), apiKey: z.string().trim().max(200).regex(/^[A-Za-z0-9_-]*$/).optional(), model: z.enum(["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-2.5-flash"]).default("gemini-3.5-flash-lite"), image: z.string().min(20).max(700000).regex(/^[A-Za-z0-9+/=]+$/), elements: z.array(z.object({ key: z.string().min(1).max(150), text: z.string().max(2000) })).min(1).max(150) });
export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 900000) return NextResponse.json({ error: "Preview image is too large." }, { status: 413 });
  let input;
  try { input = inputSchema.parse(await request.json()); } catch { return NextResponse.json({ error: "Invalid image preview." }, { status: 400 }); }
  const invitation = input.invitationId ? await authorizeInvitationAccess(input.invitationId) : null;
  if (input.invitationId ? !invitation : !(await getAdmin())) return NextResponse.json({ error: "Access required." }, { status: 403 });
  const key = input.apiKey || invitation?.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ skipped: true, message: "Add a Gemini API key to enable automatic styling." });
  try { return NextResponse.json({ suggestion: await suggestMediaDesign({ ...input, apiKey: key }) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && /^(Gemini|Check your)/.test(error.message) ? error.message : "Design analysis failed. Your uploaded file and manual styles are unchanged." }, { status: 502 }); }
}
