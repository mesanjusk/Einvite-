export type EditorPalette = { primary: string; accent: string };

export type EditorColorway = {
  slug: string;
  name: string;
  colorPalette: EditorPalette;
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
