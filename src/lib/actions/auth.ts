"use server";

import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";

import { db } from "@/lib/db";
import { hashToken } from "@/lib/otp";
import { maskPhone, normalizePhone } from "@/lib/phone";
import { sendPasswordResetOtp } from "@/lib/whatsapp";
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

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export async function signUpAction(
  input: SignUpInput,
): Promise<ActionResult<{ userId: string }>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return { success: false, error: "Enter a valid mobile number." };
  }

  const { name, email, password } = parsed.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  const existingPhone = await db.user.findFirst({ where: { phone } });
  if (existingPhone) {
    return { success: false, error: "An account with this mobile number already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      name,
      email,
      phone,
      password: passwordHash,
      subscription: {
        create: { plan: "FREE", status: "ACTIVE" },
      },
    },
  });

  return { success: true, data: { userId: user.id } };
}

async function findUserByRecoveryPhone(phone: string) {
  const direct = await db.user.findFirst({ where: { phone } });
  if (direct) return direct;

  // Existing invitation owners already have a durable verified PhoneLink.
  // Several invitations may share a phone. Find a link that is attached to a
  // signed-in account rather than selecting one arbitrary guest invitation.
  const phoneLinks = await db.phoneLink.findMany({
    where: { phone },
    select: { invitation: { select: { userId: true } } },
  });
  for (const link of phoneLinks) {
    if (!link.invitation.userId) continue;
    const linkedUser = await db.user.findUnique({
      where: { id: link.invitation.userId },
    });
    if (linkedUser) return linkedUser;
  }

  // Compatibility for older staff accounts that stored the number on Employee.
  const employees = await db.employee.findMany({
    where: { phone: { not: null } },
    select: { userId: true, email: true, phone: true },
  });
  const employee = employees.find((item) => item.phone && normalizePhone(item.phone) === phone);
  if (!employee) return null;

  if (employee.userId) {
    const linkedUser = await db.user.findUnique({ where: { id: employee.userId } });
    if (linkedUser) return linkedUser;
  }

  return employee.email
    ? db.user.findUnique({ where: { email: employee.email } })
    : null;
}

export async function forgotPasswordAction(
  input: ForgotPasswordInput,
): Promise<ActionResult<{ message: string; maskedPhone?: string }>> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid mobile number" };
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return { success: false, error: "Enter a valid mobile number." };
  }

  const genericMessage =
    "If this mobile number is registered, a 6-digit OTP has been sent on WhatsApp.";

  const user = await findUserByRecoveryPhone(phone);
  if (!user?.password || user.isActive === false) {
    return { success: true, data: { message: genericMessage } };
  }

  const existing = await db.passwordResetOtp.findUnique({ where: { phone } });
  if (
    existing &&
    existing.lastSentAt.getTime() > Date.now() - RESEND_COOLDOWN_MS &&
    existing.expiresAt.getTime() > Date.now()
  ) {
    return {
      success: true,
      data: { message: genericMessage, maskedPhone: maskPhone(phone) },
    };
  }

  const otp = randomInt(100000, 1000000).toString();
  const otpHash = hashToken(`${phone}:${otp}`);
  const now = new Date();

  await db.passwordResetOtp.upsert({
    where: { phone },
    create: {
      phone,
      otpHash,
      expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      attempts: 0,
      lastSentAt: now,
    },
    update: {
      otpHash,
      expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      attempts: 0,
      lastSentAt: now,
    },
  });

  const delivery = await sendPasswordResetOtp(phone, otp);
  if (!delivery.delivered && !delivery.devMode) {
    await db.passwordResetOtp.deleteMany({ where: { phone } });
    return {
      success: false,
      error: "We could not send the OTP right now. Please try again.",
    };
  }

  return {
    success: true,
    data: { message: genericMessage, maskedPhone: maskPhone(phone) },
  };
}

export async function resetPasswordAction(
  input: ResetPasswordInput,
): Promise<ActionResult<{ message: string }>> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return { success: false, error: "Enter a valid mobile number." };
  }

  const record = await db.passwordResetOtp.findUnique({ where: { phone } });
  if (!record || record.expiresAt.getTime() <= Date.now()) {
    if (record) await db.passwordResetOtp.deleteMany({ where: { phone } });
    return { success: false, error: "OTP is invalid or expired. Request a new OTP." };
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await db.passwordResetOtp.deleteMany({ where: { phone } });
    return { success: false, error: "Too many incorrect attempts. Request a new OTP." };
  }

  const submittedHash = hashToken(`${phone}:${parsed.data.otp}`);
  if (submittedHash !== record.otpHash) {
    await db.passwordResetOtp.update({
      where: { phone },
      data: { attempts: { increment: 1 } },
    });
    return { success: false, error: "Incorrect OTP." };
  }

  const user = await findUserByRecoveryPhone(phone);
  if (!user?.password || user.isActive === false) {
    await db.passwordResetOtp.deleteMany({ where: { phone } });
    return { success: false, error: "Unable to reset this account." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { password: passwordHash, phone: user.phone ?? phone },
    }),
    db.passwordResetOtp.deleteMany({ where: { phone } }),
  ]);

  return {
    success: true,
    data: { message: "Password updated. You can now sign in with your new password." },
  };
}
