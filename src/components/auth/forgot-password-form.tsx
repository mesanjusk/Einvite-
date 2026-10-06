"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { forgotPasswordAction } from "@/lib/actions/auth";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
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

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setLoading(true);
    const result = await forgotPasswordAction(values);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setSent(true);
  }

  return (
    <Card className="royal-auth-card w-full max-w-sm border-[#c9a35b]/28 bg-[#2a2723]/88 text-[#f4e8ce] shadow-[0_28px_80px_rgba(0,0,0,.38)] backdrop-blur-2xl">
      <CardHeader>
        <CardTitle className="text-center">
          <span className="font-script block text-3xl font-normal text-[#d2aa60]">Account recovery</span>
          <span className="font-display royal-gold-text mt-1 block text-2xl">Reset password</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="grid gap-5 text-center">
            <p className="text-sm leading-6 text-[#e7dcc8]">
              If an account exists for that email, we sent a secure reset link. The link expires in 1 hour.
            </p>
            <Button asChild>
              <Link href="/sign-in">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-5 text-sm leading-6 text-[#cfc3ad]">
              Enter the email used for your SK Digital account and we&apos;ll send you a secure reset link.
            </p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading} className="mt-2">
                  {loading ? "Sending…" : "Send reset link"}
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
