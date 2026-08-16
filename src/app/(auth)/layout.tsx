import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-gradient-to-b from-[oklch(0.97_0.02_80)] to-background px-4 py-12">
      <Link href="/" className="font-display text-2xl text-primary">
        AI Wedding Invitation Studio
      </Link>
      {children}
    </div>
  );
}
