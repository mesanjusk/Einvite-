"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DomainForm({ invitationId }: { invitationId: string }) {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/deploy/domain", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ invitationId, domain }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error);
      return;
    }
    toast.success("Domain added — point its DNS to Vercel to finish setup.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="your-names-wedding.com"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Adding…" : "Add domain"}
      </Button>
    </form>
  );
}
