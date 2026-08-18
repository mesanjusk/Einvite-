"use client";

import { useRouter } from "next/navigation";
import { Eye, Pencil } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function InvitationListCard({
  id,
  slug,
  brideName,
  groomName,
  status,
  themeName,
  rsvpCount,
}: {
  id: string;
  slug: string;
  brideName: string;
  groomName: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  themeName: string;
  rsvpCount: number;
}) {
  const router = useRouter();
  const manageUrl = `/dashboard/publish/deploy?invitationId=${id}`;
  const editUrl = `/dashboard/publish/sections?invitationId=${id}`;

  function stop(e: React.SyntheticEvent) {
    e.stopPropagation();
  }

  return (
    <Card
      role="link"
      tabIndex={0}
      onClick={() => router.push(manageUrl)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(manageUrl);
      }}
      className="hover:border-primary cursor-pointer gap-3 py-4 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 px-6">
        <h3 className="font-display min-w-0 flex-1 truncate text-base">
          {brideName} &amp; {groomName}
        </h3>
        <Badge variant={status === "PUBLISHED" ? "gold" : "secondary"} className="shrink-0">
          {status}
        </Badge>
      </div>
      <div className="flex items-center justify-between gap-2 px-6">
        <span className="text-muted-foreground min-w-0 truncate text-xs">
          {themeName} · {rsvpCount} RSVPs
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {status === "PUBLISHED" && (
            <Button variant="ghost" size="icon" className="size-8" asChild onClick={stop}>
              <a href={`/invite/${slug}`} target="_blank" aria-label="View live invitation">
                <Eye className="size-4" />
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => {
              stop(e);
              router.push(editUrl);
            }}
            aria-label="Edit invitation"
          >
            <Pencil className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
