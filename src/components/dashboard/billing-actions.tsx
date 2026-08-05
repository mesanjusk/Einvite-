"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function UpgradeButton({ plan }: { plan: "PRO" | "PREMIUM" }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "Couldn't start checkout.");
      return;
    }
    window.location.href = data.url;
  }

  return (
    <Button onClick={handleClick} disabled={loading} variant={plan === "PREMIUM" ? "gold" : "default"}>
      {loading ? "Redirecting…" : `Upgrade to ${plan === "PRO" ? "Pro" : "Premium"}`}
    </Button>
  );
}

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const response = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "Couldn't open billing portal.");
      return;
    }
    window.location.href = data.url;
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      {loading ? "Opening…" : "Manage billing"}
    </Button>
  );
}
