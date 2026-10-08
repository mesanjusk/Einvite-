export function themeMusicUrl(decor: unknown): string | null {
  if (!decor || typeof decor !== "object" || !("musicUrl" in decor)) return null;
  return typeof decor.musicUrl === "string" && decor.musicUrl.trim() ? decor.musicUrl.trim() : null;
}

export function startingMusicUrl(choice: { customMusicUrl?: string; musicTrackId?: string }, decor: unknown): string | null {
  if (choice.customMusicUrl !== undefined) return choice.customMusicUrl || null;
  if (choice.musicTrackId) return null;
  return themeMusicUrl(decor);
}
