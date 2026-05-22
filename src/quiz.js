// Quiz generation
// Strategy: extract years from the article text and "on this day" feed entries,
// then generate plausible distractor years for multiple choice.

const YEAR_REGEX = /\b(1[5-9][0-9]{2}|20[0-2][0-9])\b/g;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateYearDistractors(correctYear, usedYears = new Set()) {
  const distractors = new Set();
  const maxYear = new Date().getFullYear();
  let attempts = 0;

  while (distractors.size < 3 && attempts < 200) {
    // Mix close-by years (harder) and further years (easier)
    const sign = Math.random() < 0.5 ? -1 : 1;
    const magnitude = Math.random() < 0.6
      ? Math.floor(Math.random() * 15) + 3   // 3-18 years away (hard)
      : Math.floor(Math.random() * 50) + 20; // 20-70 years away (easier)
    const candidate = correctYear + sign * magnitude;

    if (
      candidate > 1500 &&
      candidate <= maxYear &&
      candidate !== correctYear &&
      !usedYears.has(candidate) &&
      !distractors.has(candidate)
    ) {
      distractors.add(candidate);
    }
    attempts++;
  }
  return [...distractors];
}

// Find the sentence containing a specific position in text
function extractSentence(text, position) {
  let start = position;
  while (start > 0 && !'.!?'.includes(text[start - 1])) start--;
  let end = position;
  while (end < text.length && !'.!?'.includes(text[end])) end++;
  return text.slice(start, end + 1).trim();
}

// Strip HTML tags from a string
function stripHtml(s) {
  return (s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export function generateQuiz(article, feed) {
  const questions = [];
  const usedYears = new Set();

  // Pass 1: use "on this day" events from the feed if available
  // These are pre-curated historical events with clear year + event pairs
  if (feed?.onthisday && Array.isArray(feed.onthisday)) {
    const shuffledEvents = shuffle(feed.onthisday).slice(0, 8);
    for (const event of shuffledEvents) {
      if (questions.length >= 3) break;
      if (!event.year || !event.text) continue;
      if (usedYears.has(event.year)) continue;

      const text = stripHtml(event.text);
      if (text.length < 20 || text.length > 200) continue;

      const distractors = generateYearDistractors(event.year, usedYears);
      if (distractors.length < 3) continue;

      usedYears.add(event.year);
      questions.push({
        type: 'onthisday',
        prompt: 'In what year did this happen?',
        context: text,
        correctAnswer: event.year,
        options: shuffle([event.year, ...distractors.slice(0, 3)]),
      });
    }
  }

  // Pass 2: extract year-based fill-in-the-blank from the article extract
  const extract = article?.extract || '';
  const matches = [...extract.matchAll(YEAR_REGEX)];

  for (const match of matches) {
    if (questions.length >= 3) break;
    const year = parseInt(match[0], 10);
    if (usedYears.has(year)) continue;

    const sentence = extractSentence(extract, match.index);
    if (sentence.length < 40 || sentence.length > 280) continue;

    // Avoid sentences with multiple years (ambiguous)
    const yearCount = (sentence.match(YEAR_REGEX) || []).length;
    if (yearCount !== 1) continue;

    const blanked = sentence.replace(match[0], '____');
    const distractors = generateYearDistractors(year, usedYears);
    if (distractors.length < 3) continue;

    usedYears.add(year);
    questions.push({
      type: 'extract',
      prompt: 'Fill in the missing year:',
      context: blanked,
      correctAnswer: year,
      options: shuffle([year, ...distractors.slice(0, 3)]),
    });
  }

  return questions;
}

// Score a quiz: array of { correctAnswer, userAnswer }
export function scoreQuiz(answers) {
  return answers.reduce((acc, a) => acc + (a.userAnswer === a.correctAnswer ? 1 : 0), 0);
}
