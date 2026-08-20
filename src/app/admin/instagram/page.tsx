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
import { InstagramFlowSettingsForm } from "@/components/admin/instagram-flow-settings-form";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import {
  deleteInstagramAutomationAction,
  deleteInstagramDmRuleAction,
} from "@/lib/actions/admin";
import { PageHeader } from "@/components/dashboard/page-header";
import { TabNav } from "@/components/dashboard/tab-nav";
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
  FOLLOW_UNVERIFIED: { label: "Follow unverified", variant: "secondary" },
  FLOW_STARTED: { label: "Button flow started", variant: "default" },
  SEND_FAILED: { label: "Send failed", variant: "destructive" },
};

const DM_OUTCOME_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  REPLY_SENT: { label: "Reply sent", variant: "default" },
  DUPLICATE_REPLY_SENT: { label: "Already had a link", variant: "secondary" },
  NO_RULE_MATCHED: { label: "Left for you", variant: "outline" },
  FLOW_STARTED: { label: "Button flow started", variant: "default" },
  FLOW_FOLLOW_PROMPTED: { label: "Asked to follow", variant: "secondary" },
  FLOW_STILL_NOT_FOLLOWING: { label: "Follow still unconfirmed", variant: "secondary" },
  FLOW_LINK_SENT: { label: "Link sent", variant: "default" },
  NOT_FOLLOWING: { label: "Asked to follow", variant: "secondary" },
  FOLLOW_UNVERIFIED: { label: "Follow unverified", variant: "secondary" },
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

// The page is six views over the same account rather than one long scroll.
// Which one is showing lives in the URL, so only the active view's data — and
// in particular only its Instagram API lookups — is fetched per request.
const TABS = [
  { id: "automations", label: "Reel automations" },
  { id: "reels", label: "Unautomated reels" },
  { id: "posts", label: "Recent posts" },
  { id: "dms", label: "Direct message replies" },
  { id: "flow", label: "Button flow" },
  { id: "comments", label: "Recent comments" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const DEFAULT_TAB: TabId = "automations";

function tabHref(id: TabId) {
  return id === DEFAULT_TAB ? "/admin/instagram" : `/admin/instagram?tab=${id}`;
}

/**
 * Media IDs resolved to the reels they name, keyed by ID. Lookups are
 * per-media and cached in the fetch layer, so asking for a list an admin is
 * already looking at costs nothing on the second render.
 */
async function resolveMedia(mediaIds: string[]) {
  const unique = [...new Set(mediaIds)];
  const resolved = await Promise.all(unique.map((id) => fetchInstagramMedia(id)));
  return new Map<string, InstagramMedia>(
    resolved.filter((m): m is InstagramMedia => m !== null).map((m) => [m.id, m]),
  );
}

/**
 * The automations, with the counts the cards show. Split out so the panel can
 * take its rows as a prop without restating their shape.
 */
function loadAutomations() {
  return db.instagramAutomation.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { leads: true, logs: true } } },
  });
}

function EmptyPanel({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="text-muted-foreground py-12 text-center text-sm">
        {children}
      </CardContent>
    </Card>
  );
}

export default async function AdminInstagramPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab: TabId = TABS.find((t) => t.id === tab)?.id ?? DEFAULT_TAB;

  const [automations, dmRuleCount] = await Promise.all([
    loadAutomations(),
    db.instagramDmRule.count(),
  ]);

  // Only the automations tab renders thumbnails; the other tabs need nothing
  // from this set beyond which media already have a rule.
  const automatedMediaIds = new Set(automations.map((a) => a.mediaId));
  const automationMedia =
    activeTab === "automations"
      ? await resolveMedia([...automatedMediaIds])
      : new Map<string, InstagramMedia>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Instagram"
        meta={`${automations.length} reel automations · ${dmRuleCount} DM rules`}
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

      <TabNav
        items={TABS.map((t) => ({
          href: tabHref(t.id),
          label: t.label,
          active: activeTab === t.id,
        }))}
      />

      {activeTab === "automations" && (
        <AutomationsPanel automations={automations} media={automationMedia} />
      )}
      {activeTab === "reels" && (
        <UnautomatedReelsPanel automatedMediaIds={automatedMediaIds} />
      )}
      {activeTab === "posts" && (
        <RecentPostsPanel automatedMediaIds={automatedMediaIds} />
      )}
      {activeTab === "dms" && <DirectMessagesPanel />}
      {activeTab === "flow" && <ButtonFlowPanel />}
      {activeTab === "comments" && <RecentCommentsPanel />}
    </div>
  );
}

function AutomationsPanel({
  automations,
  media: automationMedia,
}: {
  automations: Awaited<ReturnType<typeof loadAutomations>>;
  media: Map<string, InstagramMedia>;
}) {
  if (automations.length === 0) {
    return (
      <EmptyPanel>
        No reel automations yet — comments are logged but never replied to.
      </EmptyPanel>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {automations.map((automation) => {
        const media = automationMedia.get(automation.mediaId);
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
                    <p className="text-muted-foreground truncate font-mono text-xs">
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
                      useButtonFlow: automation.useButtonFlow,
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
                {automation.useButtonFlow && (
                  <Badge variant="secondary">Button flow</Badge>
                )}
                {automation.requireFollow && !automation.useButtonFlow && (
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
  );
}

/**
 * Reels that have received comments but have no rule yet — the fast path for
 * turning a real comment into a new automation without hunting for IDs.
 */
async function UnautomatedReelsPanel({
  automatedMediaIds,
}: {
  automatedMediaIds: Set<string>;
}) {
  const logs = await db.instagramCommentLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { mediaId: true },
  });

  const mediaIds = [...new Set(logs.map((l) => l.mediaId))].filter(
    (id) => !automatedMediaIds.has(id),
  );
  const media = await resolveMedia(mediaIds);

  if (mediaIds.length === 0) {
    return (
      <EmptyPanel>
        Every reel that has been commented on already has an automation.
      </EmptyPanel>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div>
          <p className="font-medium">Unautomated reels</p>
          <p className="text-muted-foreground text-xs">
            These got comments but have no rule, so nothing was replied.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {mediaIds.map((mediaId) => (
            <InstagramMediaCard
              key={mediaId}
              mediaId={mediaId}
              media={media.get(mediaId)}
            >
              <InstagramAutomationFormDialog presetMediaId={mediaId} />
            </InstagramMediaCard>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * The account's own recent posts, so a reel can be automated before anyone has
 * commented on it — and so an unfamiliar ID can be matched to a post.
 */
async function RecentPostsPanel({
  automatedMediaIds,
}: {
  automatedMediaIds: Set<string>;
}) {
  const recentMedia = await fetchRecentInstagramMedia(12);

  if (recentMedia.length === 0) {
    return (
      <EmptyPanel>
        No posts to show. This list needs{" "}
        <code className="font-mono">IG_ACCESS_TOKEN</code> set for the connected
        account.
      </EmptyPanel>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div>
          <p className="font-medium">Your recent posts</p>
          <p className="text-muted-foreground text-xs">
            Every post with the media ID it goes by — the way to check which reel an ID
            names before automating it.
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
  );
}

async function DirectMessagesPanel() {
  const [dmRules, messageLogs] = await Promise.all([
    db.instagramDmRule.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    }),
    db.instagramMessageLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { rule: { select: { label: true } } },
    }),
  ]);

  const unansweredDms = messageLogs.filter((m) => m.outcome === "NO_RULE_MATCHED");

  return (
    <div className="flex flex-col gap-6">
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
                      {rule.startFlow && (
                        <Badge variant="secondary">Starts button flow</Badge>
                      )}
                      {rule.issueLink && !rule.startFlow && (
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
                        startFlow: rule.startFlow,
                        requireFollow: rule.requireFollow,
                        notFollowingMessage: rule.notFollowingMessage,
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

      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <div>
            <p className="font-medium">Recent direct messages</p>
            <p className="text-muted-foreground text-xs">
              {messageLogs.length === 0
                ? "No messages received yet."
                : `${unansweredDms.length} of the last ${messageLogs.length} were left for you. Use the button on a row to turn that message into a rule.`}
            </p>
          </div>

          {messageLogs.length > 0 && (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * The button flow: what it says, and who is standing where in it.
 *
 * The counts are the point of the panel as much as the form — a pile of
 * people sitting at "waiting to follow" is the flow working, while a pile at
 * "waiting to tap" usually means the opener isn't landing.
 */
async function ButtonFlowPanel() {
  const [settings, awaitingTap, awaitingFollow, completed, flowAutomations, flowRules] =
    await Promise.all([
      db.instagramFlowSettings.findUnique({ where: { key: "default" } }),
      db.instagramFlowState.count({ where: { step: "AWAITING_TAP" } }),
      db.instagramFlowState.count({ where: { step: "AWAITING_FOLLOW" } }),
      db.instagramFlowState.count({ where: { step: "COMPLETED" } }),
      db.instagramAutomation.findMany({
        where: { useButtonFlow: true },
        select: { id: true, label: true, triggerWord: true, isActive: true },
      }),
      db.instagramDmRule.findMany({
        where: { startFlow: true },
        select: { id: true, label: true, keyword: true, isActive: true },
      }),
    ]);

  // No settings row means the code-side defaults are in force, and those gate.
  const followersOnly = settings?.requireFollow ?? true;

  const steps = [
    { label: "Waiting to tap", count: awaitingTap },
    { label: "Waiting to follow", count: awaitingFollow },
    { label: "Link delivered", count: completed },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">Who is where</p>
              <p className="text-muted-foreground text-xs">
                Comment the keyword → tap the button → follow → get the link. Reels opt
                in with &ldquo;Button flow&rdquo;; DM rules with &ldquo;Start button
                flow&rdquo;.
              </p>
            </div>
            {/* The account-wide rule decides who may have a link at all, so its
                state belongs where the flow is read, not only in the form. */}
            <Badge
              variant={followersOnly ? "default" : "destructive"}
              className="shrink-0"
            >
              {followersOnly ? "Followers only" : "Open to everyone"}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {steps.map((step) => (
              <div key={step.label} className="rounded-lg border p-3">
                <p className="text-2xl font-semibold">{step.count}</p>
                <p className="text-muted-foreground text-xs">{step.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {flowAutomations.length === 0 && flowRules.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                Nothing uses the flow yet — turn it on for a reel automation or a DM
                rule and the wording below is what it will send.
              </p>
            ) : (
              <>
                {flowAutomations.map((automation) => (
                  <Badge
                    key={automation.id}
                    variant={automation.isActive ? "default" : "outline"}
                  >
                    Reel: {automation.label} · {automation.triggerWord}
                  </Badge>
                ))}
                {flowRules.map((rule) => (
                  <Badge key={rule.id} variant={rule.isActive ? "default" : "outline"}>
                    DM: {rule.label}
                    {rule.keyword && ` · ${rule.keyword}`}
                  </Badge>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <InstagramFlowSettingsForm settings={settings} />
    </div>
  );
}

async function RecentCommentsPanel() {
  const [logs, claims] = await Promise.all([
    db.instagramCommentLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { automation: { select: { label: true } } },
    }),
    // Who claimed an invitation, and what they've built with it — the
    // lead-to-invitation view the comment log alone can't show.
    db.instagramLink.findMany({
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
    }),
  ]);

  const media = await resolveMedia(logs.map((l) => l.mediaId));

  return (
    <div className="flex flex-col gap-6">
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
                            media.get(log.mediaId)?.caption ??
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
    </div>
  );
}
