import { useState, useEffect } from 'react';
import { X, Check, ChevronRight, Share2, Trophy, Loader2 } from 'lucide-react';
import { generateQuiz, scoreQuiz } from './quiz.js';
import { saveQuizResult, getQuizHistory } from './storage.js';
import { dateKey } from './wikipedia.js';

// transient=true → Discover article quizzes. No history save, no "already taken" check.
export default function Quiz({ article, feed, onClose, fontStyle, bodyFontStyle, transient = false }) {
  const [questions, setQuestions]   = useState(null); // null = generating
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers]       = useState([]);
  const [selected, setSelected]     = useState(null);
  const [revealed, setRevealed]     = useState(false);
  const [finished, setFinished]     = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(null);

  const todayKey    = dateKey(new Date());
  const articleTitle = article?.titles?.normalized || article?.title || 'this article';

  useEffect(() => {
    if (!transient) {
      const history = getQuizHistory();
      if (history[todayKey]) setAlreadyTaken(history[todayKey]);
    }
    // Small timeout so the modal opens before heavy regex work
    const t = setTimeout(() => {
      const generated = generateQuiz(article, feed);
      setQuestions(generated);
    }, 80);
    return () => clearTimeout(t);
  }, [article, feed, todayKey, transient]);

  const handleSelect = (opt) => { if (!revealed) setSelected(opt); };

  const handleConfirm = () => {
    if (selected === null) return;
    setAnswers(prev => [...prev, {
      correctAnswer: questions[currentIdx].correctAnswer,
      userAnswer: selected,
    }]);
    setRevealed(true);
  };

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      const finalAnswers = [...answers, {
        correctAnswer: questions[currentIdx].correctAnswer,
        userAnswer: selected,
      }];
      // Re-score from finalAnswers since answers state hasn't updated yet
      const score = finalAnswers.reduce((n, a) => n + (a.userAnswer === a.correctAnswer ? 1 : 0), 0);
      if (!transient) saveQuizResult(todayKey, score, questions.length);
      setFinished(true);
    } else {
      setCurrentIdx(i => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────
  if (questions === null) {
    return (
      <ModalShell onClose={onClose}>
        <div className="p-12 flex flex-col items-center gap-4">
          <Loader2 size={28} className="animate-spin" style={{ color: '#1A1A2E' }} />
          <p style={{ ...bodyFontStyle, color: '#6B6B7E', fontSize: '0.875rem' }}>
            Building your quiz…
          </p>
        </div>
      </ModalShell>
    );
  }

  // ── No questions generated ─────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <ModalShell onClose={onClose}>
        <div className="p-8 text-center">
          <p style={{ ...fontStyle, color: '#1A1A2E', fontWeight: 700 }} className="text-lg mb-2">
            No quiz available
          </p>
          <p style={{ ...bodyFontStyle, color: '#6B6B7E', fontSize: '0.875rem', lineHeight: 1.6 }}>
            This article didn't contain enough distinct facts
            (years, names, numbers) to build reliable questions.
            {!transient && ' Try again tomorrow with a new article.'}
          </p>
          <button
            onClick={onClose}
            className="mt-6 px-5 py-2.5 transition-transform hover:scale-105"
            style={{ ...bodyFontStyle, backgroundColor: '#1A1A2E', color: '#FAF7F2', fontWeight: 600 }}
          >
            Close
          </button>
        </div>
      </ModalShell>
    );
  }

  // ── Already taken (daily only) ─────────────────────────────────────
  if (alreadyTaken && !finished) {
    return (
      <ModalShell onClose={onClose}>
        <div className="p-8 text-center">
          <Trophy size={40} style={{ color: '#C2410C', margin: '0 auto 1rem' }} />
          <p style={{ ...fontStyle, color: '#1A1A2E', fontWeight: 700 }} className="text-2xl mb-2">
            Already played today
          </p>
          <p style={{ ...bodyFontStyle, color: '#6B6B7E' }} className="mb-1">
            You scored{' '}
            <strong style={{ color: '#1A1A2E' }}>
              {alreadyTaken.score}/{alreadyTaken.total}
            </strong>{' '}
            on today's quiz.
          </p>
          <p style={{ ...bodyFontStyle, color: '#6B6B7E', fontSize: '0.85rem' }} className="mb-6">
            Come back tomorrow for a new article and new questions.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 transition-transform hover:scale-105"
            style={{ ...bodyFontStyle, backgroundColor: '#1A1A2E', color: '#FAF7F2', fontWeight: 600 }}
          >
            Back to reading
          </button>
        </div>
      </ModalShell>
    );
  }

  // ── Finished screen ────────────────────────────────────────────────
  if (finished) {
    const finalAnswers = answers;
    const score = scoreQuiz(finalAnswers);
    const isPerfect = score === questions.length;
    const message = isPerfect
      ? "Perfect score! You read carefully."
      : score >= Math.ceil(questions.length / 2)
      ? "Good effort — you were paying attention."
      : "Tough one. Re-read the article and try tomorrow.";

    return (
      <ModalShell onClose={onClose}>
        <div className="p-6 md:p-8">
          {/* Article label */}
          <p
            className="text-xs tracking-widest uppercase mb-4"
            style={{ ...bodyFontStyle, color: '#C2410C', fontWeight: 600 }}
          >
            Quiz — {articleTitle}
          </p>

          <div className="text-center mb-6">
            <Trophy
              size={44}
              style={{ color: isPerfect ? '#C2410C' : '#6B6B7E', margin: '0 auto 0.75rem' }}
            />
            <p
              style={{ ...fontStyle, color: '#1A1A2E', fontWeight: 900, fontSize: '3rem', lineHeight: 1 }}
            >
              {score}/{questions.length}
            </p>
            <p
              className="mt-2 text-sm italic"
              style={{ ...fontStyle, color: '#6B6B7E' }}
            >
              {message}
            </p>
          </div>

          {/* Answer review */}
          <div className="space-y-3 mb-6">
            {questions.map((q, i) => {
              const a = finalAnswers[i];
              if (!a) return null;
              const correct = a.userAnswer === q.correctAnswer;
              return (
                <div
                  key={i}
                  className="p-3 flex items-start gap-3"
                  style={{
                    backgroundColor: correct
                      ? 'rgba(34,197,94,0.08)'
                      : 'rgba(194,65,12,0.08)',
                    borderLeft: `3px solid ${correct ? '#22c55e' : '#C2410C'}`,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      backgroundColor: correct ? '#22c55e' : '#C2410C',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                    }}
                  >
                    {correct
                      ? <Check size={13} color="#fff" />
                      : <X size={13} color="#fff" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <ClozeDisplay
                      context={q.context}
                      answer={q.correctAnswer}
                      fontStyle={fontStyle}
                    />
                    {!correct && (
                      <p
                        className="mt-1 text-xs"
                        style={{ ...bodyFontStyle, color: '#C2410C', fontWeight: 600 }}
                      >
                        You said: {a.userAnswer} · Answer: {q.correctAnswer}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                const text = transient
                  ? `I scored ${score}/${questions.length} on a Daily Wiki quiz about "${articleTitle}"! 🧠 dailywiki.app`
                  : `I scored ${score}/${questions.length} on today's Daily Wiki quiz! 🧠 dailywiki.app`;
                if (navigator.share) {
                  navigator.share({ text }).catch(() => {});
                } else {
                  navigator.clipboard?.writeText(text).then(() => alert('Copied!'));
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 transition-transform hover:scale-[1.02]"
              style={{ ...bodyFontStyle, backgroundColor: '#1A1A2E', color: '#FAF7F2', fontWeight: 600 }}
            >
              <Share2 size={15} />
              Share score
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 transition-transform hover:scale-[1.02]"
              style={{
                ...bodyFontStyle,
                backgroundColor: 'transparent',
                color: '#1A1A2E',
                border: '1.5px solid #1A1A2E',
                fontWeight: 600,
              }}
            >
              Close
            </button>
          </div>
        </div>
      </ModalShell>
    );
  }

  // ── Question in progress ──────────────────────────────────────────
  const q = questions[currentIdx];

  return (
    <ModalShell onClose={onClose}>
      <div className="p-6 md:p-8">

        {/* Article label */}
        <p
          className="text-xs tracking-widest uppercase mb-4 truncate"
          style={{ ...bodyFontStyle, color: '#C2410C', fontWeight: 600 }}
        >
          {transient ? `Quiz — ${articleTitle}` : `Today's quiz — ${articleTitle}`}
        </p>

        {/* Progress bar */}
        <div className="flex items-center gap-1.5 mb-6">
          {questions.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 transition-colors"
              style={{
                backgroundColor:
                  i < currentIdx  ? '#1A1A2E'
                  : i === currentIdx ? '#C2410C'
                  : 'rgba(26,26,46,0.15)',
              }}
            />
          ))}
        </div>

        {/* Question number */}
        <p
          className="text-xs uppercase tracking-widest mb-2"
          style={{ ...bodyFontStyle, color: '#9B9BAE' }}
        >
          Question {currentIdx + 1} of {questions.length}
        </p>

        {/* Prompt */}
        <p
          className="text-xl font-bold mb-4 leading-snug"
          style={{ ...fontStyle, color: '#1A1A2E' }}
        >
          {q.prompt}
        </p>

        {/* Cloze sentence — ____ highlighted */}
        <div
          className="p-4 mb-6"
          style={{
            backgroundColor: 'rgba(26,26,46,0.05)',
            borderLeft: '3px solid #C2410C',
          }}
        >
          <ClozeDisplay context={q.context} fontStyle={fontStyle} />
        </div>

        {/* Options */}
        <div className="space-y-2 mb-6">
          {q.options.map((opt) => {
            const isSelected = selected === opt;
            const isCorrect  = String(opt) === String(q.correctAnswer);

            let bg     = '#FAF7F2';
            let border = 'rgba(26,26,46,0.2)';
            let color  = '#1A1A2E';

            if (revealed) {
              if (isCorrect) { bg = 'rgba(34,197,94,0.12)'; border = '#22c55e'; }
              else if (isSelected) { bg = 'rgba(194,65,12,0.12)'; border = '#C2410C'; }
            } else if (isSelected) {
              bg = 'rgba(26,26,46,0.08)'; border = '#1A1A2E';
            }

            return (
              <button
                key={String(opt)}
                onClick={() => handleSelect(opt)}
                disabled={revealed}
                className="w-full text-left px-4 py-3 flex items-center justify-between transition-all"
                style={{
                  ...bodyFontStyle,
                  backgroundColor: bg,
                  border: `1.5px solid ${border}`,
                  color,
                  fontWeight: isSelected ? 600 : 500,
                  cursor: revealed ? 'default' : 'pointer',
                }}
              >
                <span>{String(opt)}</span>
                {revealed && isCorrect && <Check size={16} style={{ color: '#22c55e' }} />}
                {revealed && isSelected && !isCorrect && <X size={16} style={{ color: '#C2410C' }} />}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        {!revealed ? (
          <button
            onClick={handleConfirm}
            disabled={selected === null}
            className="w-full py-3 transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ ...bodyFontStyle, backgroundColor: '#1A1A2E', color: '#FAF7F2', fontWeight: 600 }}
          >
            Confirm
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 py-3 transition-transform hover:scale-[1.02]"
            style={{ ...bodyFontStyle, backgroundColor: '#C2410C', color: '#FAF7F2', fontWeight: 600 }}
          >
            {currentIdx + 1 >= questions.length ? 'See results' : 'Next question'}
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </ModalShell>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────

// Renders a cloze sentence with ____ highlighted in the brand colour
// When `answer` is provided, renders the filled answer instead
function ClozeDisplay({ context, answer, fontStyle }) {
  const parts = context.split('____');
  if (parts.length === 1) {
    return (
      <p style={{ ...fontStyle, color: '#1A1A2E', fontSize: '0.95rem', lineHeight: 1.6, fontStyle: 'italic' }}>
        {context}
      </p>
    );
  }
  return (
    <p style={{ ...fontStyle, color: '#1A1A2E', fontSize: '0.95rem', lineHeight: 1.6, fontStyle: 'italic' }}>
      {parts[0]}
      <span
        style={{
          backgroundColor: answer ? 'rgba(34,197,94,0.15)' : 'rgba(194,65,12,0.12)',
          color: answer ? '#166534' : '#C2410C',
          fontWeight: 700,
          fontStyle: 'normal',
          padding: '0 4px',
          borderRadius: 2,
        }}
      >
        {answer !== undefined ? String(answer) : '____'}
      </span>
      {parts.slice(1).join('____')}
    </p>
  );
}

function ModalShell({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: 'rgba(26,26,46,0.7)' }}
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full max-h-[90vh] overflow-auto"
        style={{ backgroundColor: '#FAF7F2' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:opacity-60 z-10"
          style={{ color: '#1A1A2E' }}
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
