"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, LogOut, Settings, Moon, Sun } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";

import { dashboardNav, adminNav } from "@/config/dashboard-nav";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// These four already live in the mobile bottom tab bar — no need to repeat
// them in the "more" overflow sheet.
const BOTTOM_NAV_HREFS = new Set([
  "/dashboard",
  "/dashboard/invitations",
  "/dashboard/manage/guests",
  "/dashboard/publish/deploy",
]);

type TopbarUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function DashboardTopbar({
  user,
  isAdmin,
}: {
  user: TopbarUser;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "U";

  const moreNavItems = dashboardNav.filter((item) => !BOTTOM_NAV_HREFS.has(item.href));

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b px-4 backdrop-blur">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="More">
            <MoreVertical className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 p-0">
          <SheetHeader className="border-b">
            <SheetTitle className="font-display text-primary">
              AI Wedding Invitation Studio
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-2 border-b pb-4">
              <Avatar className="size-9">
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="text-muted-foreground truncate text-xs">{user.email}</p>
              </div>
            </div>

            <SidebarNav items={moreNavItems} onNavigate={() => setOpen(false)} />

            {isAdmin && (
              <div className="border-t pt-4">
                <p className="text-muted-foreground mb-1 px-3 text-xs tracking-wide uppercase">
                  Admin — templates &amp; accounts
                </p>
                <SidebarNav items={adminNav} onNavigate={() => setOpen(false)} />
              </div>
            )}

            <div className="border-t pt-4">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-destructive hover:bg-accent flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden lg:block" />

      <div className="hidden items-center gap-2 lg:flex">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="size-4 scale-100 dark:scale-0" />
          <Moon className="absolute size-4 scale-0 dark:scale-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <Avatar className="size-7">
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-muted-foreground text-xs">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              <Settings />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
