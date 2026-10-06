"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { phone: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setLoading(true);
    const result = await forgotPasswordAction(values);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(result.data.message);
    router.push(`/reset-password?phone=${encodeURIComponent(values.phone)}`);
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
        <p className="mb-5 text-sm leading-6 text-[#cfc3ad]">
          Enter the mobile number registered with your SK Digital account. We&apos;ll send a 6-digit OTP on WhatsApp.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile number</FormLabel>
                  <FormControl>
                    <Input type="tel" autoComplete="tel" inputMode="tel" placeholder="9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? "Sending OTP…" : "Send OTP"}
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
