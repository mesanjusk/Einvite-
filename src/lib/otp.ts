import { createHash, randomInt, randomBytes, timingSafeEqual } from "crypto";

const PEPPER = process.env.AUTH_SECRET ?? "einvite-otp-dev-pepper";

export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtp(code: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${code}:${PEPPER}`).digest("hex");
}

export function verifyOtp(code: string, salt: string, hash: string): boolean {
  const expected = hashOtp(code, salt);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(`${token}:${PEPPER}`).digest("hex");
}
