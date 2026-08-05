import type { Metadata } from "next";
import { Music } from "lucide-react";

import { db } from "@/lib/db";
import { MusicFormDialog } from "@/components/admin/music-form-dialog";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import { deleteMusicTrackAction } from "@/lib/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Manage Music" };

export default async function AdminMusicPage() {
  const tracks = await db.musicTrack.findMany({
    orderBy: { title: "asc" },
    include: { _count: { select: { invitations: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Manage Music</h1>
          <p className="text-muted-foreground text-sm">
            The library couples pick from in the wizard.
          </p>
        </div>
        <MusicFormDialog />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {tracks.map((track) => (
          <Card key={track.id}>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-secondary flex size-10 items-center justify-center rounded-full">
                  <Music className="text-primary size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{track.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {track.artist} · {track.mood} · {track._count.invitations} in use
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {track.isPremium && <Badge variant="gold">Premium</Badge>}
                <MusicFormDialog track={track} />
                <DeleteEntityButton
                  id={track.id}
                  confirmLabel={`Delete "${track.title}"? This can't be undone.`}
                  action={deleteMusicTrackAction}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tracks.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            No tracks yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
