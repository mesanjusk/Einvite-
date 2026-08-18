import type { Metadata } from "next";

import { db } from "@/lib/db";
import { isInstagramSendConfigured } from "@/lib/instagram";
import { InstagramAutomationFormDialog } from "@/components/admin/instagram-automation-form-dialog";
import { InstagramAutomationToggle } from "@/components/admin/instagram-automation-toggle";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import { deleteInstagramAutomationAction } from "@/lib/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Instagram Automation" };

const OUTCOME_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  REPLY_SENT: { label: "Reply sent", variant: "default" },
  DUPLICATE_SKIPPED: { label: "Already claimed", variant: "secondary" },
  TRIGGER_NOT_MATCHED: { label: "No trigger word", variant: "outline" },
  NO_AUTOMATION: { label: "No automation", variant: "outline" },
  AUTOMATION_INACTIVE: { label: "Paused", variant: "outline" },
  SEND_FAILED: { label: "Send failed", variant: "destructive" },
};

export default async function AdminInstagramPage() {
  const [automations, logs] = await Promise.all([
    db.instagramAutomation.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { leads: true, logs: true } } },
    }),
    db.instagramCommentLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { automation: { select: { label: true } } },
    }),
  ]);

  // Reels that have received comments but have no rule yet — the fast path
  // for turning a real comment into a new automation without hunting for IDs.
  const automatedMediaIds = new Set(automations.map((a) => a.mediaId));
  const unautomatedMediaIds = [
    ...new Set(logs.filter((l) => !automatedMediaIds.has(l.mediaId)).map((l) => l.mediaId)),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Instagram Automation</h1>
          <p className="text-muted-foreground text-sm">
            Per-reel comment-to-DM rules. Each reel gets its own trigger word and reply — a
            comment on a reel without a rule is logged but never answered.
          </p>
        </div>
        <InstagramAutomationFormDialog />
      </div>

      {!isInstagramSendConfigured() && (
        <Card className="border-dashed">
          <CardContent className="text-muted-foreground py-4 text-sm">
            <code className="font-mono">IG_ACCESS_TOKEN</code> isn&apos;t set — rules can be
            managed here, but replies will fail until it&apos;s configured in the environment.
          </CardContent>
        </Card>
      )}

      {automations.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            No reel automations yet. Comment on a reel to make it appear in the activity log
            below, then use &ldquo;Automate this reel&rdquo; to set it up.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {automations.map((automation) => (
          <Card key={automation.id} className="py-0">
            <CardContent className="flex flex-col gap-3 py-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{automation.label}</p>
                  <p className="text-muted-foreground font-mono text-xs">{automation.mediaId}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <InstagramAutomationToggle
                    automationId={automation.id}
                    isActive={automation.isActive}
                  />
                  <InstagramAutomationFormDialog
                    automation={{
                      id: automation.id,
                      mediaId: automation.mediaId,
                      label: automation.label,
                      permalink: automation.permalink,
                      triggerWord: automation.triggerWord,
                      replyMessage: automation.replyMessage,
                      duplicateMessage: automation.duplicateMessage,
                      isActive: automation.isActive,
                    }}
                  />
                  <DeleteEntityButton
                    id={automation.id}
                    confirmLabel={`Delete the ${automation.label} automation? Its claim history goes too.`}
                    action={deleteInstagramAutomationAction}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={automation.isActive ? "default" : "outline"}>
                  {automation.isActive ? "Active" : "Paused"}
                </Badge>
                <Badge variant="secondary">Trigger: {automation.triggerWord}</Badge>
              </div>

              <p className="text-muted-foreground line-clamp-2 text-xs">
                {automation.replyMessage}
              </p>

              <p className="text-muted-foreground text-xs">
                {automation._count.leads} link(s) claimed · {automation._count.logs} comment(s)
                logged
                {automation.permalink && (
                  <>
                    {" · "}
                    <a
                      href={automation.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2"
                    >
                      View reel
                    </a>
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {unautomatedMediaIds.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3 py-4">
            <div>
              <p className="font-medium">Reels with comments but no automation</p>
              <p className="text-muted-foreground text-sm">
                These reels received comments that went unanswered because no rule covers them.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {unautomatedMediaIds.map((mediaId) => (
                <div
                  key={mediaId}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <span className="truncate font-mono text-xs">{mediaId}</span>
                  <InstagramAutomationFormDialog presetMediaId={mediaId} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <div>
            <p className="font-medium">Recent comment activity</p>
            <p className="text-muted-foreground text-sm">
              Every comment the webhook processed, and what was replied.
            </p>
          </div>

          {logs.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No comments received yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-left text-xs">
                    <th className="py-2 pr-3 font-medium">When</th>
                    <th className="py-2 pr-3 font-medium">From</th>
                    <th className="py-2 pr-3 font-medium">Reel</th>
                    <th className="py-2 pr-3 font-medium">Comment</th>
                    <th className="py-2 pr-3 font-medium">Outcome</th>
                    <th className="py-2 font-medium">Reply</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const outcome = OUTCOME_LABELS[log.outcome] ?? {
                      label: log.outcome,
                      variant: "outline" as const,
                    };
                    return (
                      <tr key={log.id} className="border-b last:border-0">
                        <td className="text-muted-foreground py-2 pr-3 whitespace-nowrap text-xs">
                          {log.createdAt.toLocaleString()}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {log.username ? `@${log.username}` : "—"}
                        </td>
                        <td className="text-muted-foreground max-w-[10rem] truncate py-2 pr-3 text-xs">
                          {log.automation?.label ?? log.mediaId}
                        </td>
                        <td className="max-w-[12rem] truncate py-2 pr-3">{log.commentText}</td>
                        <td className="py-2 pr-3">
                          <Badge variant={outcome.variant}>{outcome.label}</Badge>
                        </td>
                        <td className="text-muted-foreground max-w-[16rem] truncate py-2 text-xs">
                          {log.error ?? log.replyText ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
