"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { getAdmin } from "@/lib/admin-guard";
import { fromDateInputValue } from "@/lib/reports";
import { slugify, randomSuffix } from "@/lib/utils/slug";
import type { ActionResult } from "@/lib/actions/auth";
import {
  employeeFormSchema,
  orderItemFormSchema,
  vendorFormSchema,
  type EmployeeFormInput,
  type OrderItemFormInput,
  type VendorFormInput,
} from "@/lib/validations/reports";

// Every action in this file is admin-only and says so on its own, rather than
// leaning on the `/admin` layout's redirect. A server action is a POST
// endpoint with a public URL: the layout guards the page that renders the
// button, not the endpoint the button calls.
const DENIED = { success: false, error: "Not authorised" } as const;

const REPORT_PATHS = [
  "/admin/reports",
  "/admin/reports/items",
  "/admin/reports/orders",
  "/admin/reports/vendors",
  "/admin/reports/employees",
  "/admin/reports/performance",
];

function revalidateReports(extra?: string) {
  for (const path of REPORT_PATHS) revalidatePath(path);
  if (extra) revalidatePath(extra);
}

/**
 * A slug that is unique in its collection. `slugify` can return an empty
 * string (a name written entirely in Devanagari, say), and two suppliers may
 * genuinely share a name, so both cases fall through to a random suffix
 * rather than colliding on the unique index.
 */
async function uniqueSlug(
  name: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(name) || "entry";
  if (!(await exists(base))) return base;

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${base}-${randomSuffix()}`;
    if (!(await exists(candidate))) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Empty strings out of a form mean "not set", not "set to empty". */
function orNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

// ---------------------------------------------------------------------------
// Vendors
// ---------------------------------------------------------------------------

export async function upsertVendorAction(
  input: VendorFormInput,
): Promise<ActionResult> {
  if (!(await getAdmin())) return DENIED;

  const parsed = vendorFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const { id, name, category, contactName, phone, email, notes, isActive } =
    parsed.data;

  const data = {
    name,
    category: orNull(category),
    contactName: orNull(contactName),
    phone: orNull(phone),
    email: orNull(email),
    notes: orNull(notes),
    isActive,
  };

  if (id) {
    // The slug is left alone on edit on purpose: it is what every past report
    // row groups by, and renaming a supplier must not split their history.
    await db.vendor.update({ where: { id }, data });
  } else {
    const slug = await uniqueSlug(name, async (candidate) =>
      Boolean(
        await db.vendor.findUnique({
          where: { slug: candidate },
          select: { id: true },
        }),
      ),
    );
    await db.vendor.create({ data: { ...data, slug } });
  }

  revalidateReports();
  return { success: true, data: undefined };
}

export async function deleteVendorAction(vendorId: string): Promise<ActionResult> {
  if (!(await getAdmin())) return DENIED;

  const lineCount = await db.orderItem.count({ where: { vendorId } });
  if (lineCount > 0) {
    // Deleting would blank the vendor on every past line and quietly move
    // that money into "No vendor". Deactivating keeps the history readable.
    return {
      success: false,
      error: `${lineCount} order line${lineCount === 1 ? "" : "s"} reference this vendor. Deactivate it instead.`,
    };
  }

  await db.vendor.delete({ where: { id: vendorId } });
  revalidateReports();
  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------

export async function upsertEmployeeAction(
  input: EmployeeFormInput,
): Promise<ActionResult> {
  if (!(await getAdmin())) return DENIED;

  const parsed = employeeFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const { id, name, role, phone, email, notes, userId, isActive } = parsed.data;

  const linkedUserId = orNull(userId);
  if (linkedUserId) {
    const clash = await db.employee.findUnique({
      where: { userId: linkedUserId },
      select: { id: true, name: true },
    });
    if (clash && clash.id !== id) {
      return {
        success: false,
        error: `That login is already linked to ${clash.name}.`,
      };
    }
  }

  const data = {
    name,
    role: orNull(role),
    phone: orNull(phone),
    email: orNull(email),
    notes: orNull(notes),
    userId: linkedUserId,
    isActive,
  };

  if (id) {
    await db.employee.update({ where: { id }, data });
  } else {
    const slug = await uniqueSlug(name, async (candidate) =>
      Boolean(
        await db.employee.findUnique({
          where: { slug: candidate },
          select: { id: true },
        }),
      ),
    );
    await db.employee.create({ data: { ...data, slug } });
  }

  revalidateReports();
  return { success: true, data: undefined };
}

export async function deleteEmployeeAction(employeeId: string): Promise<ActionResult> {
  if (!(await getAdmin())) return DENIED;

  const lineCount = await db.orderItem.count({ where: { employeeId } });
  if (lineCount > 0) {
    return {
      success: false,
      error: `${lineCount} order line${lineCount === 1 ? "" : "s"} are credited to this person. Deactivate them instead.`,
    };
  }

  await db.employee.delete({ where: { id: employeeId } });
  revalidateReports();
  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Order lines
// ---------------------------------------------------------------------------

export async function upsertOrderItemAction(
  input: OrderItemFormInput,
): Promise<ActionResult> {
  if (!(await getAdmin())) return DENIED;

  const parsed = orderItemFormSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const {
    id,
    invitationId,
    kind,
    itemKey,
    itemName,
    quantity,
    unitPrice,
    unitCost,
    currency,
    vendorId,
    employeeId,
    occurredOn,
    note,
  } = parsed.data;

  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
    select: { id: true },
  });
  if (!invitation) return { success: false, error: "That order no longer exists." };

  // A blank key falls back to the name so the item-wise report still groups
  // two identically-named lines together instead of listing them twice.
  // `slugify` can come back empty on a name with no ASCII in it, hence the
  // last resort — an empty key would collapse every such line into one row.
  const itemGroupKey = orNull(itemKey) ?? slugify(itemName) ?? "";

  const data = {
    invitationId,
    kind,
    itemKey: itemGroupKey || "item",
    itemName,
    quantity,
    unitPrice,
    unitCost,
    currency,
    vendorId: orNull(vendorId),
    employeeId: orNull(employeeId),
    // Missing means today, in the studio's timezone — not the server's.
    occurredAt: fromDateInputValue(occurredOn) ?? new Date(),
    note: orNull(note),
  };

  if (id) {
    await db.orderItem.update({ where: { id }, data });
  } else {
    await db.orderItem.create({ data });
  }

  revalidateReports(`/admin/invitations/${invitationId}`);
  return { success: true, data: undefined };
}

export async function deleteOrderItemAction(
  orderItemId: string,
): Promise<ActionResult> {
  if (!(await getAdmin())) return DENIED;

  const line = await db.orderItem.findUnique({
    where: { id: orderItemId },
    select: { invitationId: true },
  });
  if (!line) return { success: false, error: "That line is already gone." };

  await db.orderItem.delete({ where: { id: orderItemId } });
  revalidateReports(`/admin/invitations/${line.invitationId}`);
  return { success: true, data: undefined };
}
