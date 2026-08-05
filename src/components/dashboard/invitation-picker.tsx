"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InvitationOption = {
  id: string;
  brideName: string;
  groomName: string;
};

export function InvitationPicker({
  invitations,
  selectedId,
}: {
  invitations: InvitationOption[];
  selectedId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("invitationId", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={selectedId} onValueChange={handleChange}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Select an invitation" />
      </SelectTrigger>
      <SelectContent>
        {invitations.map((invitation) => (
          <SelectItem key={invitation.id} value={invitation.id}>
            {invitation.brideName} &amp; {invitation.groomName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
