import { Kalam, Shrikhand, Langar, Galada, Kavivanar, Gurajada, Hubballi, Chilanka } from "next/font/google";

// One handwriting-style Google Font per script, each exposed as a CSS custom
// property. --font-indic-deva covers both Hindi and Marathi (same script).
const kalam = Kalam({ variable: "--font-indic-deva", subsets: ["devanagari"], weight: ["400", "700"] });
const shrikhand = Shrikhand({ variable: "--font-indic-gu", subsets: ["gujarati"], weight: "400" });
const langar = Langar({ variable: "--font-indic-pa", subsets: ["gurmukhi"], weight: "400" });
const galada = Galada({ variable: "--font-indic-bn", subsets: ["bengali"], weight: "400" });
const kavivanar = Kavivanar({ variable: "--font-indic-ta", subsets: ["tamil"], weight: "400" });
const gurajada = Gurajada({ variable: "--font-indic-te", subsets: ["telugu"], weight: "400" });
const hubballi = Hubballi({ variable: "--font-indic-kn", subsets: ["kannada"], weight: "400" });
const chilanka = Chilanka({ variable: "--font-indic-ml", subsets: ["malayalam"], weight: "400" });

export const INDIC_FONT_VARIABLE_CLASSES = [
  kalam.variable,
  shrikhand.variable,
  langar.variable,
  galada.variable,
  kavivanar.variable,
  gurajada.variable,
  hubballi.variable,
  chilanka.variable,
].join(" ");
