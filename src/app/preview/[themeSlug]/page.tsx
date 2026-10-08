import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { themeFormSchema } from "@/lib/validations/admin";
import { buildThemePreviewData } from "@/lib/theme-preview";
import { buildInviteThemeStyle } from "@/lib/theme-css-vars";
import { independentSections, independentThemeOrder } from "@/lib/invitation-sections";
import { InviteExperience } from "@/components/invite/invite-experience";
import { StartLiveInvitationButton } from "@/components/guest/start-live-invitation-button";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ themeSlug: string }> }) {
 const { themeSlug } = await params;
 const theme = await db.theme.findUnique({ where: { slug: themeSlug }, include: { templates: true } });
 if (!theme || !theme.isPublished || theme.type !== "WEBSITE") notFound();
 const decor = (theme.decorAssets ?? {}) as { eventSections?: string[] };
 const draft = themeFormSchema.parse({ ...Object.fromEntries(Object.entries(theme).map(([key,value]) => [key,value === null ? undefined : value])), eventCategories: theme.eventCategories.length ? theme.eventCategories : [theme.eventCategory], sectionOrder: independentThemeOrder((Array.isArray(theme.templates[0]?.sectionOrder) ? theme.templates[0].sectionOrder as string[] : undefined) ?? ["ENVELOPE","HERO","COUNTDOWN","TIMELINE","GALLERY","VENUE","RSVP","THANK_YOU"], decor.eventSections ?? ["Sangeet","Mehendi","Wedding"]) });
 const invite = buildThemePreviewData(draft);
 const sections = independentSections(draft.sectionOrder.map((type, order) => ({ id: type, type, order, visible: true, locked: false })), invite.events);
 return <div className="relative mx-auto max-w-[430px] overflow-x-hidden" style={buildInviteThemeStyle(draft.colorPalette,draft.fontPairing)}><InviteExperience invite={invite} sectionConfig={sections} /><div className="no-print pointer-events-none fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[70] flex justify-center"><StartLiveInvitationButton ariaLabel="Edit this design" themeSlug={theme.slug} category={theme.eventCategory} loadingVideoUrl={theme.revealVideoUrl} className="pointer-events-auto grid size-12 place-items-center rounded-full bg-violet-700 text-white shadow-xl"><Pencil className="size-5" /></StartLiveInvitationButton></div></div>;
}
