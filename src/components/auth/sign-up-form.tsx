"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";

import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { signUpAction } from "@/lib/actions/auth";
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

export function SignUpForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", phone: "", password: "" },
  });

  async function onSubmit(values: SignUpInput) {
    setLoading(true);
    const result = await signUpAction(values);

    if (!result.success) {
      setLoading(false);
      toast.error(result.error);
      return;
    }

    const signInResult = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    setLoading(false);

    if (signInResult?.error) {
      toast.success("Account created — please sign in.");
      router.push("/sign-in");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="royal-auth-card w-full max-w-sm border-[#c9a35b]/28 bg-[#2a2723]/88 text-[#f4e8ce] shadow-[0_28px_80px_rgba(0,0,0,.38)] backdrop-blur-2xl">
      <CardHeader>
        <CardTitle className="text-center">
          <span className="font-script block text-3xl font-normal text-[#d2aa60]">Start your celebration</span>
          <span className="font-display royal-gold-text mt-1 block text-2xl">Create account</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jordan Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile number</FormLabel>
                  <FormControl>
                    <Input type="tel" autoComplete="tel" placeholder="9876543210" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/sign-in" className="font-semibold text-[#e0bd76] underline decoration-[#c59c52]/55 underline-offset-4">
            Sign in instead
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
