"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

import { Reveal, RevealGroup } from "@/components/animation/reveal";
import { ConfettiBurst } from "@/components/animation/confetti-burst";
import { fadeUp } from "@/lib/animation-variants";
import { submitRsvpAction } from "@/lib/actions/rsvp";
import { useLocale } from "@/lib/i18n/locale-context";
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

export function RsvpSection({
  invitationId,
  guestId,
  guestName,
}: {
  invitationId: string;
  guestId?: string | null;
  guestName?: string | null;
}) {
  const { t } = useLocale();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<RsvpSubmissionFormValues, unknown, RsvpSubmissionInput>({
    resolver: zodResolver(rsvpSubmissionSchema),
    defaultValues: {
      invitationId,
      guestId: guestId ?? undefined,
      guestName: guestName ?? "",
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
            {t.rsvpEyebrow}
          </p>
          <h2
            className="mt-1.5 text-4xl"
            style={{ fontFamily: "var(--inv-font-display)", color: "var(--inv-primary)" }}
          >
            {t.willYouJoin}
          </h2>
        </Reveal>

        <Reveal variants={fadeUp} className="relative">
          <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="thanks"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-visible rounded-2xl border p-8 text-center"
              style={{ borderColor: "color-mix(in srgb, var(--inv-accent) 30%, transparent)" }}
            >
              <ConfettiBurst />
              <p style={{ fontFamily: "var(--inv-font-display)", color: "var(--inv-primary)" }} className="text-2xl">
                {t.rsvpThankYou}
              </p>
              <p className="mt-2 text-sm opacity-70">{t.yourResponseRecorded}</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3 }}
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-4 rounded-2xl border p-6"
              style={{ borderColor: "color-mix(in srgb, var(--inv-accent) 30%, transparent)" }}
            >
              <div className="grid gap-1.5">
                <Label>{t.fullName}</Label>
                <Input {...form.register("guestName")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>{t.emailOptional}</Label>
                  <Input type="email" {...form.register("email")} />
                </div>
                <div className="grid gap-1.5">
                  <Label>{t.phoneOptional}</Label>
                  <Input {...form.register("phone")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>{t.willYouAttend}</Label>
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
                      <SelectItem value="ACCEPTED">{t.joyfullyAccept}</SelectItem>
                      <SelectItem value="MAYBE">{t.maybeOption}</SelectItem>
                      <SelectItem value="DECLINED">{t.regretfullyDecline}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>{t.guestsLabel}</Label>
                  <Input type="number" min={1} max={20} {...form.register("guestCount")} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>{t.foodPreference}</Label>
                <Input placeholder={t.foodPlaceholder} {...form.register("foodPreference")} />
              </div>
              <div className="grid gap-1.5">
                <Label>{t.messageOptional}</Label>
                <Textarea rows={3} {...form.register("comment")} />
              </div>
              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="pill-button mt-2"
                style={{ background: "var(--inv-primary)", color: "var(--inv-background)" }}
              >
                {form.formState.isSubmitting ? t.sending : t.sendRsvp}
              </button>
            </motion.form>
          )}
          </AnimatePresence>
        </Reveal>
      </RevealGroup>
    </section>
  );
}
