/**
 * Reel performance — Instagram's own insight metrics for the connected
 * account, joined to the funnel this app already records on top of them.
 *
 * The reach/saves/watch-time half comes from the Insights API, which the same
 * IGAA-prefixed `IG_ACCESS_TOKEN` the Send API uses already reaches: no
 * scraper, no second vendor, no paid tier. The comments-to-invitations half
 * comes straight out of our own tables. Neither number is worth much alone —
 * "this reel got 40k views" says nothing about whether it produced a single
 * invitation, and "this reel produced twelve invitations" says nothing about
 * whether that was twelve people out of two hundred reached or out of forty
 * thousand. Putting both on one row is the whole point of the report.
 */

import { db } from "@/lib/db";
import {
  fetchInstagramMedia,
  fetchRecentInstagramMedia,
  isInstagramSendConfigured,
  type InstagramMedia,
} from "@/lib/instagram";

/**
 * Insight metrics are lifetime-to-date per media. Every field is optional:
 * Instagram silently drops metrics it can't serve for a given media type or
 * age, and a missing metric has to stay distinguishable from a real zero so
 * the table can print "—" instead of inventing a 0.
 */
export type InstagramInsights = {
  reach?: number;
  views?: number;
  likes?: number;
  comments?: number;
  saved?: number;
  shares?: number;
  totalInteractions?: number;
  /** Milliseconds, as Instagram reports it. */
  avgWatchTimeMs?: number;
  /** Milliseconds, as Instagram reports it. */
  totalWatchTimeMs?: number;
};

// Reels carry watch-time metrics that feed posts don't, and asking for a
// metric the media type doesn't support rejects the whole call rather than
// just that metric — so the two types get their own lists.
const REEL_METRICS =
  "reach,likes,comments,saved,shares,total_interactions,views,ig_reels_avg_watch_time,ig_reels_video_view_total_time";
const FEED_METRICS = "reach,likes,comments,saved,shares,total_interactions,views";

// `views` replaced `plays` for reels in v22 and isn't served to every account
// still answering on v21. When a metric is rejected we retry once with only
// the names that have been stable across both, so a token on the older shape
// still yields reach and engagement instead of an empty row.
const STABLE_METRICS = "reach,likes,comments,saved,shares,total_interactions";

const INSIGHTS_CACHE_SECONDS = 15 * 60;

/** How many of the account's recent media the report pulls insights for. */
export const REPORT_MEDIA_LIMIT = 24;

type RawInsight = { name?: string; values?: { value?: unknown }[] };

function toInsights(raw: RawInsight[]): InstagramInsights {
  const byName = new Map<string, number>();
  for (const metric of raw) {
    const value = metric.values?.[0]?.value;
    if (metric.name && typeof value === "number") byName.set(metric.name, value);
  }

  return {
    reach: byName.get("reach"),
    // Pre-v22 accounts answer with `plays`; both mean the same thing here.
    views: byName.get("views") ?? byName.get("plays"),
    likes: byName.get("likes"),
    comments: byName.get("comments"),
    saved: byName.get("saved"),
    shares: byName.get("shares"),
    totalInteractions: byName.get("total_interactions"),
    avgWatchTimeMs: byName.get("ig_reels_avg_watch_time"),
    totalWatchTimeMs: byName.get("ig_reels_video_view_total_time"),
  };
}

type InsightsResponse =
  | { ok: true; data: RawInsight[] }
  | { ok: false; status: number; error: string };

async function requestInsights(
  mediaId: string,
  metrics: string,
): Promise<InsightsResponse> {
  const response = await fetch(
    `https://graph.instagram.com/v21.0/${mediaId}/insights?metric=${metrics}`,
    {
      headers: { Authorization: `Bearer ${process.env.IG_ACCESS_TOKEN}` },
      next: { revalidate: INSIGHTS_CACHE_SECONDS },
    },
  );

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: await response.text().catch(() => ""),
    };
  }

  const body = (await response.json()) as { data?: RawInsight[] };
  return { ok: true, data: body.data ?? [] };
}

/**
 * Lifetime insights for one media. Returns null when the token is missing or
 * Instagram won't serve the media — callers keep the row and leave the reach
 * columns blank rather than hiding it, since a reel with no insights still
 * has leads worth looking at.
 */
export async function fetchMediaInsights(
  mediaId: string,
  media: InstagramMedia,
): Promise<InstagramInsights | null> {
  if (!isInstagramSendConfigured()) return null;

  const isReel = media.mediaProductType === "REELS";

  try {
    const primary = await requestInsights(mediaId, isReel ? REEL_METRICS : FEED_METRICS);
    if (primary.ok) return toInsights(primary.data);

    // Only a rejected metric name is worth a second call. A missing insights
    // permission fails identically for every metric set, so retrying it just
    // burns rate limit against a wall.
    if (primary.status !== 400) {
      console.error(`Instagram insights failed for ${mediaId}: ${primary.error}`);
      return null;
    }

    const fallback = await requestInsights(mediaId, STABLE_METRICS);
    if (fallback.ok) return toInsights(fallback.data);

    console.error(`Instagram insights failed for ${mediaId}: ${fallback.error}`);
    return null;
  } catch (error) {
    console.error("Instagram insights threw", error);
    return null;
  }
}

// Outcomes meaning the commenter's text actually matched the rule's trigger
// word. Everything else — no rule, paused rule, wrong word — is a comment the
// funnel never got to act on, and lumping the two together would make a reel
// with no automation look like a reel whose automation is failing.
const TRIGGERED_OUTCOMES = [
  "REPLY_SENT",
  "DUPLICATE_SKIPPED",
  "NOT_FOLLOWING",
  "FOLLOW_UNVERIFIED",
  "FLOW_STARTED",
  "SEND_FAILED",
] as const;

// Outcomes where the followers-only gate, not the reel, is what stopped the
// link from going out.
const GATE_BLOCKED_OUTCOMES = ["NOT_FOLLOWING", "FOLLOW_UNVERIFIED"] as const;

export type ReelFunnelRow = {
  mediaId: string;
  media: InstagramMedia | null;
  automationId: string | null;
  label: string;
  isActive: boolean;
  requireFollow: boolean;
  triggerWord: string | null;
  insights: InstagramInsights | null;
  /** Comments this app logged against the media, whatever the outcome. */
  comments: number;
  /** Of those, the ones that matched the trigger word. */
  triggered: number;
  /** Of those, the ones the followers-only gate turned away. */
  gateBlocked: number;
  /** Comment replies that carried the link out. */
  linksDelivered: number;
  /** Distinct accounts issued this reel's link. */
  leads: number;
  /** Leads that went on to own an invitation. */
  invitations: number;
  /** Of those invitations, the ones actually published. */
  published: number;
};

export type ReelFunnelReport = {
  rows: ReelFunnelRow[];
  totals: {
    reach: number;
    views: number;
    saves: number;
    comments: number;
    triggered: number;
    gateBlocked: number;
    linksDelivered: number;
    leads: number;
    invitations: number;
    published: number;
  };
  /** True when insights came back empty for every row we asked about. */
  insightsUnavailable: boolean;
};

const EMPTY_TOTALS: ReelFunnelReport["totals"] = {
  reach: 0,
  views: 0,
  saves: 0,
  comments: 0,
  triggered: 0,
  gateBlocked: 0,
  linksDelivered: 0,
  leads: 0,
  invitations: 0,
  published: 0,
};

/**
 * Every automated reel, plus the account's recent media, with Instagram's
 * reach numbers and our funnel counts on the same row.
 *
 * Recent media are included even with no automation on purpose: a reel
 * pulling real reach with no rule attached is the most actionable thing this
 * report can surface, and it is invisible in a view built only from
 * automations.
 */
export async function loadReelFunnelReport(): Promise<ReelFunnelReport> {
  const [automations, recentMedia] = await Promise.all([
    db.instagramAutomation.findMany({ orderBy: { createdAt: "desc" } }),
    fetchRecentInstagramMedia(REPORT_MEDIA_LIMIT),
  ]);

  const automationByMediaId = new Map(automations.map((a) => [a.mediaId, a]));
  const mediaById = new Map(recentMedia.map((m) => [m.id, m]));

  // Recent media first so the newest posts lead, then any older automated
  // reel that has aged out of the recent list but still has a rule on it.
  const olderAutomatedIds = automations
    .map((a) => a.mediaId)
    .filter((id) => !mediaById.has(id));
  const mediaIds = [...recentMedia.map((m) => m.id), ...olderAutomatedIds];

  if (mediaIds.length === 0) {
    return {
      rows: [],
      totals: EMPTY_TOTALS,
      insightsUnavailable: !isInstagramSendConfigured(),
    };
  }

  // Those older reels still need their thumbnail and product type, both to
  // render and to pick the right metric list. Per-media lookups are cached in
  // the fetch layer, so this costs nothing on a second render.
  const olderMedia = await Promise.all(olderAutomatedIds.map((id) => fetchInstagramMedia(id)));
  for (const media of olderMedia) {
    if (media) mediaById.set(media.id, media);
  }

  // Comment counts come back as grouped queries rather than a row per
  // comment: these logs grow without bound and the report only wants totals.
  const [commentGroups, triggeredGroups, gateGroups, linkGroups, leads] =
    await Promise.all([
      db.instagramCommentLog.groupBy({
        by: ["mediaId"],
        where: { mediaId: { in: mediaIds } },
        _count: { _all: true },
      }),
      db.instagramCommentLog.groupBy({
        by: ["mediaId"],
        where: { mediaId: { in: mediaIds }, outcome: { in: [...TRIGGERED_OUTCOMES] } },
        _count: { _all: true },
      }),
      db.instagramCommentLog.groupBy({
        by: ["mediaId"],
        where: {
          mediaId: { in: mediaIds },
          outcome: { in: [...GATE_BLOCKED_OUTCOMES] },
        },
        _count: { _all: true },
      }),
      db.instagramCommentLog.groupBy({
        by: ["mediaId"],
        where: { mediaId: { in: mediaIds }, outcome: "REPLY_SENT" },
        _count: { _all: true },
      }),
      db.instagramLead.findMany({
        where: { automationId: { in: automations.map((a) => a.id) } },
        select: { automationId: true, igUserId: true },
      }),
    ]);

  // A lead becomes an invitation when that Instagram account owns one, which
  // is exactly what `InstagramLink.igUserId` records. One pass over the leads
  // we actually found, rather than a query per automation.
  const links = leads.length
    ? await db.instagramLink.findMany({
        where: { igUserId: { in: [...new Set(leads.map((l) => l.igUserId))] } },
        select: { igUserId: true, invitation: { select: { status: true } } },
      })
    : [];
  const linkByIgUserId = new Map(links.map((l) => [l.igUserId, l]));

  const leadsByAutomation = new Map<string, string[]>();
  for (const lead of leads) {
    if (!lead.automationId) continue;
    const existing = leadsByAutomation.get(lead.automationId);
    if (existing) existing.push(lead.igUserId);
    else leadsByAutomation.set(lead.automationId, [lead.igUserId]);
  }

  const countBy = (groups: { mediaId: string; _count: { _all: number } }[]) =>
    new Map(groups.map((g) => [g.mediaId, g._count._all]));
  const commentCounts = countBy(commentGroups);
  const triggeredCounts = countBy(triggeredGroups);
  const gateCounts = countBy(gateGroups);
  const linkCounts = countBy(linkGroups);

  const insights = await Promise.all(
    mediaIds.map((id) => {
      const media = mediaById.get(id);
      // An unresolvable media is treated as a reel: this account posts reels
      // overwhelmingly, and a rejected metric falls back anyway.
      return fetchMediaInsights(id, media ?? { id, mediaProductType: "REELS" });
    }),
  );

  const rows: ReelFunnelRow[] = mediaIds.map((mediaId, index) => {
    const automation = automationByMediaId.get(mediaId);
    const media = mediaById.get(mediaId) ?? null;
    const leadIds = automation ? (leadsByAutomation.get(automation.id) ?? []) : [];
    const linked = leadIds
      .map((igUserId) => linkByIgUserId.get(igUserId))
      .filter((l): l is (typeof links)[number] => Boolean(l));

    return {
      mediaId,
      media,
      automationId: automation?.id ?? null,
      label: automation?.label ?? media?.caption?.slice(0, 60) ?? mediaId,
      isActive: automation?.isActive ?? false,
      requireFollow: automation?.requireFollow ?? false,
      triggerWord: automation?.triggerWord ?? null,
      insights: insights[index],
      comments: commentCounts.get(mediaId) ?? 0,
      triggered: triggeredCounts.get(mediaId) ?? 0,
      gateBlocked: gateCounts.get(mediaId) ?? 0,
      linksDelivered: linkCounts.get(mediaId) ?? 0,
      leads: leadIds.length,
      invitations: linked.length,
      published: linked.filter((l) => l.invitation.status === "PUBLISHED").length,
    };
  });

  // Ranked by what the reel produced, not by what it reached — the ordering
  // is the argument the whole tab is making.
  rows.sort(
    (a, b) =>
      b.invitations - a.invitations ||
      b.leads - a.leads ||
      (b.insights?.reach ?? 0) - (a.insights?.reach ?? 0),
  );

  const sum = (pick: (row: ReelFunnelRow) => number) =>
    rows.reduce((acc, row) => acc + pick(row), 0);

  return {
    rows,
    totals: {
      reach: sum((r) => r.insights?.reach ?? 0),
      views: sum((r) => r.insights?.views ?? 0),
      saves: sum((r) => r.insights?.saved ?? 0),
      comments: sum((r) => r.comments),
      triggered: sum((r) => r.triggered),
      gateBlocked: sum((r) => r.gateBlocked),
      linksDelivered: sum((r) => r.linksDelivered),
      leads: sum((r) => r.leads),
      invitations: sum((r) => r.invitations),
      published: sum((r) => r.published),
    },
    insightsUnavailable: rows.every((r) => r.insights === null),
  };
}
