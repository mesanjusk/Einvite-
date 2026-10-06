"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { InviteData } from "./types";

const ThemeElementContext = createContext<InviteData["elementStyles"]>({});

export function ThemeElementProvider({
  value,
  children,
}: {
  value?: InviteData["elementStyles"];
  children: ReactNode;
}) {
  return <ThemeElementContext.Provider value={value ?? {}}>{children}</ThemeElementContext.Provider>;
}

export function ThemeText({
  elementKey,
  children,
}: {
  elementKey: string;
  children: ReactNode;
}) {
  const config = useContext(ThemeElementContext)?.[elementKey];
  return (
    <span data-theme-element={elementKey}>
      {config?.text !== undefined ? config.text : children}
    </span>
  );
}
