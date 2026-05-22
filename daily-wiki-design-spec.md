# Daily Wiki — Design Specification
**Version:** 1.0  
**Author:** Aswin Senthilkumar  
**Date:** May 2026  

---

## 1. Overview

**Daily Wiki** is a web-first application that surfaces one curated Wikipedia article per day, presented in a clean, readable format with a social sharing hook and topic personalisation. The goal is habitual daily engagement — like a news briefing, but for curiosity.

**Core value proposition:** Wikipedia is overwhelming. Daily Wiki removes the decision fatigue and delivers one interesting article per day, beautifully formatted.

---

## 2. Goals

| Goal | Priority |
|---|---|
| Drive daily return visits (habit formation) | P0 |
| Generate passive income via ads / premium tier | P0 |
| Organic growth via shareable cards | P1 |
| Topic personalisation for retention | P1 |
| App Store release (React Native or PWA) | P2 |

---

## 3. Target Audience

- **Primary:** 18–30 year olds with intellectual curiosity (students, graduates)
- **Secondary:** Pub quiz enthusiasts, trivia fans, lifelong learners
- **Geography:** English-speaking markets initially (UK, US, AU)

---

## 4. Feature Set

### 4.1 MVP (v1.0)
These features must ship on day one.

**Daily Article Feed**
- One featured article per day, selected from Wikipedia's "Featured Article" list via the Wikipedia REST API
- Article rendered in a clean reading view (title, summary, key facts, full body)
- Date-stamped — users can browse back through previous days

**Streak Tracker**
- Tracks consecutive days a user has visited
- Displayed on the homepage (e.g. "🔥 7 day streak")
- Stored in localStorage (no account needed at this stage)
- Gentle push notification prompt after 3-day streak (PWA only)

**Share Card Generator**
- One-tap generation of a styled image card showing:
  - Article title
  - A one-sentence hook (first sentence of the Wikipedia lead)
  - Daily Wiki branding + URL
  - Today's date
- Exportable as PNG for Instagram Stories, WhatsApp, Twitter/X
- This is the primary organic growth driver

**Topic Tags**
- Each article tagged with 1–3 categories (Science, History, Geography, Culture, etc.)
- Displayed on the card; no filtering at MVP stage

---

### 4.2 v1.1 — Personalisation
- User selects preferred topic categories on first visit
- Daily article selected from preferred categories (still one per day)
- "Surprise me" toggle to override personalisation

### 4.3 v1.2 — Social & Gamification
- Streak leaderboard (opt-in, display-name only)
- Daily quiz: 3 multiple-choice questions generated from the article
- Quiz score shareable as a card ("I scored 3/3 on today's Daily Wiki quiz!")

### 4.4 v2.0 — Premium Tier
- Ad-free experience
- Unlock full article archive (browse any past day)
- Topic deep-dives: "Week of Space" themed collections
- Price: £1.99/month or £14.99/year

---

## 5. Monetisation Strategy

| Stream | When | Expected Revenue |
|---|---|---|
| AdSense (web) | From launch | Low initially; scales with traffic |
| AdMob (app) | After App Store release | Better CPM than web |
| Premium subscription | v2.0 | £1.99/month; target 2–5% conversion |
| "Buy me a coffee" button | From launch | Small but zero-effort |

**Revenue estimate at scale (5,000 DAU):**
- AdSense/AdMob: ~£50–£150/month
- Premium (2% conversion = 100 users): ~£200/month
- Total: ~£250–£350/month passive

---

## 6. Technical Architecture

### 6.1 Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React (Vite) | Already familiar; fast dev experience |
| Styling | Tailwind CSS | Rapid UI, consistent design tokens |
| Share card | html2canvas or Konva.js | PNG export from DOM element |
| Data source | Wikipedia REST API | Free, no auth required |
| Hosting | Vercel | Free tier, zero-config deploy |
| Analytics | Plausible or Google Analytics | Track DAU, streak stats |
| App Store (later) | PWA or React Native (Expo) | Single codebase for iOS/Android |

### 6.2 Wikipedia API

**Endpoint used:**
```
GET https://en.wikipedia.org/api/rest_v1/page/summary/{title}
GET https://en.wikipedia.org/api/rest_v1/feed/featured/{YYYY}/{MM}/{DD}
```

The `/feed/featured` endpoint returns the "Featured Article of the Day" — Wikipedia's own editorial selection. This removes the need for any curation logic at MVP.

**Response fields used:**
- `title` — article title
- `extract` — plain-text summary (first paragraph)
- `thumbnail.source` — hero image
- `content_urls.desktop.page` — link back to full Wikipedia article

### 6.3 Data Flow

```
Wikipedia API (daily)
        ↓
  Article fetched on page load (or cached in localStorage for the day)
        ↓
  Rendered in reading view
        ↓
  Share card generated client-side (no server needed)
```

No backend is required at MVP. The app is fully static and client-side.

### 6.4 State Management

| State | Storage | Notes |
|---|---|---|
| Today's article | localStorage (TTL: midnight) | Avoid re-fetching on revisit |
| Streak count | localStorage | Incremented on daily visit |
| Last visit date | localStorage | Used to calculate streak |
| Topic preferences | localStorage | Set on onboarding |

---

## 7. UI & UX Design

### 7.1 Design Principles
- **One thing per screen** — no clutter, no feeds
- **Reading-first** — typography is the product
- **Mobile-first** — most sharing happens on phones

### 7.2 Screen Map

```
Home
 ├── Article View (today's article)
 │    ├── Hero image
 │    ├── Title + topic tag(s)
 │    ├── Summary paragraph
 │    ├── Full article (collapsed, "Read more" expands)
 │    └── Share button → Share Card preview → Export PNG
 ├── Streak badge (top right)
 ├── Archive (previous days, v1.1)
 └── Settings
      ├── Topic preferences
      └── Premium upgrade (v2.0)
```

### 7.3 Share Card Design
```
┌─────────────────────────────┐
│  DAILY WIKI       May 21    │
│  ─────────────────────────  │
│                             │
│  [Hero image, cropped 16:9] │
│                             │
│  The History of the         │
│  Hubble Space Telescope     │
│                             │
│  "Launched in 1990, Hubble  │
│   has fundamentally changed │
│   our understanding of the  │
│   universe."                │
│                             │
│  dailywiki.app  🔥 7 days   │
└─────────────────────────────┘
```
Sized for Instagram Stories (9:16) with a landscape crop option for Twitter/X.

---

## 8. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Page load time | < 1.5s on 4G |
| Lighthouse score | > 90 (Performance, Accessibility) |
| Wikipedia API fallback | Show cached article if API unavailable |
| Mobile responsiveness | 320px – 1440px |
| GDPR compliance | Cookie consent banner; no PII collected at MVP |

---

## 9. Development Roadmap

| Phase | Scope | Estimated Time |
|---|---|---|
| v1.0 MVP | Article view, streak, share card | 2–3 weekends |
| v1.1 Personalisation | Topic preferences, archive | 1–2 weekends |
| v1.2 Social | Quiz, leaderboard | 2 weekends |
| App Store (PWA) | Manifest, service worker, push notifications | 1 weekend |
| v2.0 Premium | Stripe integration, subscription logic | 2–3 weekends |

---

## 10. Success Metrics

| Metric | 3-month target | 12-month target |
|---|---|---|
| Daily Active Users | 500 | 5,000 |
| Average streak length | 4 days | 7 days |
| Share card exports / day | 50 | 500 |
| Monthly revenue | £0–£20 | £200–£400 |

---

## 11. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Wikipedia API rate limits | Low | Cache daily article in localStorage; one fetch per user per day |
| Low organic growth | Medium | Share card is the primary growth driver; launch on Reddit (r/todayilearned) |
| Wikipedia changes API | Low | Abstract API calls into a single service module for easy swapping |
| Ad revenue too low to motivate | High initially | Set expectation: ads pay off at scale; focus on building users first |
