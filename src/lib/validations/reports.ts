import { z } from "zod";

export const ORDER_ITEM_KINDS = [
  "THEME",
  "PDF_THEME",
  "VIDEO_TEMPLATE",
  "MUSIC",
  "PRINT",
  "SERVICE",
  "ADDON",
  "OTHER",
] as const;

export const ORDER_ITEM_KIND_LABELS: Record<(typeof ORDER_ITEM_KINDS)[number], string> =
  {
    THEME: "Website theme",
    PDF_THEME: "PDF theme",
    VIDEO_TEMPLATE: "Video template",
    MUSIC: "Music",
    PRINT: "Printing",
    SERVICE: "Service",
    ADDON: "Add-on",
    OTHER: "Other",
  };

/** Currencies the money columns know how to label. */
export const REPORT_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"] as const;

/**
 * Amounts are typed by a person in whole rupees (or dollars), and stored in
 * minor units. Doing the conversion inside the schema means every caller —
 * form, action, seed, import — crosses that boundary exactly once, in one
 * place, instead of each remembering to multiply by 100.
 *
 * Two decimal places is the limit because a third would be silently rounded
 * away on save, and a form that quietly changes what you typed is worse than
 * one that refuses it.
 */
const majorUnits = (label: string) =>
  z.coerce
    .number({ message: `${label} must be a number` })
    .min(0, `${label} cannot be negative`)
    .max(100_000_000, `${label} is implausibly large`)
    .refine(
      (value) =>
        Number.isInteger(Math.round(value * 100)) &&
        Math.abs(value * 100 - Math.round(value * 100)) < 1e-6,
      `${label} can have at most two decimal places`,
    )
    .transform((value) => Math.round(value * 100));

export const vendorFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required").max(120),
  category: z.string().trim().max(60).optional(),
  contactName: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.union([z.literal(""), z.string().email("Enter a valid email")]).optional(),
  notes: z.string().trim().max(2000).optional(),
  isActive: z.boolean().default(true),
});

export type VendorFormInput = z.infer<typeof vendorFormSchema>;
export type VendorFormValues = z.input<typeof vendorFormSchema>;

export const employeeFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required").max(120),
  role: z.string().trim().max(60).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.union([z.literal(""), z.string().email("Enter a valid email")]).optional(),
  notes: z.string().trim().max(2000).optional(),
  // Links this person to a login, where they have one. Most of a studio's
  // team never signs in, so it stays optional.
  userId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type EmployeeFormInput = z.infer<typeof employeeFormSchema>;
export type EmployeeFormValues = z.input<typeof employeeFormSchema>;

export const orderItemFormSchema = z.object({
  id: z.string().optional(),
  invitationId: z.string().min(1, "Pick an order"),
  kind: z.enum(ORDER_ITEM_KINDS).default("SERVICE"),
  // Blank is allowed here and filled from the name in the action — an admin
  // recording a one-off print run should not have to invent a slug.
  itemKey: z.string().trim().max(120).optional(),
  itemName: z.string().trim().min(1, "Item name is required").max(160),
  quantity: z.coerce.number().int().min(1, "At least one").max(100_000).default(1),
  unitPrice: majorUnits("Price"),
  unitCost: majorUnits("Cost"),
  currency: z.enum(REPORT_CURRENCIES).default("INR"),
  vendorId: z.string().optional(),
  employeeId: z.string().optional(),
  // `YYYY-MM-DD` in the studio's timezone; the action turns it into an instant.
  occurredOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
    .optional(),
  note: z.string().trim().max(500).optional(),
});

export type OrderItemFormInput = z.infer<typeof orderItemFormSchema>;
export type OrderItemFormValues = z.input<typeof orderItemFormSchema>;
