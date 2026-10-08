function unsplash(id: string, w = 1200) {
  return "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&w=" + w + "&q=80";
}

/** Stable stock thumbnail for an admin-created theme without its own preview image. */
const THUMBNAIL_POOL = [
  "1519741497674-611481863552",
  "1520854221256-17451cc331bf",
  "1465495976277-4387d4b0b4c6",
  "1511285560929-80b456fea0bc",
  "1519225421980-715cb0215aed",
  "1583939003579-730e3918a45a",
  "1521543387236-8c6f80e7d70e",
  "1544078751-58fee2d8b03f",
];

export function fallbackThumbnailFor(slug: string): string {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return unsplash(THUMBNAIL_POOL[hash % THUMBNAIL_POOL.length]);
}
