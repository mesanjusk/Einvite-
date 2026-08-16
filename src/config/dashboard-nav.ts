import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  PlusCircle,
  LayoutTemplate,
  Images,
  Sparkles,
  Music,
  Users,
  ClipboardCheck,
  BarChart3,
  Palette,
  Rocket,
  Settings,
  CreditCard,
  ShieldCheck,
  Paintbrush,
  UserCog,
  LayoutGrid,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const dashboardNav: NavItem[] = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Create Invitation", href: "/dashboard/invitations/new", icon: PlusCircle },
  { title: "My Invitations", href: "/dashboard/invitations", icon: LayoutTemplate },
  { title: "Templates", href: "/dashboard/templates", icon: LayoutTemplate },
  { title: "Media Library", href: "/dashboard/media", icon: Images },
  { title: "AI Generator", href: "/dashboard/ai-generator", icon: Sparkles },
  { title: "Music Library", href: "/dashboard/music", icon: Music },
  { title: "Guest Management", href: "/dashboard/guests", icon: Users },
  { title: "RSVP", href: "/dashboard/rsvp", icon: ClipboardCheck },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "Theme Editor", href: "/dashboard/theme-editor", icon: Palette },
  { title: "Section Builder", href: "/dashboard/builder", icon: LayoutGrid },
  { title: "Deploy", href: "/dashboard/deploy", icon: Rocket },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
  { title: "Billing", href: "/dashboard/billing", icon: CreditCard },
];

export const adminNav: NavItem[] = [
  { title: "Admin Panel", href: "/admin", icon: ShieldCheck },
  { title: "All Invitations", href: "/admin/invitations", icon: LayoutTemplate },
  { title: "Manage Themes", href: "/admin/themes", icon: Paintbrush },
  { title: "Manage Music", href: "/admin/music", icon: Music },
  { title: "Manage Users", href: "/admin/users", icon: UserCog },
];
