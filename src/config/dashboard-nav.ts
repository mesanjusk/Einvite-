import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  LayoutTemplate,
  Images,
  Users,
  Rocket,
  Settings,
  ShieldCheck,
  Library,
  UserCog,
  MessageCircleReply,
  BarChart3,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  // Path prefix that counts as being inside this entry, when that isn't the
  // href itself. An entry that links to its first tab — Manage to guests,
  // Content Library to themes — would otherwise unhighlight the moment
  // another tab of the same section is opened.
  match?: string;
  // Roots that prefix every other route below them, so they only light up on
  // an exact match.
  exact?: boolean;
};

// The sidebar lists places, not pages. Anything that is one job done from
// several screens — guests/RSVP/analytics, the publish steps, the design
// library, an account's profile and its plan — is one entry with tabs inside
// it, so the list stays short enough to scan.
export const dashboardNav: NavItem[] = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
  // Templates are how an invitation starts, so they are a tab here.
  { title: "My Invitations", href: "/dashboard/invitations", icon: LayoutTemplate },
  { title: "Media Library", href: "/dashboard/media", icon: Images },
  { title: "Manage", href: "/dashboard/manage/guests", icon: Users, match: "/dashboard/manage" },
  { title: "Publish", href: "/dashboard/publish/deploy", icon: Rocket, match: "/dashboard/publish" },
  // Billing is the same account as the profile — one entry, two tabs.
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export const adminNav: NavItem[] = [
  { title: "Admin Panel", href: "/admin", icon: ShieldCheck, exact: true },
  { title: "All Invitations", href: "/admin/invitations", icon: LayoutTemplate },
  // Website themes, PDF themes, video templates and music are one job:
  // curating what couples pick from.
  { title: "Content Library", href: "/admin/library/themes", icon: Library, match: "/admin/library" },
  // Item, order, vendor, employee, profit and performance are one job —
  // reading the business — so they are one entry with tabs inside it.
  { title: "Reports", href: "/admin/reports", icon: BarChart3, match: "/admin/reports" },
  { title: "Instagram", href: "/admin/instagram", icon: MessageCircleReply },
  { title: "Users", href: "/admin/users", icon: UserCog },
];
