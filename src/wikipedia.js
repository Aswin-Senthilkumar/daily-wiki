// Wikipedia REST API helpers
// No auth, CORS-enabled, free to use

const FEED_BASE = 'https://en.wikipedia.org/api/rest_v1/feed/featured';
const SUMMARY_BASE = 'https://en.wikipedia.org/api/rest_v1/page/summary';
const RANDOM_URL = 'https://en.wikipedia.org/api/rest_v1/page/random/summary';

// Format a Date for the feed URL
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return { y, m, d: da };
}

export async function fetchFeed(date) {
  const { y, m, d } = formatDate(date);
  const res = await fetch(`${FEED_BASE}/${y}/${m}/${d}`);
  if (!res.ok) throw new Error(`Feed for ${y}-${m}-${d} returned ${res.status}`);
  return res.json();
}

// Try today, fall back to yesterday (feed isn't always published in early UTC hours)
export async function fetchTodaysFeed() {
  try {
    return await fetchFeed(new Date());
  } catch (e) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return await fetchFeed(yesterday);
  }
}

export async function fetchRandomArticle() {
  const res = await fetch(RANDOM_URL);
  if (!res.ok) throw new Error('Random article fetch failed');
  return res.json();
}

export async function fetchArticleSummary(title) {
  const res = await fetch(`${SUMMARY_BASE}/${encodeURIComponent(title)}`);
  if (!res.ok) throw new Error(`Summary for ${title} returned ${res.status}`);
  return res.json();
}

// Get featured article for an arbitrary past date
export async function fetchArticleForDate(date) {
  const feed = await fetchFeed(date);
  return feed.tfa || null;
}

// Get the last N days as Date objects (newest first), excluding today
export function getRecentDates(n = 14) {
  const dates = [];
  for (let i = 1; i <= n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d);
  }
  return dates;
}

export function dateKey(d) {
  const { y, m, d: da } = formatDate(d);
  return `${y}-${m}-${da}`;
}
