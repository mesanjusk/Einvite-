import { randomBytes } from "crypto";
import { cookies } from "next/headers";

import { hashToken } from "@/lib/otp";

const DRAFT_PREFIX = "einv_draft_";
const OWNER_PREFIX = "einv_owner_";
const isProd = process.env.NODE_ENV === "production";

function cookieOpts(maxAge: number) {
  return { httpOnly: true, secure: isProd, sameSite: "lax" as const, path: "/", maxAge };
}

/** Creates a fresh draft-ownership cookie for a just-created guest invitation and returns its hash to persist on the record. */
export async function issueDraftSecret(invitationId: string): Promise<string> {
  const raw = randomBytes(24).toString("hex");
  const store = await cookies();
  store.set(`${DRAFT_PREFIX}${invitationId}`, raw, cookieOpts(60 * 60 * 24 * 30));
  return hashToken(raw);
}

/** Sets the long-lived "pre-logged" edit cookie once a phone/OTP verification (or /e/[token] visit) succeeds. */
export async function issueOwnerCookie(invitationId: string, rawEditToken: string) {
  const store = await cookies();
  store.set(`${OWNER_PREFIX}${invitationId}`, rawEditToken, cookieOpts(60 * 60 * 24 * 365));
}

export async function hasDraftAccess(
  invitationId: string,
  draftSecretHash: string | null | undefined,
): Promise<boolean> {
  if (!draftSecretHash) return false;
  const store = await cookies();
  const raw = store.get(`${DRAFT_PREFIX}${invitationId}`)?.value;
  return Boolean(raw) && hashToken(raw!) === draftSecretHash;
}

export async function hasOwnerAccess(
  invitationId: string,
  editTokenHash: string | null | undefined,
): Promise<boolean> {
  if (!editTokenHash) return false;
  const store = await cookies();
  const raw = store.get(`${OWNER_PREFIX}${invitationId}`)?.value;
  return Boolean(raw) && hashToken(raw!) === editTokenHash;
}

/** True if this browser is authorized to view/edit this guest invitation — either as the original drafter or via a verified phone link. */
export async function hasGuestAccess(
  invitation: { id: string; draftSecretHash: string | null },
  editTokenHash?: string | null,
): Promise<boolean> {
  if (await hasDraftAccess(invitation.id, invitation.draftSecretHash)) return true;
  return hasOwnerAccess(invitation.id, editTokenHash ?? null);
}
