import type { Metadata } from "next";

import { db } from "@/lib/db";
import {
  fetchInstagramMedia,
  fetchRecentInstagramMedia,
  isInstagramSendConfigured,
  type InstagramMedia,
} from "@/lib/instagram";
import { InstagramAutomationFormDialog } from "@/components/admin/instagram-automation-form-dialog";
import { InstagramAutomationToggle } from "@/components/admin/instagram-automation-toggle";
import { InstagramDmRuleFormDialog } from "@/components/admin/instagram-dm-rule-form-dialog";
import { InstagramDmRuleToggle } from "@/components/admin/instagram-dm-rule-toggle";
import { InstagramMediaCard } from "@/components/admin/instagram-media-card";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import {
  deleteInstagramAutomationAction,
  deleteInstagramDmRuleAction,
} from "@/lib/actions/admin";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Instagram Automation" };

const OUTCOME_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  REPLY_SENT: { label: "Reply sent", variant: "default" },
  DUPLICATE_SKIPPED: { label: "Already claimed", variant: "secondary" },
  TRIGGER_NOT_MATCHED: { label: "No trigger word", variant: "outline" },
  NO_AUTOMATION: { label: "No automation", variant: "outline" },
  AUTOMATION_INACTIVE: { label: "Paused", variant: "outline" },
  NOT_FOLLOWING: { label: "Asked to follow", variant: "secondary" },
  SEND_FAILED: { label: "Send failed", variant: "destructive" },
};

const DM_OUTCOME_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  REPLY_SENT: { label: "Reply sent", variant: "default" },
  DUPLICATE_REPLY_SENT: { label: "Already had a link", variant: "secondary" },
  NO_RULE_MATCHED: { label: "Left for you", variant: "outline" },
  DATA_DELETED: { label: "Data deleted", variant: "secondary" },
  DATA_DELETE_FAILED: { label: "Delete failed", variant: "destructive" },
  SEND_FAILED: { label: "Send failed", variant: "destructive" },
};

const DM_MATCH_LABELS: Record<string, string> = {
  EXACT: "is exactly",
  CONTAINS: "contains",
  STARTS_WITH: "starts with",
  ANY: "any message",
};

export default async function AdminInstagramPage() {
  const [automations, logs, dmRules, messageLogs] = await Promise.all([
    db.instagramAutomation.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { leads: true, logs: true } } },
    }),
    db.instagramCommentLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { automation: { select: { label: true } } },
    }),
    db.instagramDmRule.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    }),
    db.instagramMessageLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { rule: { select: { label: true } } },
    }),
  ]);

  // Who claimed an invitation, and what they've built with it — the
  // lead-to-invitation view the comment log alone can't show.
  const claims = await db.instagramLink.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
    include: {
      invitation: {
        select: {
          id: true,
          slug: true,
          brideName: true,
          groomName: true,
          status: true,
          _count: { select: { videos: true } },
        },
      },
    },
  });

  // Reels that have received comments but have no rule yet — the fast path
  // for turning a real comment into a new automation without hunting for IDs.
  const automatedMediaIds = new Set(automations.map((a) => a.mediaId));
  const unautomatedMediaIds = [
    ...new Set(
      logs.filter((l) => !automatedMediaIds.has(l.mediaId)).map((l) => l.mediaId),
    ),
  ];

  // Every media ID on this page resolved to the reel it names, so a bare
  // 18112141504901807 is shown with its thumbnail, caption and permalink
  // rather than left for an admin to identify by hand.
  const idsToResolve = [...new Set([...automatedMediaIds, ...unautomatedMediaIds])];
  const resolved = await Promise.all(idsToResolve.map((id) => fetchInstagramMedia(id)));
  const mediaById = new Map<string, InstagramMedia>(
    resolved.filter((m): m is InstagramMedia => m !== null).map((m) => [m.id, m]),
  );

  // The account's own recent posts, so a reel can be automated before anyone
  // has commented on it — and so an unfamiliar ID can be matched to a post.
  const recentMedia = await fetchRecentInstagramMedia(12);
  const unansweredDms = messageLogs.filter((m) => m.outcome === "NO_RULE_MATCHED");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Instagram"
        meta={`${automations.length} reel automations · ${dmRules.length} DM rules`}
      >
        <InstagramDmRuleFormDialog />
        <InstagramAutomationFormDialog />
      </PageHeader>

      {!isInstagramSendConfigured() && (
        <Card className="border-dashed">
          <CardContent className="text-muted-foreground py-4 text-sm">
            <code className="font-mono">IG_ACCESS_TOKEN</code> not set — replies will
            fail and reels can&apos;t be previewed.
          </CardContent>
        </Card>
      )}

      {automations.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            No reel automations yet.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {automations.map((automation) => {
          const media = mediaById.get(automation.mediaId);
          const permalink = automation.permalink ?? media?.permalink;

          return (
            <Card key={automation.id} className="py-0">
              <CardContent className="flex flex-col gap-3 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-3">
                    {media?.thumbnailUrl && (
                      // Instagram CDN URLs are signed and short-lived, so they
                      // are served straight through, not via the optimiser.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={media.thumbnailUrl}
                        alt=""
                        className="size-12 shrink-0 rounded-md object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{automation.label}</p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {automation.mediaId}
                      </p>
                      {media?.caption && (
                        <p className="text-muted-foreground truncate text-xs">
                          {media.caption}
                        </p>
                      )}
                    </div>
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
                        requireFollow: automation.requireFollow,
                        notFollowingMessage: automation.notFollowingMessage,
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
                  {automation.requireFollow && (
                    <Badge variant="outline">Followers only</Badge>
                  )}
                </div>

                <p className="text-muted-foreground line-clamp-2 text-xs">
                  {automation.replyMessage}
                </p>

                <p className="text-muted-foreground text-xs">
                  {automation._count.leads} link(s) claimed · {automation._count.logs}{" "}
                  comment(s) logged
                  {permalink && (
                    <>
                      {" · "}
                      <a
                        href={permalink}
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
          );
        })}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <div>
            <p className="font-medium">Direct message replies</p>
            <p className="text-muted-foreground text-xs">
              A DM is answered only by the first matching rule, highest priority first.
              Anything nothing matches is logged below and left for you — the account no
              longer replies to every message. &ldquo;DELETE&rdquo; always erases the
              sender&apos;s data, rule or no rule.
            </p>
          </div>

          {dmRules.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No DM rules yet — incoming messages are logged and left unanswered.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {dmRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{rule.label}</p>
                    <p className="text-muted-foreground text-xs">
                      Message {DM_MATCH_LABELS[rule.matchType] ?? rule.matchType}
                      {rule.keyword && ` “${rule.keyword}”`} · priority {rule.priority}
                    </p>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                      {rule.replyMessage}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant={rule.isActive ? "default" : "outline"}>
                        {rule.isActive ? "Active" : "Paused"}
                      </Badge>
                      {rule.issueLink && (
                        <Badge variant="secondary">Sends invite link</Badge>
                      )}
                      {rule.matchType === "ANY" && (
                        <Badge variant="outline">Catch-all</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <InstagramDmRuleToggle ruleId={rule.id} isActive={rule.isActive} />
                    <InstagramDmRuleFormDialog
                      rule={{
                        id: rule.id,
                        label: rule.label,
                        matchType: rule.matchType,
                        keyword: rule.keyword,
                        replyMessage: rule.replyMessage,
                        issueLink: rule.issueLink,
                        duplicateMessage: rule.duplicateMessage,
                        priority: rule.priority,
                        isActive: rule.isActive,
                      }}
                    />
                    <DeleteEntityButton
                      id={rule.id}
                      confirmLabel={`Delete the ${rule.label} DM rule?`}
                      action={deleteInstagramDmRuleAction}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {messageLogs.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3 py-4">
            <div>
              <p className="font-medium">Recent direct messages</p>
              <p className="text-muted-foreground text-xs">
                {unansweredDms.length} of the last {messageLogs.length} were left for
                you. Use the button on a row to turn that message into a rule.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-left text-xs">
                    <th className="py-2 pr-3 font-medium">When</th>
                    <th className="py-2 pr-3 font-medium">From</th>
                    <th className="py-2 pr-3 font-medium">Message</th>
                    <th className="py-2 pr-3 font-medium">Rule</th>
                    <th className="py-2 pr-3 font-medium">Outcome</th>
                    <th className="py-2 font-medium">Reply</th>
                  </tr>
                </thead>
                <tbody>
                  {messageLogs.map((log) => {
                    const outcome = DM_OUTCOME_LABELS[log.outcome] ?? {
                      label: log.outcome,
                      variant: "outline" as const,
                    };
                    return (
                      <tr key={log.id} className="border-b last:border-0">
                        <td className="text-muted-foreground py-2 pr-3 text-xs whitespace-nowrap">
                          {log.createdAt.toLocaleString()}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {log.username ? `@${log.username}` : log.igUserId.slice(-6)}
                        </td>
                        <td className="max-w-[14rem] truncate py-2 pr-3">
                          {log.messageText}
                        </td>
                        <td className="text-muted-foreground max-w-[8rem] truncate py-2 pr-3 text-xs">
                          {log.rule?.label ?? "—"}
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-1">
                            <Badge variant={outcome.variant}>{outcome.label}</Badge>
                            {log.outcome === "NO_RULE_MATCHED" && (
                              <InstagramDmRuleFormDialog
                                presetKeyword={log.messageText}
                              />
                            )}
                          </div>
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
          </CardContent>
        </Card>
      )}

      {unautomatedMediaIds.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3 py-4">
            <div>
              <p className="font-medium">Unautomated reels</p>
              <p className="text-muted-foreground text-xs">
                These got comments but have no rule, so nothing was replied.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {unautomatedMediaIds.map((mediaId) => (
                <InstagramMediaCard
                  key={mediaId}
                  mediaId={mediaId}
                  media={mediaById.get(mediaId)}
                >
                  <InstagramAutomationFormDialog presetMediaId={mediaId} />
                </InstagramMediaCard>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recentMedia.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3 py-4">
            <div>
              <p className="font-medium">Your recent posts</p>
              <p className="text-muted-foreground text-xs">
                Every post with the media ID it goes by — the way to check which reel an
                ID names before automating it.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {recentMedia.map((media) => (
                <InstagramMediaCard key={media.id} mediaId={media.id} media={media}>
                  {automatedMediaIds.has(media.id) ? (
                    <Badge variant="secondary">Automated</Badge>
                  ) : (
                    <InstagramAutomationFormDialog presetMediaId={media.id} />
                  )}
                </InstagramMediaCard>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {claims.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3 py-4">
            <p className="font-medium">Claimed invitations</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-left text-xs">
                    <th className="py-2 pr-3 font-medium">Instagram</th>
                    <th className="py-2 pr-3 font-medium">Couple</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 font-medium">Video</th>
                    <th className="py-2 font-medium">Claimed</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {claim.username ? `@${claim.username}` : claim.igUserId}
                      </td>
                      <td className="max-w-[12rem] truncate py-2 pr-3">
                        {claim.invitation.brideName || claim.invitation.groomName
                          ? `${claim.invitation.brideName} & ${claim.invitation.groomName}`
                          : "— not started —"}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge
                          variant={
                            claim.invitation.status === "PUBLISHED"
                              ? "default"
                              : "outline"
                          }
                        >
                          {claim.invitation.status}
                        </Badge>
                      </td>
                      <td className="text-muted-foreground py-2 pr-3 text-xs">
                        {claim.invitation._count.videos > 0 ? "Yes" : "—"}
                      </td>
                      <td className="text-muted-foreground py-2 text-xs whitespace-nowrap">
                        {claim.createdAt.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <p className="font-medium">Recent comment activity</p>

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
                        <td className="text-muted-foreground py-2 pr-3 text-xs whitespace-nowrap">
                          {log.createdAt.toLocaleString()}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {log.username ? `@${log.username}` : "—"}
                        </td>
                        <td className="text-muted-foreground max-w-[10rem] truncate py-2 pr-3 text-xs">
                          {log.automation?.label ??
                            mediaById.get(log.mediaId)?.caption ??
                            log.mediaId}
                        </td>
                        <td className="max-w-[12rem] truncate py-2 pr-3">
                          {log.commentText}
                        </td>
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
