export type LanguageCode = "en" | "hi" | "mr" | "gu" | "pa" | "bn" | "ta" | "te" | "kn" | "ml";

export const DEFAULT_LANGUAGE_CODE: LanguageCode = "en";

type Language = {
  code: LanguageCode;
  /** Name in its own script, shown in the toggle. */
  nativeLabel: string;
  englishLabel: string;
  /** BCP 47 tag used for date formatting. */
  locale: string;
  /** CSS custom property (defined on the indic font variable classes) — undefined for English, which keeps the invite's own theme fonts. */
  fontVar?: string;
};

export const LANGUAGES: Language[] = [
  { code: "en", nativeLabel: "English", englishLabel: "English", locale: "en-IN" },
  { code: "hi", nativeLabel: "हिंदी", englishLabel: "Hindi", locale: "hi-IN", fontVar: "--font-indic-deva" },
  { code: "mr", nativeLabel: "मराठी", englishLabel: "Marathi", locale: "mr-IN", fontVar: "--font-indic-deva" },
  { code: "gu", nativeLabel: "ગુજરાતી", englishLabel: "Gujarati", locale: "gu-IN", fontVar: "--font-indic-gu" },
  { code: "pa", nativeLabel: "ਪੰਜਾਬੀ", englishLabel: "Punjabi", locale: "pa-IN", fontVar: "--font-indic-pa" },
  { code: "bn", nativeLabel: "বাংলা", englishLabel: "Bengali", locale: "bn-IN", fontVar: "--font-indic-bn" },
  { code: "ta", nativeLabel: "தமிழ்", englishLabel: "Tamil", locale: "ta-IN", fontVar: "--font-indic-ta" },
  { code: "te", nativeLabel: "తెలుగు", englishLabel: "Telugu", locale: "te-IN", fontVar: "--font-indic-te" },
  { code: "kn", nativeLabel: "ಕನ್ನಡ", englishLabel: "Kannada", locale: "kn-IN", fontVar: "--font-indic-kn" },
  { code: "ml", nativeLabel: "മലയാളം", englishLabel: "Malayalam", locale: "ml-IN", fontVar: "--font-indic-ml" },
];
