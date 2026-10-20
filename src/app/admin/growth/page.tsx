import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const types = ["REFERRAL_CLICK", "REFERRAL_CREATED", "CLICK_INSTAGRAM", "PRINT_ENQUIRY", "STORY_SHARE"] as const;

export default async function GrowthReportsPage() {
  // /admin/layout.tsx enforces group-based administrator authorization.
  const [events, attributedInvitations, sources] = await Promise.all([
    db.analyticsEvent.groupBy({
      by: ["type"],
      where: { type: { in: [...types] } },
      _count: { _all: true },
    }),
    db.invitation.count({
      where: { acquisitionSource: { in: ["guest_invite", "story", "instagram"] } },
    }),
    db.invitation.groupBy({
      by: ["acquisitionSource"],
      where: { acquisitionSource: { in: ["guest_invite", "story", "instagram"] } },
      _count: { _all: true },
    }),
  ]);
  const metrics = new Map(events.map((event) => [event.type, event._count._all]));
  const names: Record<string, string> = {
    REFERRAL_CLICK: "Create yours clicks",
    REFERRAL_CREATED: "Invitations created from shares",
    CLICK_INSTAGRAM: "Instagram outbound clicks",
    PRINT_ENQUIRY: "Print enquiry clicks",
    STORY_SHARE: "Story image shares/downloads",
  };
  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-[#705681]">← Admin studio</Link>
        <h1 className="mt-2 text-3xl font-semibold">Invitation growth</h1>
        <p className="mt-2 text-sm text-gray-600">
          Counts of recorded events, not unique people, Instagram followers, confirmed sales or verified Story publications.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {types.map((type) => (
          <div key={type} className="rounded-xl border bg-white p-5">
            <p className="text-xs text-gray-500">{names[type]}</p>
            <p className="mt-2 text-3xl font-semibold">{metrics.get(type) ?? 0}</p>
          </div>
        ))}
        <div className="rounded-xl border bg-white p-5">
          <p className="text-xs text-gray-500">Attributed invitation drafts</p>
          <p className="mt-2 text-3xl font-semibold">{attributedInvitations}</p>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Invitation acquisition sources</h2>
        <div className="mt-3 space-y-2 text-sm">
          {sources.map((source) => (
            <div key={source.acquisitionSource ?? "unknown"} className="flex justify-between border-b pb-2">
              <span>{source.acquisitionSource}</span>
              <strong>{source._count._all}</strong>
            </div>
          ))}
          {sources.length === 0 && <p className="text-gray-500">Attribution begins with invitations created after this update.</p>}
        </div>
        <p className="mt-4 text-xs text-gray-500">
          Referral attribution stores only a source channel and source invitation ID, not guest contact details.
          Verify completed orders before offering any referral reward or discount.
        </p>
      </div>
    </section>
  );
}
