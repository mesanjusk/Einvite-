import type { Metadata } from "next";
import { Check } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isStripeConfigured } from "@/lib/stripe";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UpgradeButton, ManageBillingButton } from "@/components/dashboard/billing-actions";

export const metadata: Metadata = { title: "Billing" };

const PLANS = [
  {
    id: "FREE" as const,
    name: "Free",
    price: "$0",
    features: ["1 invitation", "3 themes", "Basic RSVP", "Studio watermark"],
  },
  {
    id: "PRO" as const,
    name: "Pro",
    price: "$19/mo",
    features: ["5 invitations", "All themes", "Custom domain", "No watermark", "AI copywriting"],
  },
  {
    id: "PREMIUM" as const,
    name: "Premium",
    price: "$49/mo",
    features: ["Unlimited invitations", "Priority support", "Advanced analytics", "White-label"],
  },
];

export default async function BillingPage() {
  const session = await auth();
  const subscription = await db.subscription.findUnique({
    where: { userId: session!.user.id },
  });

  const currentPlan = subscription?.plan ?? "FREE";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-muted-foreground text-sm">
          Current plan: <Badge>{currentPlan}</Badge>
          {subscription?.currentPeriodEnd && (
            <span className="ml-2">
              Renews {subscription.currentPeriodEnd.toLocaleDateString()}
            </span>
          )}
        </p>
      </div>

      {!isStripeConfigured() && (
        <Card className="border-accent/50">
          <CardContent className="text-muted-foreground text-sm">
            Billing checkout is wired to Stripe but isn&apos;t active yet — add{" "}
            <code className="font-mono">STRIPE_SECRET_KEY</code>,{" "}
            <code className="font-mono">STRIPE_PRICE_ID_PRO</code>, and{" "}
            <code className="font-mono">STRIPE_PRICE_ID_PREMIUM</code> to your environment to
            enable upgrades.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={currentPlan === plan.id ? "border-primary" : ""}>
            <CardHeader>
              <CardTitle className="font-display">{plan.name}</CardTitle>
              <CardDescription className="text-foreground text-xl font-semibold">
                {plan.price}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ul className="flex flex-col gap-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="text-accent size-4" />
                    {feature}
                  </li>
                ))}
              </ul>
              {plan.id !== "FREE" && currentPlan !== plan.id && (
                <UpgradeButton plan={plan.id} />
              )}
              {currentPlan === plan.id && (
                <Badge variant="secondary" className="w-fit">
                  Current plan
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {subscription?.stripeCustomerId && (
        <div>
          <ManageBillingButton />
        </div>
      )}
    </div>
  );
}
