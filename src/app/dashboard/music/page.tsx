import type { Metadata } from "next";
import { Music } from "lucide-react";

import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Music Library" };

export default async function MusicLibraryPage() {
  const tracks = await db.musicTrack.findMany({ orderBy: { title: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Music Library</h1>
        <p className="text-muted-foreground text-sm">
          Background tracks your invitation can autoplay after the envelope opens.
          Assign one from the invitation wizard.
        </p>
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
                    {track.artist} · {track.mood}
                  </p>
                </div>
              </div>
              {track.isPremium && <Badge variant="gold">Premium</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>

      {tracks.length === 0 && (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            No tracks seeded yet — run <code className="font-mono">npm run db:seed</code>,
            then drop MP3 files matching each track&apos;s <code>url</code> into{" "}
            <code>public/music/</code>.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
