# Einvite — Digital Wedding Invite

A React + Vite + Framer Motion wedding invite site: tap-to-open envelope,
hero photo slide, live countdown, four event slides (Mehendi, Haldi, Haldi
Dinner, Wedding), background music, and a Vercel-ready deploy setup.

## Personalize it

The placeholder photos/envelope in `public/` and the sample copy in the
components are stand-ins — swap them for your own before sharing the link.

| Find | Where | Replace with |
|---|---|---|
| `Bride's Name` / `Groom's Name` | `src/components/HeroSlide.jsx` | Your names |
| `B&G` | `src/components/HeroSlide.jsx` | Your initials |
| `2026-12-12` | `src/components/CountdownSlide.jsx` | Your wedding date (`YYYY-MM-DD`) |
| `12 December 2026` | `src/components/CountdownSlide.jsx`, `src/App.jsx` | Date written out |
| `EVENTS` array (dates, times, venues, dress codes, `mapsUrl`) | `src/App.jsx` | Your actual event details |
| `public/couple.jpg` | — | Hero photo |
| `public/couple2.jpg` | — | Countdown background photo |
| `public/envelope.png` | — | Your Canva envelope design (transparent PNG) |
| `public/music.mp3` | — | Add this file (not included) for background music |
| `og:url` / `twitter:image` / title | `index.html` | Your deployed Vercel URL |

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
