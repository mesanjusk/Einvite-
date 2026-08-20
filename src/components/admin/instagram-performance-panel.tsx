import { loadReelFunnelReport, type ReelFunnelRow } from "@/lib/instagram-insights";
import { InstagramAutomationFormDialog } from "@/components/admin/instagram-automation-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function compact(value: number | undefined) {
  if (value === undefined) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

/** Instagram reports reel watch time in milliseconds. */
function seconds(ms: number | undefined) {
  return ms === undefined ? "—" : `${(ms / 1000).toFixed(1)}s`;
}

function percent(numerator: number, denominator: number | undefined) {
  if (!denominator) return "—";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-muted-foreground text-[11px]">{hint}</p>
    </div>
  );
}

/**
 * One reel's identity cell — thumbnail, the name the admin gave it, and the
 * trigger word, so a row can be recognised without opening Instagram.
 */
function ReelCell({ row }: { row: ReelFunnelRow }) {
  return (
    <div className="flex items-center gap-2">
      {row.media?.thumbnailUrl ? (
        // Instagram CDN URLs are signed and short-lived, so they are served
        // straight through rather than run past the image optimiser.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={row.media.thumbnailUrl}
          alt=""
          className="h-12 w-9 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="bg-muted h-12 w-9 shrink-0 rounded" />
      )}
      <div className="min-w-0">
        <p className="truncate font-medium">{row.label}</p>
        <p className="text-muted-foreground truncate text-[11px]">
          {row.triggerWord ? (
            <>
              trigger <code className="font-mono">{row.triggerWord}</code>
            </>
          ) : (
            "no automation"
          )}
          {row.media?.permalink && (
            <>
              {" · "}
              <a
                href={row.media.permalink}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                open
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/**
 * Reel performance joined to what each reel actually produced.
 *
 * The left half of the table is Instagram's (reach, saves, watch time); the
 * right half is ours (comments through to published invitations). Keeping
 * them on one row is the whole point — views alone can't tell you a 40k-reach
 * reel earned two leads while a 6k one earned thirty.
 */
export async function InstagramPerformancePanel() {
  const { rows, totals, insightsUnavailable } = await loadReelFunnelReport();

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center text-sm">
          Nothing to report yet — no automations, and no recent posts came back from
          Instagram.
        </CardContent>
      </Card>
    );
  }

  // A reel that reached people but has no rule on it is a lead source sitting
  // switched off, so it gets called out above the table rather than being left
  // for someone to spot in a row.
  const unautomated = rows
    .filter((r) => !r.automationId && (r.insights?.reach ?? 0) > 0)
    .sort((a, b) => (b.insights?.reach ?? 0) - (a.insights?.reach ?? 0))
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      {insightsUnavailable && (
        <Card className="border-dashed">
          <CardContent className="text-muted-foreground py-4 text-sm">
            Instagram returned no insight metrics, so the reach, views, saves and watch
            time columns are blank. The funnel columns below are from our own database
            and are unaffected. This usually means the app is missing the{" "}
            <code className="font-mono">instagram_business_manage_insights</code>{" "}
            permission — it is free, and granted in the Meta app settings for the
            connected account.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Reach"
          value={compact(totals.reach)}
          hint={`${compact(totals.views)} views · ${compact(totals.saves)} saves`}
        />
        <Kpi
          label="Trigger comments"
          value={compact(totals.triggered)}
          hint={`of ${compact(totals.comments)} comments logged`}
        />
        <Kpi
          label="Leads"
          value={compact(totals.leads)}
          hint={`${percent(totals.leads, totals.triggered)} of trigger comments`}
        />
        <Kpi
          label="Invitations"
          value={compact(totals.invitations)}
          hint={`${totals.published} published · ${percent(totals.invitations, totals.leads)} of leads`}
        />
      </div>

      {unautomated.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col gap-2 py-4">
            <div>
              <p className="font-medium">Reels earning reach with no automation</p>
              <p className="text-muted-foreground text-xs">
                These are being seen but can&apos;t capture anyone. Adding a rule turns
                the traffic they already have into leads.
              </p>
            </div>
            {unautomated.map((row) => (
              <div
                key={row.mediaId}
                className="flex items-center justify-between gap-3 rounded-lg border p-2"
              >
                <ReelCell row={row} />
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {compact(row.insights?.reach)} reach
                  </span>
                  <InstagramAutomationFormDialog presetMediaId={row.mediaId} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          <div>
            <p className="font-medium">Reel performance and funnel</p>
            <p className="text-muted-foreground text-xs">
              Ranked by invitations produced, not by views. Reach, saves and watch time
              come from Instagram; everything from Comments rightward is ours.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[64rem] text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left text-xs">
                  <th className="py-2 pr-3 font-medium">Reel</th>
                  <th className="px-2 py-2 text-right font-medium">Reach</th>
                  <th className="px-2 py-2 text-right font-medium">Views</th>
                  <th className="px-2 py-2 text-right font-medium">Saves</th>
                  <th className="px-2 py-2 text-right font-medium">Avg watch</th>
                  <th className="px-2 py-2 text-right font-medium">Comments</th>
                  <th className="px-2 py-2 text-right font-medium">Triggered</th>
                  <th className="px-2 py-2 text-right font-medium">Gate held</th>
                  <th className="px-2 py-2 text-right font-medium">Links</th>
                  <th className="px-2 py-2 text-right font-medium">Leads</th>
                  <th className="px-2 py-2 text-right font-medium">Invites</th>
                  <th className="px-2 py-2 text-right font-medium">Published</th>
                  <th className="py-2 pl-2 text-right font-medium">Lead rate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.mediaId} className="border-b last:border-0">
                    <td className="max-w-[18rem] py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <ReelCell row={row} />
                        {row.automationId && !row.isActive && (
                          <Badge variant="outline" className="shrink-0">
                            Paused
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-2 text-right tabular-nums">
                      {compact(row.insights?.reach)}
                    </td>
                    <td className="px-2 text-right tabular-nums">
                      {compact(row.insights?.views)}
                    </td>
                    <td className="px-2 text-right tabular-nums">
                      {compact(row.insights?.saved)}
                    </td>
                    <td className="px-2 text-right tabular-nums">
                      {seconds(row.insights?.avgWatchTimeMs)}
                    </td>
                    <td className="px-2 text-right tabular-nums">{row.comments}</td>
                    <td className="px-2 text-right tabular-nums">{row.triggered}</td>
                    <td className="px-2 text-right tabular-nums">
                      {row.gateBlocked > 0 ? (
                        <span className="text-amber-600">{row.gateBlocked}</span>
                      ) : (
                        row.gateBlocked
                      )}
                    </td>
                    <td className="px-2 text-right tabular-nums">
                      {row.linksDelivered}
                    </td>
                    <td className="px-2 text-right tabular-nums">{row.leads}</td>
                    <td className="px-2 text-right font-medium tabular-nums">
                      {row.invitations}
                    </td>
                    <td className="px-2 text-right tabular-nums">{row.published}</td>
                    <td className="py-2 pl-2 text-right tabular-nums">
                      {percent(row.leads, row.insights?.reach)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-muted-foreground text-[11px]">
            <strong>Triggered</strong> counts comments that said the trigger word.{" "}
            <strong>Gate held</strong> is how many of those the followers-only check
            turned away — a high number next to few leads means the gate, not the reel,
            is where people are lost. <strong>Lead rate</strong> is leads per account
            reached.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
