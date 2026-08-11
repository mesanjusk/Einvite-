/**
 * A curated pool of royalty-free wedding/couple photos, used to top up a
 * guest's gallery to the required 5 photos when they don't have their own
 * to upload yet. Sourced from Unsplash's CDN (hotlinked, no key required)
 * — couples can delete/replace these later from their gallery.
 */
const STOCK_PHOTO_IDS = [
  "1519741497674-611481863552",
  "1511285560929-80b456fea0bc",
  "1519225421980-715cb0215aed",
  "1583939003579-730e3918a45a",
  "1465495976277-4387d4b0b4c6",
  "1520854221256-17451cc331bf",
  "1521543387236-8c6f80e7d70e",
  "1544078751-58fee2d8b03f",
  "1606216794074-735e91aa2c92",
  "1583334026965-2a3f37c8e9fb",
];

function stockPhotoUrl(id: string) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;
}

/** Returns up to `count` stock photo URLs, skipping any already used by this invitation. */
export function pickStockPhotos(count: number, exclude: string[] = []): string[] {
  const excluded = new Set(exclude);
  const pool = STOCK_PHOTO_IDS.map(stockPhotoUrl).filter((url) => !excluded.has(url));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
