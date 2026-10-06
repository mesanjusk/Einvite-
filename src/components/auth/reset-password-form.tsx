"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { forgotPasswordAction, resetPasswordAction } from "@/lib/actions/auth";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { phone, otp: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setLoading(true);
    const result = await resetPasswordAction({ ...values, phone });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    router.replace("/sign-in?reset=1");
  }

  async function resendOtp() {
    if (!phone) return;
    setResending(true);
    const result = await forgotPasswordAction({ phone });
    setResending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("OTP sent. Please check WhatsApp.");
  }

  if (!phone) {
    return (
      <Card className="royal-auth-card w-full max-w-sm border-[#c9a35b]/28 bg-[#2a2723]/88 text-[#f4e8ce] shadow-[0_28px_80px_rgba(0,0,0,.38)] backdrop-blur-2xl">
        <CardHeader>
          <CardTitle className="font-display royal-gold-text text-center text-2xl">Mobile number required</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 text-center">
          <p className="text-sm leading-6 text-[#e7dcc8]">
            Start password recovery using your registered mobile number.
          </p>
          <Button asChild>
            <Link href="/forgot-password">Send OTP</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="royal-auth-card w-full max-w-sm border-[#c9a35b]/28 bg-[#2a2723]/88 text-[#f4e8ce] shadow-[0_28px_80px_rgba(0,0,0,.38)] backdrop-blur-2xl">
      <CardHeader>
        <CardTitle className="text-center">
          <span className="font-script block text-3xl font-normal text-[#d2aa60]">Verify your mobile</span>
          <span className="font-display royal-gold-text mt-1 block text-2xl">Set new password</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-5 text-sm leading-6 text-[#cfc3ad]">
          Enter the 6-digit OTP sent to your WhatsApp number, then choose a new password.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <input type="hidden" {...form.register("phone")} value={phone} />
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>6-digit OTP</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="123456"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-xs leading-5 text-[#bcae96]">
              Password: at least 8 characters with uppercase, lowercase, and a number.
            </p>
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? "Updating…" : "Verify OTP & update password"}
            </Button>
          </form>
        </Form>

        <div className="mt-5 flex items-center justify-between gap-3 text-xs">
          <Button type="button" variant="ghost" disabled={resending} onClick={resendOtp}>
            {resending ? "Sending…" : "Resend OTP"}
          </Button>
          <Link
            href="/forgot-password"
            className="font-semibold text-[#e0bd76] underline decoration-[#c59c52]/55 underline-offset-4"
          >
            Change mobile
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
