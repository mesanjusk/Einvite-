import { INDIC_FONT_VARIABLE_CLASSES } from "@/lib/i18n/fonts";

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return <div className={INDIC_FONT_VARIABLE_CLASSES}>{children}</div>;
}
