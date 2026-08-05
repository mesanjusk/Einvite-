import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripeClient, isStripeConfigured, PLAN_PRICE_IDS } from "@/lib/stripe";

const bodySchema = z.object({ plan: z.enum(["PRO", "PREMIUM"]) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Billing isn't configured yet. Add STRIPE_SECRET_KEY and STRIPE_PRICE_ID_PRO/PREMIUM to .env.",
      },
      { status: 501 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId = PLAN_PRICE_IDS[parsed.data.plan];
  if (!priceId) {
    return NextResponse.json(
      { error: `No Stripe price configured for the ${parsed.data.plan} plan.` },
      { status: 500 },
    );
  }

  const stripe = getStripeClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const subscription = await db.subscription.findUnique({
    where: { userId: session.user.id },
  });

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: subscription?.stripeCustomerId ?? undefined,
    customer_email: subscription?.stripeCustomerId ? undefined : session.user.email!,
    client_reference_id: session.user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?success=1`,
    cancel_url: `${appUrl}/dashboard/billing?canceled=1`,
    metadata: { userId: session.user.id, plan: parsed.data.plan },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
