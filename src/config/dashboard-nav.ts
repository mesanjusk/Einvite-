import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  LayoutTemplate,
  Images,
  Users,
  Rocket,
  Settings,
  CreditCard,
  ShieldCheck,
  Paintbrush,
  Music,
  UserCog,
  FileText,
  Clapperboard,
  MessageCircleReply,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const dashboardNav: NavItem[] = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "My Invitations", href: "/dashboard/invitations", icon: LayoutTemplate },
  { title: "Templates", href: "/dashboard/templates", icon: LayoutTemplate },
  { title: "Media Library", href: "/dashboard/media", icon: Images },
  { title: "Manage", href: "/dashboard/manage/guests", icon: Users },
  { title: "Publish", href: "/dashboard/publish/deploy", icon: Rocket },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
  { title: "Billing", href: "/dashboard/billing", icon: CreditCard },
];

export const adminNav: NavItem[] = [
  { title: "Admin Panel", href: "/admin", icon: ShieldCheck },
  { title: "All Invitations", href: "/admin/invitations", icon: LayoutTemplate },
  { title: "Manage Themes", href: "/admin/themes", icon: Paintbrush },
  { title: "Manage PDF Themes", href: "/admin/pdf-themes", icon: FileText },
  { title: "Manage Video Templates", href: "/admin/video-templates", icon: Clapperboard },
  { title: "Manage Music", href: "/admin/music", icon: Music },
  { title: "Instagram Automation", href: "/admin/instagram", icon: MessageCircleReply },
  { title: "Manage Users", href: "/admin/users", icon: UserCog },
];
