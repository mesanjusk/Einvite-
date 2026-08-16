import { z } from "zod";

export const eventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().optional(),
  venueName: z.string().optional(),
  address: z.string().optional(),
  googleMapsUrl: z.url().optional().or(z.literal("")),
  dressCode: z.string().optional(),
  accentColor: z.string().optional(),
  tagline: z.string().optional(),
});

export const familyMemberSchema = z.object({
  side: z.enum(["BRIDE", "GROOM"]),
  relation: z.string().min(1),
  name: z.string().min(1),
  photo: z.string().optional(),
});

export const invitationWizardSchema = z.object({
  brideName: z.string().min(1, "Bride's name is required"),
  bridePhoto: z.string().optional(),
  groomName: z.string().min(1, "Groom's name is required"),
  groomPhoto: z.string().optional(),
  weddingDate: z.string().min(1, "Wedding date is required"),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  googleMapsUrl: z.url().optional().or(z.literal("")),
  customMessage: z.string().optional(),
  language: z
    .enum(["EN", "HI", "MR", "GU", "TA", "TE", "ES", "FR"])
    .default("EN"),
  themeSlug: z.string().min(1, "Choose a theme"),
  musicTrackId: z.string().optional(),
  customMusicUrl: z.string().optional(),
  events: z.array(eventSchema).default([]),
  familyMembers: z.array(familyMemberSchema).default([]),
  useAiCopy: z.boolean().default(true),
});

export type InvitationWizardInput = z.infer<typeof invitationWizardSchema>;
export type InvitationWizardFormValues = z.input<typeof invitationWizardSchema>;

export const rsvpSubmissionSchema = z.object({
  invitationId: z.string(),
  guestId: z.string().optional(),
  guestName: z.string().min(1, "Name is required"),
  email: z.email().optional().or(z.literal("")),
  phone: z.string().optional(),
  status: z.enum(["ACCEPTED", "DECLINED", "MAYBE"]),
  guestCount: z.coerce.number().int().min(1).max(20).default(1),
  foodPreference: z.string().optional(),
  comment: z.string().optional(),
});

export type RsvpSubmissionInput = z.infer<typeof rsvpSubmissionSchema>;
export type RsvpSubmissionFormValues = z.input<typeof rsvpSubmissionSchema>;

export const guestSchema = z.object({
  invitationId: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.email().optional().or(z.literal("")),
  phone: z.string().optional(),
  group: z.string().optional(),
});

export type GuestInput = z.infer<typeof guestSchema>;

export const otpRequestSchema = z.object({
  invitationId: z.string().min(1),
  phone: z.string().min(6, "Enter a valid mobile number"),
});

export type OtpRequestInput = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  invitationId: z.string().min(1),
  phone: z.string().min(6, "Enter a valid mobile number"),
  code: z.string().length(6, "Enter the 6-digit code"),
});

export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
