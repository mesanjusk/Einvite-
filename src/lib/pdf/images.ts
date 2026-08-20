/**
 * Getting a remote photo into a PDF.
 *
 * Two things go wrong when you hand @react-pdf/renderer a URL straight from
 * the gallery. The first is format: Cloudinary and Unsplash both negotiate
 * AVIF/WebP by default, which almost no PDF viewer can decode — so the URL
 * is rewritten to ask for JPEG. The second is failure: react-pdf throws when
 * an <Image> src can't be fetched or decoded, and one dead photo would take
 * the whole download with it. So images are fetched here first, ahead of
 * render, and anything that doesn't come back as a usable raster is simply
 * dropped from the layout.
 */

/** Only formats every PDF viewer can decode. */
const SUPPORTED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);

const FETCH_TIMEOUT_MS = 8_000;
/** Photos larger than this are skipped rather than bloating the download. */
const MAX_BYTES = 6 * 1024 * 1024;

/**
 * Rewrites a known image host's URL to serve a PDF-safe raster format.
 * Anything else is returned untouched — the fetch below is what decides
 * whether it's usable.
 */
export function toPdfSafeImageUrl(url: string): string {
  // Cloudinary: transformations are path segments after "/upload/".
  const marker = "/upload/";
  const index = url.indexOf(marker);
  if (index !== -1 && url.includes("res.cloudinary.com")) {
    const insertAt = index + marker.length;
    return `${url.slice(0, insertAt)}f_jpg,q_auto/${url.slice(insertAt)}`;
  }

  // Unsplash: "auto=format" is what picks WebP; "fm=jpg" pins it.
  if (url.includes("images.unsplash.com")) {
    const parsed = safeUrl(url);
    if (parsed) {
      parsed.searchParams.delete("auto");
      parsed.searchParams.set("fm", "jpg");
      parsed.searchParams.set("q", "80");
      if (!parsed.searchParams.has("w")) parsed.searchParams.set("w", "1200");
      return parsed.toString();
    }
  }

  // A plain Cloudinary-style "/upload/" path on some other host still takes
  // the transformation — it's a no-op on hosts that ignore unknown segments.
  if (index !== -1) {
    const insertAt = index + marker.length;
    return `${url.slice(0, insertAt)}f_jpg,q_auto/${url.slice(insertAt)}`;
  }

  return url;
}

function safeUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/**
 * Fetches one image and returns it as a data URI react-pdf can embed, or
 * null if it isn't reachable, isn't a JPEG/PNG, or is too big. Never throws.
 */
export async function fetchPdfImage(url: string): Promise<string | null> {
  if (!url) return null;
  // Already inlined by the caller (or an admin pasted a data URI).
  if (url.startsWith("data:")) {
    return SUPPORTED_TYPES.has(url.slice(5, url.indexOf(";"))) ? url : null;
  }
  if (!/^https?:\/\//i.test(url)) return null;

  try {
    const response = await fetch(toPdfSafeImageUrl(url), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      // The gallery is public content; no cookies should ride along.
      credentials: "omit",
    });
    if (!response.ok) return null;

    const contentType = (response.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!SUPPORTED_TYPES.has(contentType)) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_BYTES) return null;

    const mime = contentType === "image/jpg" ? "image/jpeg" : contentType;
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Fetches several images at once, keeping only the ones that came back
 * usable and preserving the order they were asked for.
 */
export async function fetchPdfImages(
  urls: (string | null | undefined)[],
): Promise<string[]> {
  const results = await Promise.all(
    urls.filter((url): url is string => Boolean(url)).map((url) => fetchPdfImage(url)),
  );
  return results.filter((result): result is string => result !== null);
}
