# Einvite — Digital Wedding Invite

A React + Vite + Framer Motion wedding invite site in a maroon/gold/ivory
palette: wax-seal envelope reveal, invitation card, scratch-to-reveal
save-the-date cards with a confetti burst, live countdown, four event
cards (Mehendi, Haldi, Haldi Dinner, Wedding), a photo keepsake section,
background music, and a Vercel-ready deploy setup.

## Personalize it

The placeholder photo in `public/` and the sample copy in the components
are stand-ins — swap them for your own before sharing the link.

| Find | Where | Replace with |
|---|---|---|
| `B&G`, `Bride's Name` / `Groom's Name`, parents' names | `src/components/EnvelopeIntro.jsx`, `src/components/HeroSlide.jsx` | Your initials, names, and parents' names |
| `WEDDING_DATE_ISO`, `WEDDING_DATE_DISPLAY` | `src/weddingConfig.js` | Your wedding date — the scratch cards, countdown, and event date all derive from this |
| `EVENTS` array (dates, times, venues, dress codes, `mapsUrl`) | `src/App.jsx` | Your actual event details |
| `Bride & Groom` closing line | `src/components/FinalSlide.jsx` | Your names |
| `public/couple.jpg` | — | Your photo (shown in the "Forever Us" keepsake card) |
| `public/music.mp3` | — | Add this file (not included) for background music |
| `og:url` / `twitter:image` / title | `index.html` | Your deployed Vercel URL |

The envelope and decorative petals are drawn in code (SVG/CSS) — no
Canva design needed for those.

## Develop

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run build
npm install -g vercel
vercel login
vercel --prod
```

After any change: `npm run build && vercel --prod`, then re-scrape the
WhatsApp/Facebook link preview at
[developers.facebook.com/tools/debug](https://developers.facebook.com/tools/debug).
