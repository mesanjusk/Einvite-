import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add your Stripe keys to .env to enable billing.",
    );
  }
  if (!stripeClient) {
    stripeClient = new Stripe(apiKey);
  }
  return stripeClient;
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export const PLAN_PRICE_IDS: Record<"PRO" | "PREMIUM", string | undefined> = {
  PRO: process.env.STRIPE_PRICE_ID_PRO,
  PREMIUM: process.env.STRIPE_PRICE_ID_PREMIUM,
};
