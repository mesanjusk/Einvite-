export type ArtworkTheme = {
  name: string;
  previewImage?: string | null;
  revealMode?: string | null;
  revealVideoUrl?: string | null;
  revealVideoPosterUrl?: string | null;
  sectionArtwork?: string | null;
  revealAnimationPreset?: string | null;
  previewPrimary?: string | null;
  previewAccent?: string | null;
};

/** Derive a still from the existing Cloudinary video, without a second upload. */
export function videoPosterFor(source?: string | null): string | null {
  if (!source) return null;
  try {
    const url = new URL(source);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return null;
    const marker = "/video/upload/";
    const index = url.pathname.indexOf(marker);
    if (index < 0) return null;
    const parts = url.pathname.slice(index + marker.length).split("/");
    // Remove chained transformation components; retain version and public-id folders.
    const transformKeys = new Set(["ac", "af", "ar", "b", "bl", "bo", "c", "co", "d", "dl", "dn", "du", "e", "eo", "f", "fl", "fn", "fp", "fps", "g", "h", "ki", "l", "o", "p", "pg", "q", "r", "so", "sp", "u", "vc", "vs", "w", "x", "y", "z"]);
    if (parts[0].startsWith("s--")) return null;
    while (parts.length > 1 && parts[0].split(",").every((part) => transformKeys.has(part.split("_")[0]))) parts.shift();
    const asset = parts.join("/").replace(/\.(?:mp4|webm|mov|m4v)$/i, ".jpg");
    url.pathname = url.pathname.slice(0, index + marker.length) + "so_0,c_limit,w_640,q_auto,f_jpg/" + asset;
    url.search = "";
    return url.toString();
  } catch { return null; }
}

export function artworkPosterFor(theme: ArtworkTheme): string | null {
  if (theme.revealMode === "VIDEO") {
    return theme.revealVideoPosterUrl?.trim() || videoPosterFor(theme.revealVideoUrl) || theme.previewImage?.trim() || theme.sectionArtwork?.trim() || null;
  }
  return theme.previewImage?.trim() || theme.sectionArtwork?.trim() || null;
}
