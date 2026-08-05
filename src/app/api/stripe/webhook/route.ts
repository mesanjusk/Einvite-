import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { db } from "@/lib/db";
import { getStripeClient } from "@/lib/stripe";

function planFromPriceId(priceId: string | undefined) {
  if (priceId === process.env.STRIPE_PRICE_ID_PREMIUM) return "PREMIUM" as const;
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) return "PRO" as const;
  return "FREE" as const;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });
  }

  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature ?? "", webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId ?? session.client_reference_id;
      if (!userId || !session.customer || !session.subscription) break;

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
      );
      const priceId = subscription.items.data[0]?.price.id;

      await db.subscription.upsert({
        where: { userId },
        update: {
          plan: planFromPriceId(priceId),
          status: "ACTIVE",
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
        },
        create: {
          userId,
          plan: planFromPriceId(priceId),
          status: "ACTIVE",
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
        },
      });
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0]?.price.id;
      const status =
        subscription.status === "active"
          ? "ACTIVE"
          : subscription.status === "trialing"
            ? "TRIALING"
            : subscription.status === "past_due"
              ? "PAST_DUE"
              : subscription.status === "canceled"
                ? "CANCELED"
                : "INCOMPLETE";

      await db.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          plan: event.type === "customer.subscription.deleted" ? "FREE" : planFromPriceId(priceId),
          status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
        },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
