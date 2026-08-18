import { createHash, randomBytes } from "crypto";

const PEPPER = process.env.AUTH_SECRET ?? "einvite-otp-dev-pepper";

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(`${token}:${PEPPER}`).digest("hex");
}
