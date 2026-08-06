"use client";

import { createContext, useContext, useEffect, useMemo, useState, type CSSProperties } from "react";

import { DEFAULT_LANGUAGE_CODE, LANGUAGES, type LanguageCode } from "./languages";
import { TRANSLATIONS, type Translations } from "./dictionary";

const STORAGE_KEY = "einvite-language";

type LocaleContextValue = {
  code: LanguageCode;
  setCode: (code: LanguageCode) => void;
  t: Translations;
  /** BCP 47 tag for Intl / toLocaleDateString. */
  locale: string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [code, setCodeState] = useState<LanguageCode>(DEFAULT_LANGUAGE_CODE);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES.some((lang) => lang.code === saved)) {
      setCodeState(saved as LanguageCode);
    }
  }, []);

  function setCode(next: LanguageCode) {
    setCodeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  const language = LANGUAGES.find((lang) => lang.code === code) ?? LANGUAGES[0];

  const value = useMemo<LocaleContextValue>(
    () => ({ code, setCode, t: TRANSLATIONS[code], locale: language.locale }),
    [code, language.locale],
  );

  const fontOverride: CSSProperties | undefined = language.fontVar
    ? {
        "--inv-font-display": `var(${language.fontVar})`,
        "--inv-font-script": `var(${language.fontVar})`,
        "--inv-font-body": `var(${language.fontVar})`,
      } as CSSProperties
    : undefined;

  return (
    <LocaleContext.Provider value={value}>
      <div lang={code} style={fontOverride}>
        {children}
      </div>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
