"use server";

import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

import { db } from "@/lib/db";
import { EMAIL_FROM, getResendClient } from "@/lib/email/resend";
import { passwordResetEmailHtml } from "@/lib/email/templates";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signUpSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type SignUpInput,
} from "@/lib/validations/auth";

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

const PASSWORD_RESET_PREFIX = "password-reset:";
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function signUpAction(
  input: SignUpInput,
): Promise<ActionResult<{ userId: string }>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      subscription: {
        create: { plan: "FREE", status: "ACTIVE" },
      },
    },
  });

  return { success: true, data: { userId: user.id } };
}

export async function forgotPasswordAction(
  input: ForgotPasswordInput,
): Promise<ActionResult<{ message: string }>> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  const email = parsed.data.email;
  const genericMessage =
    "If an account exists for that email, a password reset link has been sent.";

  const user = await db.user.findUnique({ where: { email } });
  if (!user?.password || user.isActive === false) {
    return { success: true, data: { message: genericMessage } };
  }

  const identifier = `${PASSWORD_RESET_PREFIX}${email}`;
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const expires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await db.verificationToken.deleteMany({ where: { identifier } });
  await db.verificationToken.create({
    data: { identifier, token: tokenHash, expires },
  });

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";
  const resetUrl = `${appUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(rawToken)}`;

  try {
    const sendResult = await getResendClient().emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Reset your SK Digital password",
      html: passwordResetEmailHtml({ url: resetUrl }),
    });
    if (sendResult.error) {
      throw new Error(sendResult.error.message);
    }
  } catch (error) {
    console.error("Failed to send password reset email", error);
    await db.verificationToken.deleteMany({ where: { identifier, token: tokenHash } });
  }

  return { success: true, data: { message: genericMessage } };
}

export async function resetPasswordAction(
  input: ResetPasswordInput,
): Promise<ActionResult<{ message: string }>> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { token, password } = parsed.data;
  const tokenHash = hashResetToken(token);

  const stored = await db.verificationToken.findUnique({
    where: { token: tokenHash },
  });

  if (
    !stored ||
    !stored.identifier.startsWith(PASSWORD_RESET_PREFIX) ||
    stored.expires.getTime() <= Date.now()
  ) {
    if (stored) {
      await db.verificationToken.deleteMany({ where: { token: tokenHash } });
    }
    return {
      success: false,
      error: "This reset link is invalid or has expired. Please request a new one.",
    };
  }

  const email = stored.identifier.slice(PASSWORD_RESET_PREFIX.length);
  const user = await db.user.findUnique({ where: { email } });

  if (!user?.password || user.isActive === false) {
    await db.verificationToken.deleteMany({ where: { identifier: stored.identifier } });
    return {
      success: false,
      error: "This reset link is invalid or has expired. Please request a new one.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { password: passwordHash },
    }),
    db.verificationToken.deleteMany({
      where: { identifier: stored.identifier },
    }),
  ]);

  return {
    success: true,
    data: { message: "Password updated. You can now sign in with your new password." },
  };
}
