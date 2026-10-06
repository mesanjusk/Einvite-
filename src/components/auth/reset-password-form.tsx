"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { resetPasswordAction } from "@/lib/actions/auth";
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
  const token = searchParams.get("token") ?? "";
  const [loading, setLoading] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setLoading(true);
    const result = await resetPasswordAction({ ...values, token });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    router.replace("/sign-in?reset=1");
  }

  if (!token) {
    return (
      <Card className="royal-auth-card w-full max-w-sm border-[#c9a35b]/28 bg-[#2a2723]/88 text-[#f4e8ce] shadow-[0_28px_80px_rgba(0,0,0,.38)] backdrop-blur-2xl">
        <CardHeader>
          <CardTitle className="font-display royal-gold-text text-center text-2xl">Invalid reset link</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 text-center">
          <p className="text-sm leading-6 text-[#e7dcc8]">
            This password reset link is incomplete. Request a new link to continue.
          </p>
          <Button asChild>
            <Link href="/forgot-password">Request new link</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="royal-auth-card w-full max-w-sm border-[#c9a35b]/28 bg-[#2a2723]/88 text-[#f4e8ce] shadow-[0_28px_80px_rgba(0,0,0,.38)] backdrop-blur-2xl">
      <CardHeader>
        <CardTitle className="text-center">
          <span className="font-script block text-3xl font-normal text-[#d2aa60]">Choose something secure</span>
          <span className="font-display royal-gold-text mt-1 block text-2xl">New password</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <input type="hidden" {...form.register("token")} value={token} />
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
              Use at least 8 characters with uppercase, lowercase, and a number.
            </p>
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? "Updating…" : "Update password"}
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center text-sm">
          <Link
            href="/sign-in"
            className="font-semibold text-[#e0bd76] underline decoration-[#c59c52]/55 underline-offset-4"
          >
            Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
