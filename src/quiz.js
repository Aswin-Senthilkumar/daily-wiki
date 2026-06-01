// Daily Wiki — Quiz Generation Engine v3
//
// Strategy:
//   1. Parse every sentence in the article extract individually
//   2. Score each sentence for "quiz-worthiness" (has a clear fact, not too long)
//   3. For each good sentence, try to extract a "cloze" (fill-in-the-blank)
//      by removing the most interesting token: a year, a proper noun, or a number
//   4. Generate plausible distractors — other values FROM THE SAME ARTICLE
//      wherever possible, so wrong answers aren't obviously wrong
//   5. Pick the 3 highest-scoring questions, one per type where possible

// ── Constants ────────────────────────────────────────────────────────

const YEAR_RE    = /\b(1[0-9]{3}|20[0-2][0-9])\b/g;
const NUMBER_RE  = /\b([1-9][0-9]{1,6})\b/g;
// Two or more consecutive Title-Case words, max 4 words
const NOUN_RE    = /\b([A-Z][a-z]{1,20}(?:\s[A-Z][a-z]{1,20}){1,3})\b/g;

// Words that start with a capital just because they're at the start
// of a sentence, or are common titles/articles — useless as quiz answers
const GENERIC = new Set([
  'The','A','An','This','That','These','Those','There','It','He','She',
  'They','We','His','Her','Its','Their','Our','My','Your',
  'After','Before','During','While','When','Where','As','Since','Until',
  'Although','However','Therefore','Thus','Moreover','Furthermore',
  'Despite','Because','Since','Though','Unless','Whether',
  'First','Second','Third','Last','Next','Other','New','Old','Great',
  'Many','Some','Most','Both','Each','Every','All','Any',
  'January','February','March','April','May','June','July',
  'August','September','October','November','December',
  'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday',
  'World','United','North','South','East','West','Central',
]);

// ── Utilities ────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stripHtml(s) {
  return (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// Split text into sentences (handles abbreviations poorly but well enough)
function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(s => s.length > 30 && s.length < 300);
}

// Score a sentence — higher = better quiz material
// Rewards: medium length, has a factual token (year/number/noun), single clause
function scoreSentence(sentence) {
  let score = 0;
  const len = sentence.length;

  // Sweet spot: 60–180 chars
  if (len >= 60 && len <= 180) score += 3;
  else if (len > 180 && len <= 240) score += 1;
  else if (len < 60) score -= 2;

  // Has a year → reliable fact
  if (YEAR_RE.test(sentence)) { score += 4; YEAR_RE.lastIndex = 0; }

  // Has a number (non-year)
  const nums = [...sentence.matchAll(NUMBER_RE)]
    .map(m => parseInt(m[1], 10))
    .filter(n => !(n >= 1000 && n <= 2030));
  if (nums.length === 1) score += 2;
  if (nums.length > 2)  score -= 2; // too many numbers = ambiguous

  // Has a proper noun (likely a name/place)
  const nouns = extractNouns(sentence, '');
  if (nouns.length >= 1) score += 3;
  if (nouns.length > 4)  score -= 2; // too many nouns = confusing

  // Penalise sentences starting with "It", "They", "This" etc — bad context
  if (/^(It|They|He|She|This|That|These)\b/.test(sentence)) score -= 3;

  // Penalise sentences that are mostly a list (contain semicolons or 3+ commas)
  const commas = (sentence.match(/,/g) || []).length;
  if (commas >= 3) score -= 2;

  return score;
}

// Extract useful proper nouns from a sentence, filtering out generics
// Also filters out anything that is (or is contained in) the article title
function extractNouns(sentence, title) {
  const titleLower = (title || '').toLowerCase();
  const matches = [...sentence.matchAll(NOUN_RE)];
  const seen = new Set();
  const nouns = [];

  for (const m of matches) {
    const noun = m[1];
    const firstWord = noun.split(' ')[0];

    if (GENERIC.has(noun)) continue;
    if (GENERIC.has(firstWord)) continue;
    if (seen.has(noun)) continue;
    if (titleLower && noun.toLowerCase().includes(titleLower)) continue;
    if (titleLower && titleLower.includes(noun.toLowerCase())) continue;
    // Skip single words under 4 chars (too vague)
    if (!noun.includes(' ') && noun.length < 4) continue;

    seen.add(noun);
    nouns.push(noun);
  }
  return nouns;
}

// ── Distractor generators ─────────────────────────────────────────────

// For years: pick nearby years that appear plausible
// Mix in OTHER years already mentioned in the article as distractors
function yearDistractors(correct, allArticleYears) {
  const pool = new Set();

  // First: use other years actually in the article (best distractors)
  for (const y of allArticleYears) {
    if (y !== correct && pool.size < 2) pool.add(y);
  }

  // Fill remaining slots with plausible nearby years
  let attempts = 0;
  while (pool.size < 3 && attempts < 200) {
    const sign = Math.random() < 0.5 ? -1 : 1;
    const delta = Math.random() < 0.5
      ? Math.floor(Math.random() * 12) + 2   // 2–13 (hard)
      : Math.floor(Math.random() * 40) + 15; // 15–54 (easier)
    const candidate = correct + sign * delta;
    if (candidate > 999 && candidate <= 2030 && candidate !== correct) {
      pool.add(candidate);
    }
    attempts++;
  }
  return [...pool].slice(0, 3);
}

// For numbers: scale variance to magnitude, use other article numbers first
function numberDistractors(correct, allArticleNumbers) {
  const pool = new Set();

  // Other numbers from article first
  for (const n of allArticleNumbers) {
    if (n !== correct && pool.size < 2) pool.add(n);
  }

  let attempts = 0;
  while (pool.size < 3 && attempts < 100) {
    const variance = Math.max(3, Math.round(correct * (0.15 + Math.random() * 0.4)));
    const sign = Math.random() < 0.5 ? -1 : 1;
    const candidate = correct + sign * (Math.floor(Math.random() * variance) + 1);
    if (candidate > 0 && candidate !== correct) pool.add(candidate);
    attempts++;
  }
  return [...pool].slice(0, 3);
}

// For nouns: use other proper nouns from the same article
function nounDistractors(correct, allArticleNouns) {
  return shuffle(allArticleNouns.filter(n => n !== correct)).slice(0, 3);
}

// ── Question builders ─────────────────────────────────────────────────

function buildClozeQuestion(sentence, token, answer, options, type) {
  // Replace only the first occurrence of the token in the sentence
  const blanked = sentence.replace(token, '____');

  // Pick a sensible prompt per type
  const prompts = {
    year:   'Fill in the missing year:',
    number: 'Fill in the missing number:',
    noun:   'Which name or place belongs in the blank?',
  };

  return {
    type,
    prompt: prompts[type],
    context: blanked,
    correctAnswer: answer,
    options: shuffle([answer, ...options]),
    score: 0, // set by caller
  };
}

// ── Main extraction ────────────────────────────────────────────────────

// generateQuiz(article, feed, fullText)
// fullText: full plain-text from fetchFullArticleText — uses this over extract when available.
// feed: kept for API compatibility but no longer used for questions.
export function generateQuiz(article, _feed, fullText) {
  // Prefer full article text — gives far more material for good questions
  const rawExtract = fullText
    || stripHtml(article?.extract_html || '')
    || article?.extract
    || '';
  const title = article?.titles?.normalized || article?.title || '';

  if (!rawExtract || rawExtract.length < 100) return [];

  const sentences = splitSentences(rawExtract);

  // Collect all tokens in the article for cross-article distractors
  const allYears = [...new Set(
    [...rawExtract.matchAll(YEAR_RE)].map(m => parseInt(m[1], 10))
  )];
  YEAR_RE.lastIndex = 0;

  const allNumbers = [...new Set(
    [...rawExtract.matchAll(NUMBER_RE)]
      .map(m => parseInt(m[1], 10))
      .filter(n => !(n >= 1000 && n <= 2030))
  )];
  NUMBER_RE.lastIndex = 0;

  const allNouns = [...new Set(
    sentences.flatMap(s => extractNouns(s, title))
  )];

  // Generate candidate questions from every sentence
  const candidates = { year: [], number: [], noun: [] };

  for (const sentence of sentences) {
    const sentScore = scoreSentence(sentence);
    if (sentScore < 1) continue;

    // ── Year questions ──────────────────────────────────────────────
    const yearMatches = [...sentence.matchAll(YEAR_RE)];
    YEAR_RE.lastIndex = 0;
    // Only use sentences with exactly ONE year
    if (yearMatches.length === 1) {
      const year = parseInt(yearMatches[0][1], 10);
      const distractors = yearDistractors(year, allYears.filter(y => y !== year));
      if (distractors.length === 3) {
        const q = buildClozeQuestion(sentence, yearMatches[0][0], year, distractors, 'year');
        q.score = sentScore + 4; // years are reliable
        candidates.year.push(q);
      }
    }

    // ── Number questions ────────────────────────────────────────────
    const numMatches = [...sentence.matchAll(NUMBER_RE)];
    NUMBER_RE.lastIndex = 0;
    const nonYearNums = numMatches
      .map(m => parseInt(m[1], 10))
      .filter(n => !(n >= 1000 && n <= 2030));

    if (nonYearNums.length === 1) {
      const num = nonYearNums[0];
      const tokenStr = String(num);
      if (sentence.includes(tokenStr)) {
        const distractors = numberDistractors(num, allNumbers.filter(n => n !== num));
        if (distractors.length === 3) {
          const q = buildClozeQuestion(sentence, tokenStr, num, distractors, 'number');
          q.score = sentScore + 2;
          candidates.number.push(q);
        }
      }
    }

    // ── Noun questions ──────────────────────────────────────────────
    if (allNouns.length >= 4) {
      const sentenceNouns = extractNouns(sentence, title);
      for (const noun of sentenceNouns) {
        if (!sentence.includes(noun)) continue;
        const distractors = nounDistractors(noun, allNouns);
        if (distractors.length < 3) continue;
        const q = buildClozeQuestion(sentence, noun, noun, distractors, 'noun');
        q.score = sentScore + 3;
        candidates.noun.push(q);
        break; // one noun question per sentence max
      }
    }
  }

  // Sort each pool by score descending — best questions first
  for (const pool of Object.values(candidates)) {
    pool.sort((a, b) => b.score - a.score);
  }

  // Assemble final 3 questions: aim for variety (one of each type)
  // Dedup: don't use the same sentence twice
  const usedSentences = new Set();
  const questions = [];

  const tryAdd = (pool) => {
    for (const q of pool) {
      if (!usedSentences.has(q.context)) {
        usedSentences.add(q.context);
        questions.push(q);
        return true;
      }
    }
    return false;
  };

  // Priority: noun → year → number (most engaging first)
  tryAdd(candidates.noun);
  tryAdd(candidates.year);

  // Third slot: best remaining from any pool
  if (questions.length < 3) {
    tryAdd(candidates.noun) ||
    tryAdd(candidates.number) ||
    tryAdd(candidates.year);
  }

  // If we still don't have 3, fill from whatever is left
  for (const pool of [candidates.year, candidates.number, candidates.noun]) {
    if (questions.length >= 3) break;
    tryAdd(pool);
  }

  return questions.slice(0, 3);
}

export function scoreQuiz(answers) {
  return answers.reduce((n, a) => n + (a.userAnswer === a.correctAnswer ? 1 : 0), 0);
}
