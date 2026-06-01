// Wikipedia REST API helpers
// No auth, CORS-enabled, free to use

const FEED_BASE = 'https://en.wikipedia.org/api/rest_v1/feed/featured';
const SUMMARY_BASE = 'https://en.wikipedia.org/api/rest_v1/page/summary';
const RANDOM_URL = 'https://en.wikipedia.org/api/rest_v1/page/random/summary';
const ACTION_API = 'https://en.wikipedia.org/w/api.php';

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

export async function fetchArticleForDate(date) {
  const feed = await fetchFeed(date);
  return feed.tfa || null;
}

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

// ── Topic-based article fetching ─────────────────────────────────────
// Maps our topic IDs to Wikipedia category names
// (Wikipedia categories are large; we use broad ones that contain many articles)
const TOPIC_CATEGORIES = {
  science: ['Science', 'Physics', 'Chemistry', 'Biology', 'Astronomy'],
  history: ['History', 'Ancient_history', 'Medieval_history', 'Modern_history'],
  geography: ['Geography', 'Countries', 'Cities', 'Mountains', 'Rivers'],
  culture: ['Arts', 'Literature', 'Music', 'Painting', 'Film'],
  sports: ['Sports', 'Association_football', 'Olympic_Games', 'Tennis'],
  technology: ['Technology', 'Computing', 'Software', 'Inventions'],
  nature: ['Nature', 'Animals', 'Plants', 'Ecology', 'Mammals'],
  people: ['Biography', 'Scientists', 'Writers', 'Artists', 'Inventors'],
};

// Fetch a random article from one of the given topic categories
// Uses Wikipedia's MediaWiki action API which supports CORS via origin=*
// Fetch the full plain-text of a Wikipedia article via the action API.
// Much longer than the REST summary extract — good for quiz generation.
// Capped at ~10,000 chars to keep quiz generation fast.
export async function fetchFullArticleText(title) {
  if (!title) return null;
  try {
    const params = new URLSearchParams({
      action: 'query',
      prop: 'extracts',
      titles: title,
      format: 'json',
      origin: '*',
      explaintext: '1',
      exsectionformat: 'plain',
    });
    const res = await fetch(`${ACTION_API}?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    const text = page?.extract || null;
    // Cap at 10,000 chars — enough for 3 great questions, avoids slowdown
    return text ? text.slice(0, 10000) : null;
  } catch {
    return null;
  }
}

export async function fetchRandomFromTopics(topicIds) {
  if (!topicIds || topicIds.length === 0) {
    return fetchRandomArticle();
  }

  // Pick a random topic from the user's selected ones
  const topic = topicIds[Math.floor(Math.random() * topicIds.length)];
  const categories = TOPIC_CATEGORIES[topic];
  if (!categories) return fetchRandomArticle();

  // Pick a random category within that topic
  const category = categories[Math.floor(Math.random() * categories.length)];

  // Query Wikipedia for pages in that category
  const params = new URLSearchParams({
    action: 'query',
    list: 'categorymembers',
    cmtitle: `Category:${category}`,
    cmlimit: '50',
    cmtype: 'page',
    format: 'json',
    origin: '*',
  });

  try {
    const res = await fetch(`${ACTION_API}?${params}`);
    if (!res.ok) throw new Error('Category query failed');
    const data = await res.json();
    const members = data?.query?.categorymembers || [];

    if (members.length === 0) {
      return fetchRandomArticle();
    }

    // Pick a random page from the category
    const pick = members[Math.floor(Math.random() * members.length)];

    // Fetch full summary for that page
    const summary = await fetchArticleSummary(pick.title);

    // Tag it with the topic we picked it from (so we can display the badge)
    summary._topicSource = topic;
    return summary;
  } catch (err) {
    // Fall back to fully random if anything goes wrong
    return fetchRandomArticle();
  }
}
