import { useState, useEffect } from 'react';
import { X, Check, ChevronRight, Share2, Trophy, RefreshCw } from 'lucide-react';
import { generateQuiz, scoreQuiz } from './quiz.js';
import { saveQuizResult, getQuizHistory } from './storage.js';
import { dateKey } from './wikipedia.js';

export default function Quiz({ article, feed, onClose, fontStyle, bodyFontStyle }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(null);

  const todayKey = dateKey(new Date());

  useEffect(() => {
    // Check if quiz already taken today
    const history = getQuizHistory();
    if (history[todayKey]) {
      setAlreadyTaken(history[todayKey]);
    }

    const generated = generateQuiz(article, feed);
    setQuestions(generated);
  }, [article, feed, todayKey]);

  const handleSelect = (option) => {
    if (revealed) return;
    setSelected(option);
  };

  const handleConfirm = () => {
    if (selected === null) return;
    const q = questions[currentIdx];
    setAnswers([...answers, { correctAnswer: q.correctAnswer, userAnswer: selected }]);
    setRevealed(true);
  };

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      const finalAnswers = [...answers];
      const score = scoreQuiz(finalAnswers);
      saveQuizResult(todayKey, score, questions.length);
      setFinished(true);
    } else {
      setCurrentIdx(currentIdx + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  // Edge case: no quiz could be generated
  if (questions.length === 0) {
    return (
      <ModalShell onClose={onClose}>
        <div className="p-8 text-center">
          <p style={{ ...fontStyle, color: '#1A1A2E' }} className="text-lg mb-2">
            No quiz available today
          </p>
          <p style={{ ...bodyFontStyle, color: '#6B6B7E' }} className="text-sm">
            Today's article didn't have enough date-based facts to build a quiz.
            Come back tomorrow!
          </p>
        </div>
      </ModalShell>
    );
  }

  // Already taken today
  if (alreadyTaken && !finished) {
    return (
      <ModalShell onClose={onClose}>
        <div className="p-8 text-center">
          <Trophy size={40} style={{ color: '#C2410C', margin: '0 auto 1rem' }} />
          <p style={{ ...fontStyle, color: '#1A1A2E' }} className="text-2xl font-bold mb-2">
            You've already played today
          </p>
          <p style={{ ...bodyFontStyle, color: '#6B6B7E' }} className="text-base mb-6">
            You scored {alreadyTaken.score}/{alreadyTaken.total}. Come back tomorrow for a new quiz.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 transition-transform hover:scale-105"
            style={{
              ...bodyFontStyle,
              backgroundColor: '#1A1A2E',
              color: '#FAF7F2',
              fontWeight: 600,
            }}
          >
            Close
          </button>
        </div>
      </ModalShell>
    );
  }

  // Finished screen
  if (finished) {
    const score = scoreQuiz(answers);
    const isPerfect = score === questions.length;

    return (
      <ModalShell onClose={onClose}>
        <div className="p-8 text-center">
          <Trophy
            size={48}
            style={{
              color: isPerfect ? '#C2410C' : '#6B6B7E',
              margin: '0 auto 1rem',
            }}
          />
          <p
            style={{ ...fontStyle, color: '#1A1A2E' }}
            className="text-3xl font-bold mb-2"
          >
            {score}/{questions.length}
          </p>
          <p style={{ ...bodyFontStyle, color: '#6B6B7E' }} className="text-sm mb-6">
            {isPerfect
              ? "Perfect score! You're a Wiki master."
              : score >= questions.length / 2
              ? 'Nice work!'
              : "Better luck tomorrow."}
          </p>

          <div className="space-y-3 mb-6 text-left">
            {questions.map((q, i) => {
              const correct = answers[i]?.userAnswer === q.correctAnswer;
              return (
                <div
                  key={i}
                  className="p-3 flex items-start gap-2"
                  style={{
                    backgroundColor: correct
                      ? 'rgba(34, 197, 94, 0.08)'
                      : 'rgba(194, 65, 12, 0.08)',
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: correct ? '#22c55e' : '#C2410C',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                    }}
                  >
                    {correct ? (
                      <Check size={12} color="#fff" />
                    ) : (
                      <X size={12} color="#fff" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      style={{ ...bodyFontStyle, color: '#1A1A2E', fontSize: '0.85rem' }}
                    >
                      {q.context}
                    </p>
                    <p
                      style={{
                        ...bodyFontStyle,
                        color: correct ? '#22c55e' : '#C2410C',
                        fontSize: '0.8rem',
                        marginTop: 4,
                        fontWeight: 600,
                      }}
                    >
                      {correct
                        ? `Correct: ${q.correctAnswer}`
                        : `Answer: ${q.correctAnswer} (you said ${answers[i].userAnswer})`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                const text = `I scored ${score}/${questions.length} on today's Daily Wiki quiz! 🧠 dailywiki.app`;
                if (navigator.share) {
                  navigator.share({ text }).catch(() => {});
                } else {
                  navigator.clipboard?.writeText(text);
                  alert('Copied to clipboard!');
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 transition-transform hover:scale-[1.02]"
              style={{
                ...bodyFontStyle,
                backgroundColor: '#1A1A2E',
                color: '#FAF7F2',
                fontWeight: 600,
              }}
            >
              <Share2 size={16} />
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

  // Quiz in progress
  const q = questions[currentIdx];

  return (
    <ModalShell onClose={onClose}>
      <div className="p-6 md:p-8">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-6">
          {questions.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1"
              style={{
                backgroundColor:
                  i < currentIdx ? '#1A1A2E' : i === currentIdx ? '#C2410C' : 'rgba(26,26,46,0.15)',
              }}
            />
          ))}
        </div>

        <p
          style={{ ...bodyFontStyle, color: '#6B6B7E', fontSize: '0.75rem' }}
          className="uppercase tracking-widest mb-2"
        >
          Question {currentIdx + 1} of {questions.length}
        </p>

        <p
          style={{ ...fontStyle, color: '#1A1A2E', lineHeight: 1.3 }}
          className="text-xl font-bold mb-4"
        >
          {q.prompt}
        </p>

        <div
          className="p-4 mb-6 italic"
          style={{
            ...fontStyle,
            backgroundColor: 'rgba(26,26,46,0.05)',
            color: '#1A1A2E',
            borderLeft: '3px solid #C2410C',
          }}
        >
          {q.context}
        </div>

        <div className="space-y-2 mb-6">
          {q.options.map((opt) => {
            const isSelected = selected === opt;
            const isCorrect = opt === q.correctAnswer;
            const showState = revealed;

            let bg = '#FAF7F2';
            let border = 'rgba(26,26,46,0.2)';
            let color = '#1A1A2E';

            if (showState) {
              if (isCorrect) {
                bg = 'rgba(34, 197, 94, 0.12)';
                border = '#22c55e';
              } else if (isSelected) {
                bg = 'rgba(194, 65, 12, 0.12)';
                border = '#C2410C';
              }
            } else if (isSelected) {
              bg = 'rgba(26,26,46,0.08)';
              border = '#1A1A2E';
            }

            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                disabled={revealed}
                className="w-full text-left px-4 py-3 transition-all flex items-center justify-between"
                style={{
                  ...bodyFontStyle,
                  backgroundColor: bg,
                  border: `1.5px solid ${border}`,
                  color,
                  fontWeight: isSelected ? 600 : 500,
                  cursor: revealed ? 'default' : 'pointer',
                }}
              >
                <span>{opt}</span>
                {showState && isCorrect && (
                  <Check size={18} style={{ color: '#22c55e' }} />
                )}
                {showState && isSelected && !isCorrect && (
                  <X size={18} style={{ color: '#C2410C' }} />
                )}
              </button>
            );
          })}
        </div>

        {!revealed ? (
          <button
            onClick={handleConfirm}
            disabled={selected === null}
            className="w-full px-5 py-3 transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              ...bodyFontStyle,
              backgroundColor: '#1A1A2E',
              color: '#FAF7F2',
              fontWeight: 600,
            }}
          >
            Confirm
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 transition-transform hover:scale-[1.02]"
            style={{
              ...bodyFontStyle,
              backgroundColor: '#C2410C',
              color: '#FAF7F2',
              fontWeight: 600,
            }}
          >
            {currentIdx + 1 >= questions.length ? 'See results' : 'Next question'}
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </ModalShell>
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
          className="absolute top-4 right-4 p-1 rounded-full transition-opacity hover:opacity-60 z-10"
          style={{ color: '#1A1A2E' }}
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
