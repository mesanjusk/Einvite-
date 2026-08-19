import type { InstagramMedia } from "@/lib/instagram";
import { Badge } from "@/components/ui/badge";

/**
 * A media ID rendered as the reel it actually is.
 *
 * Webhooks only ever give us numbers like 18112141504901807. Showing that
 * number next to its thumbnail, caption and permalink is what lets an admin
 * confirm which reel they are about to automate instead of guessing.
 */
export function InstagramMediaCard({
  mediaId,
  media,
  children,
}: {
  mediaId: string;
  media?: InstagramMedia | null;
  children?: React.ReactNode;
}) {
  const caption = media?.caption?.trim();

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      {media?.thumbnailUrl ? (
        // Instagram CDN URLs are signed and short-lived, so they are served
        // straight through rather than run past the image optimiser.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.thumbnailUrl}
          alt=""
          className="size-14 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="bg-muted text-muted-foreground flex size-14 shrink-0 items-center justify-center rounded-md text-[10px]">
          no preview
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {caption || (media ? "(no caption)" : "Unidentified media")}
        </p>
        <p className="text-muted-foreground truncate font-mono text-xs">{mediaId}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {media?.mediaProductType && (
            <Badge variant="outline">{media.mediaProductType}</Badge>
          )}
          {media?.timestamp && (
            <span className="text-muted-foreground text-xs">
              {new Date(media.timestamp).toLocaleDateString()}
            </span>
          )}
          {media?.permalink ? (
            <a
              href={media.permalink}
              target="_blank"
              rel="noreferrer"
              className="text-xs underline underline-offset-2"
            >
              Open on Instagram
            </a>
          ) : (
            <span className="text-muted-foreground text-xs">
              Not identified — check the ID belongs to the connected account
            </span>
          )}
        </div>
      </div>

      {children && <div className="flex shrink-0 items-center gap-1">{children}</div>}
    </div>
  );
}
