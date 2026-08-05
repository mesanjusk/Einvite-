"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Reveal, RevealGroup } from "@/components/animation/reveal";
import { fadeUp } from "@/lib/animation-variants";
import { submitRsvpAction } from "@/lib/actions/rsvp";
import {
  rsvpSubmissionSchema,
  type RsvpSubmissionInput,
  type RsvpSubmissionFormValues,
} from "@/lib/validations/invitation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RsvpSection({ invitationId }: { invitationId: string }) {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<RsvpSubmissionFormValues, unknown, RsvpSubmissionInput>({
    resolver: zodResolver(rsvpSubmissionSchema),
    defaultValues: {
      invitationId,
      guestName: "",
      email: "",
      phone: "",
      status: "ACCEPTED",
      guestCount: 1,
      foodPreference: "",
      comment: "",
    },
  });

  async function onSubmit(values: RsvpSubmissionInput) {
    const result = await submitRsvpAction(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setSubmitted(true);
  }

  return (
    <section
      id="rsvp"
      className="relative flex min-h-svh items-center justify-center px-6 py-14"
      style={{ background: "var(--inv-background)" }}
    >
      <RevealGroup className="w-full max-w-md">
        <Reveal variants={fadeUp} className="mb-8 text-center">
          <p className="text-xs tracking-[0.3em] uppercase" style={{ color: "var(--inv-accent)" }}>
            RSVP
          </p>
          <h2
            className="mt-1.5 text-4xl"
            style={{ fontFamily: "var(--inv-font-display)", color: "var(--inv-primary)" }}
          >
            Will you join us?
          </h2>
        </Reveal>

        <Reveal variants={fadeUp}>
          {submitted ? (
            <div
              className="rounded-2xl border p-8 text-center"
              style={{ borderColor: "color-mix(in srgb, var(--inv-accent) 30%, transparent)" }}
            >
              <p style={{ fontFamily: "var(--inv-font-display)", color: "var(--inv-primary)" }} className="text-2xl">
                Thank you!
              </p>
              <p className="mt-2 text-sm opacity-70">Your response has been recorded.</p>
            </div>
          ) : (
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-4 rounded-2xl border p-6"
              style={{ borderColor: "color-mix(in srgb, var(--inv-accent) 30%, transparent)" }}
            >
              <div className="grid gap-1.5">
                <Label>Full name</Label>
                <Input {...form.register("guestName")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Email (optional)</Label>
                  <Input type="email" {...form.register("email")} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Phone (optional)</Label>
                  <Input {...form.register("phone")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>Will you attend?</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(v) =>
                      form.setValue("status", v as RsvpSubmissionInput["status"])
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACCEPTED">Joyfully accept</SelectItem>
                      <SelectItem value="MAYBE">Maybe</SelectItem>
                      <SelectItem value="DECLINED">Regretfully decline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Guests</Label>
                  <Input type="number" min={1} max={20} {...form.register("guestCount")} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Food preference (optional)</Label>
                <Input placeholder="Veg, non-veg, vegan…" {...form.register("foodPreference")} />
              </div>
              <div className="grid gap-1.5">
                <Label>Message (optional)</Label>
                <Textarea rows={3} {...form.register("comment")} />
              </div>
              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="pill-button mt-2"
                style={{ background: "var(--inv-primary)", color: "var(--inv-background)" }}
              >
                {form.formState.isSubmitting ? "Sending…" : "Send RSVP"}
              </button>
            </form>
          )}
        </Reveal>
      </RevealGroup>
    </section>
  );
}
