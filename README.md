# Daily Wiki — v1.2

One curated Wikipedia article per day. Habit-forming reading, beautifully presented.

## What's new in v1.2

- **Quiz system** — auto-generates 3 multiple-choice questions per article using "on this day" feed data and year-extraction from the article text
- **Topic preferences** — pick what you're interested in (Science, History, Geography, etc.) during onboarding or via Settings
- **Archive** — browse the last 14 days of featured articles, with quiz scores shown beside each entry
- **Onboarding flow** — 4-step intro shown on first visit, with topic selection
- **Stats dashboard** — current streak, total quizzes played, accuracy, perfect scores
- **PWA support** — service worker + manifest, so users can install it as an app from their phone's browser ("Add to Home Screen")

## File layout

```
daily-wiki/
├── src/
│   ├── App.jsx              ← main shell + share card
│   ├── Quiz.jsx             ← quiz modal
│   ├── Archive.jsx          ← archive modal
│   ├── Settings.jsx         ← settings + stats modal
│   ├── Onboarding.jsx       ← first-visit flow
│   ├── wikipedia.js         ← Wikipedia API helpers
│   ├── quiz.js              ← quiz generation logic
│   ├── storage.js           ← localStorage helpers
│   ├── main.jsx             ← React entry
│   └── index.css            ← Tailwind imports
├── public/
│   ├── manifest.json        ← PWA manifest
│   ├── sw.js                ← service worker
│   └── icons/               ← (you need to add: 192x192 and 512x512 PNGs)
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── README.md
```

**Important:** the `.jsx` and `.js` files go in `src/`. The `manifest.json` and `sw.js` go in `public/` (Vite serves the `public/` folder at the site root).

## Setup

```bash
# In a fresh folder, arrange files per the layout above, then:
npm install
npm run dev
# Open http://localhost:5173
```

## How the new features work

### Quiz generation
The `quiz.js` module builds 3 multiple-choice questions per article using two strategies:

1. **"On this day" events** (preferred) — Wikipedia's featured feed includes an `onthisday` array of dated historical events. We pick events and ask "in what year did this happen?", generating plausible distractor years (some close, some further away).
2. **Year extraction from article text** (fallback) — we regex-match years (1500–present) in the article extract, take the sentence containing each, and turn it into a fill-in-the-blank ("In ____ , X happened").

The same article on the same day always produces the same quiz set (well, the same question pool — answer order is shuffled each time).

### Quiz history
Scores are stored in `localStorage` keyed by date (`{ "2026-05-22": { score: 2, total: 3, completedAt: ... } }`). The Archive view shows each day's score badge next to the date. You can't retake a quiz on the same day — it shows your previous score instead.

### Archive
Lists the last 14 days. Tapping a date fetches that day's featured article from `/feed/featured/{Y}/{M}/{D}`. Articles are cached after first fetch (last 30 kept). The "premium tier" hook is naturally placed here — show 14 days free, paywall the rest.

### Topic preferences
Saved as an array of topic IDs (`['science', 'history']`). Currently used for the onboarding experience and settings display. **Note**: actual filtering of articles by topic is hard because Wikipedia's featured article is daily-fixed — we can't pick a different one. Realistic next step is to:
- Track which topics the user engages with most (quiz completions, reads)
- Use that for the *quiz question selection* (filter out boring topics)
- Or use a different content source for personalised mode (e.g. Wikipedia's "random article in category X")

### PWA install
Once deployed on HTTPS, mobile users will see an "Add to Home Screen" prompt. iOS users can do this manually via Safari's share sheet. On Android, the install banner appears automatically. This is the cheap route to "having an app" without going through the App Store.

To go fully native (App Store / Play Store):
- Use **Capacitor** to wrap the PWA into native shells
- Apple Developer account: £79/year
- Google Play developer account: £20 one-off

## Monetisation (where it sits now)

| Stream | Status | Notes |
|---|---|---|
| Buy Me a Coffee | Wired up | Settings page → button |
| AdSense banner | TODO | Wait until ~100 DAU before applying |
| Premium tier | Hooks in place | Archive paywall after 14 days; ad-free toggle; unlimited quiz retries |
| In-app purchases | After PWA wrap | Stripe via web, then RevenueCat for native stores |

## Realistic revenue path

| DAU | Monthly revenue (est.) |
|---|---|
| 100 | £5–£15 (Buy Me a Coffee + a few ads) |
| 1,000 | £40–£100 (AdSense + ~10 premium users) |
| 5,000 | £200–£400 (the realistic 12-month target if growth works) |
| 25,000 | £1,000–£2,500 (would need viral moment + App Store boost) |

## Next steps if you want to keep building

1. **Generate icons** — use a tool like maskable.app or realfavicongenerator.net to create the 192/512 PWA icons. Drop them in `public/icons/`.
2. **Deploy to Vercel** — `npx vercel` from the project folder. Free tier handles everything here.
3. **Buy the domain** — check `dailywiki.app` on Namecheap (~£10/year).
4. **Soft launch** — post in r/InternetIsBeautiful, r/SideProject, ProductHunt. The share card is your acquisition engine; track downloads vs visits.
5. **Capacitor wrap (later)** — once you have ~500 DAU on web, port to native and submit to stores.

## License

MIT
