"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

import { RESET_CONFIRMATION_PHRASE, RESET_KEEPS, RESET_WIPES } from "@/lib/admin-reset";
import { resetUserDataAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";

/**
 * The reset button, and the two lists that make it safe to press.
 *
 * Showing what survives matters as much as showing what goes: the fear that
 * stops someone using a reset is "will this eat my theme library", and the
 * answer is right there next to the button, from the same declaration the
 * server acts on.
 *
 * The typed phrase is the guard. A dialog with a Confirm button is one
 * mis-aimed tap; typing DELETE ALL USER DATA is not something that happens
 * by accident.
 */
export function DataResetCard() {
  const [confirmation, setConfirmation] = useState("");
  const [includeUserAccounts, setIncludeUserAccounts] = useState(false);
  const [running, setRunning] = useState(false);
  const router = useRouter();

  const armed = confirmation.trim() === RESET_CONFIRMATION_PHRASE;

  async function runReset() {
    setRunning(true);
    const result = await resetUserDataAction({ confirmation, includeUserAccounts });
    setRunning(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    const { invitations, users, instagramLinks } = result.data;
    toast.success(
      `Reset done — ${invitations} invitation(s), ${instagramLinks} Instagram link(s)` +
        (users > 0 ? `, ${users} account(s)` : "") +
        " deleted.",
    );
    setConfirmation("");
    setIncludeUserAccounts(false);
    router.refresh();
  }

  return (
    <Card className="border-destructive/40">
      <CardContent className="flex flex-col gap-4 py-5">
        <div className="flex items-start gap-3">
          <div className="bg-destructive/10 text-destructive flex size-9 shrink-0 items-center justify-center rounded-full">
            <AlertTriangle className="size-4" />
          </div>
          <div>
            <p className="font-medium">Reset all user data</p>
            <p className="text-muted-foreground text-sm">
              Clears everything the public side has made, and leaves everything you made
              as an admin. There is no undo and no export — take a database backup first
              if any of it matters.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <p className="text-destructive text-xs font-medium tracking-wide uppercase">
              Deleted
            </p>
            <ul className="mt-2 flex flex-col gap-2">
              {RESET_WIPES.map((group) => (
                <li key={group.label} className="text-xs">
                  <span className="font-medium">{group.label}</span>
                  <span className="text-muted-foreground"> — {group.detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium tracking-wide text-emerald-700 uppercase">
              Kept
            </p>
            <ul className="mt-2 flex flex-col gap-2">
              {RESET_KEEPS.map((group) => (
                <li key={group.label} className="text-xs">
                  <span className="font-medium">{group.label}</span>
                  <span className="text-muted-foreground"> — {group.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <div>
            <Label>Also delete non-admin accounts</Label>
            <p className="text-muted-foreground text-xs">
              Admin logins are always kept, including yours.
            </p>
          </div>
          <Switch
            checked={includeUserAccounts}
            onCheckedChange={setIncludeUserAccounts}
          />
        </div>

        <div className="grid gap-1.5">
          <Label>
            Type <span className="font-mono">{RESET_CONFIRMATION_PHRASE}</span> to
            confirm
          </Label>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={RESET_CONFIRMATION_PHRASE}
            autoComplete="off"
          />
        </div>

        <div>
          <Button variant="destructive" disabled={!armed || running} onClick={runReset}>
            {running ? "Deleting…" : "Delete all user data"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
