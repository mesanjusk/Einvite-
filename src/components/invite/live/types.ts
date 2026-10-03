export type EditorPalette = { primary: string; accent: string };

export type EditorColorway = {
  slug: string;
  name: string;
  colorPalette: EditorPalette;
  previewImage: string | null;
  isPremium: boolean;
  effectPreset: string;
  musicTrackId: string | null;
  galleryAnimation: string | null;
  sectionCount: number | null;
};

export type EditorTheme = {
  slug: string;
  name: string;
  previewImage: string | null;
  colorPalette: EditorPalette;
  colorways: EditorColorway[];
};

export type EditorTrack = {
  id: string;
  title: string;
  artist: string | null;
  mood: string | null;
  url: string;
};
