// localStorage helpers — wrapped in try/catch for safety

const KEYS = {
  STREAK: 'dailywiki_streak',
  TOPICS: 'dailywiki_topics',
  QUIZ_HISTORY: 'dailywiki_quiz_history',
  ARTICLE_CACHE_PREFIX: 'dailywiki_article_',
  ONBOARDED: 'dailywiki_onboarded',
};

// ── Streak ──────────────────────────────────────────────────────────
export function getStreak() {
  try {
    const stored = localStorage.getItem(KEYS.STREAK);
    return stored ? JSON.parse(stored) : { count: 0, lastVisit: null };
  } catch {
    return { count: 0, lastVisit: null };
  }
}

export function updateStreak() {
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const current = getStreak();

  if (current.lastVisit === today) {
    return current.count;
  }

  let newCount;
  if (current.lastVisit === yesterdayStr) {
    newCount = current.count + 1;
  } else {
    newCount = 1;
  }

  try {
    localStorage.setItem(KEYS.STREAK, JSON.stringify({ count: newCount, lastVisit: today }));
  } catch {}
  return newCount;
}

// ── Topic preferences ──────────────────────────────────────────────
export const ALL_TOPICS = [
  { id: 'science', label: 'Science', emoji: '🔬' },
  { id: 'history', label: 'History', emoji: '🏛️' },
  { id: 'geography', label: 'Geography', emoji: '🌍' },
  { id: 'culture', label: 'Culture & Arts', emoji: '🎭' },
  { id: 'sports', label: 'Sport', emoji: '⚽' },
  { id: 'technology', label: 'Technology', emoji: '💻' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'people', label: 'People', emoji: '👤' },
];

export function getTopics() {
  try {
    const stored = localStorage.getItem(KEYS.TOPICS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function setTopics(topicIds) {
  try {
    localStorage.setItem(KEYS.TOPICS, JSON.stringify(topicIds));
  } catch {}
}

export function isOnboarded() {
  try {
    return localStorage.getItem(KEYS.ONBOARDED) === '1';
  } catch {
    return false;
  }
}

export function markOnboarded() {
  try {
    localStorage.setItem(KEYS.ONBOARDED, '1');
  } catch {}
}

// ── Quiz history ───────────────────────────────────────────────────
export function getQuizHistory() {
  try {
    const stored = localStorage.getItem(KEYS.QUIZ_HISTORY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveQuizResult(dateKey, score, total) {
  try {
    const history = getQuizHistory();
    history[dateKey] = { score, total, completedAt: new Date().toISOString() };
    localStorage.setItem(KEYS.QUIZ_HISTORY, JSON.stringify(history));
  } catch {}
}

export function getQuizStats() {
  const history = getQuizHistory();
  const entries = Object.values(history);
  const totalPlayed = entries.length;
  const totalCorrect = entries.reduce((acc, e) => acc + e.score, 0);
  const totalPossible = entries.reduce((acc, e) => acc + e.total, 0);
  const perfectScores = entries.filter((e) => e.score === e.total).length;
  return {
    totalPlayed,
    totalCorrect,
    totalPossible,
    perfectScores,
    accuracy: totalPossible > 0 ? Math.round((totalCorrect / totalPossible) * 100) : 0,
  };
}

// ── Article cache ──────────────────────────────────────────────────
export function getCachedArticle(dateKey) {
  try {
    const stored = localStorage.getItem(`${KEYS.ARTICLE_CACHE_PREFIX}${dateKey}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function cacheArticle(dateKey, article) {
  try {
    localStorage.setItem(`${KEYS.ARTICLE_CACHE_PREFIX}${dateKey}`, JSON.stringify(article));
    pruneOldCache();
  } catch {}
}

// Keep only the last 30 cached articles
function pruneOldCache() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(KEYS.ARTICLE_CACHE_PREFIX)) keys.push(k);
    }
    if (keys.length > 30) {
      keys.sort(); // ISO-like keys sort chronologically
      const toRemove = keys.slice(0, keys.length - 30);
      toRemove.forEach((k) => localStorage.removeItem(k));
    }
  } catch {}
}

export function getAllCachedDates() {
  const dates = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(KEYS.ARTICLE_CACHE_PREFIX)) {
        dates.push(k.replace(KEYS.ARTICLE_CACHE_PREFIX, ''));
      }
    }
  } catch {}
  return dates.sort().reverse();
}

// ── Reset functions ────────────────────────────────────────────────
// Reset onboarding only — keeps streak, history, and topics
export function resetOnboarding() {
  try {
    localStorage.removeItem(KEYS.ONBOARDED);
  } catch {}
}

// Full reset — wipes everything (with confirmation in UI)
export function resetAll() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('dailywiki_')) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
}
