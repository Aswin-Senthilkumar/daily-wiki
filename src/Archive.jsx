import { useState, useEffect } from 'react';
import { X, ArrowLeft, Loader2, ExternalLink, Calendar, Check } from 'lucide-react';
import { fetchArticleForDate, getRecentDates, dateKey } from './wikipedia.js';
import { getCachedArticle, cacheArticle, getQuizHistory } from './storage.js';

export default function Archive({ onClose, fontStyle, bodyFontStyle }) {
  const [dates] = useState(() => getRecentDates(14));
  const [selectedDate, setSelectedDate] = useState(null);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const quizHistory = getQuizHistory();

  useEffect(() => {
    if (!selectedDate) return;

    const key = dateKey(selectedDate);
    const cached = getCachedArticle(key);
    if (cached) {
      setArticle(cached);
      return;
    }

    setLoading(true);
    setError(null);
    setArticle(null);

    fetchArticleForDate(selectedDate)
      .then((a) => {
        if (a) {
          setArticle(a);
          cacheArticle(key, a);
        } else {
          setError('No featured article for this day.');
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const formatDateLong = (d) =>
    d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const formatDateShort = (d) =>
    d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

  if (selectedDate && (loading || article || error)) {
    return (
      <ModalShell onClose={onClose}>
        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FAF7F2' }}>
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(26,26,46,0.15)' }}>
            <button
              onClick={() => {
                setSelectedDate(null);
                setArticle(null);
              }}
              className="flex items-center gap-2 px-2 py-1 hover:opacity-60"
              style={{ ...bodyFontStyle, color: '#1A1A2E' }}
            >
              <ArrowLeft size={16} />
              Archive
            </button>
            <button onClick={onClose} className="p-1 hover:opacity-60" style={{ color: '#1A1A2E' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={28} className="animate-spin" style={{ color: '#1A1A2E' }} />
              <p
                className="mt-3 text-xs tracking-widest uppercase"
                style={{ ...bodyFontStyle, color: '#6B6B7E' }}
              >
                Loading
              </p>
            </div>
          )}

          {error && (
            <div className="py-8 text-center">
              <p style={{ ...fontStyle, color: '#C2410C' }}>{error}</p>
            </div>
          )}

          {article && !loading && (
            <article>
              <p
                className="text-xs tracking-widest uppercase mb-3"
                style={{ ...bodyFontStyle, color: '#C2410C', fontWeight: 600 }}
              >
                {formatDateLong(selectedDate)}
              </p>

              <h2
                className="leading-tight mb-3"
                style={{
                  ...fontStyle,
                  color: '#1A1A2E',
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                }}
              >
                {article.titles?.normalized || article.title}
              </h2>

              {article.description && (
                <p
                  className="text-sm italic mb-5"
                  style={{ ...fontStyle, color: '#6B6B7E' }}
                >
                  {article.description}
                </p>
              )}

              {(article.thumbnail?.source || article.originalimage?.source) && (
                <div className="mb-5 overflow-hidden">
                  <img
                    src={article.thumbnail?.source || article.originalimage?.source}
                    alt=""
                    className="w-full h-auto"
                    style={{ maxHeight: '300px', objectFit: 'cover' }}
                  />
                </div>
              )}

              <p
                className="text-base leading-relaxed mb-6"
                style={{ ...fontStyle, color: '#1A1A2E' }}
              >
                {article.extract}
              </p>

              {article.content_urls?.desktop?.page && (
                <a
                  href={article.content_urls.desktop.page}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 transition-transform hover:scale-105"
                  style={{
                    ...bodyFontStyle,
                    backgroundColor: 'transparent',
                    color: '#1A1A2E',
                    border: '1.5px solid #1A1A2E',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                  }}
                >
                  Read on Wikipedia
                  <ExternalLink size={14} />
                </a>
              )}
            </article>
          )}
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="sticky top-0 z-10" style={{ backgroundColor: '#FAF7F2' }}>
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'rgba(26,26,46,0.15)' }}
        >
          <div className="flex items-center gap-2">
            <Calendar size={18} style={{ color: '#1A1A2E' }} />
            <h3 style={{ ...fontStyle, color: '#1A1A2E', fontWeight: 700 }} className="text-lg">
              Archive
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:opacity-60" style={{ color: '#1A1A2E' }}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="p-4">
        <p
          className="text-xs mb-4 px-2"
          style={{ ...bodyFontStyle, color: '#6B6B7E' }}
        >
          The last 14 days of featured articles. Free preview — premium unlocks the full archive.
        </p>

        <div className="space-y-1">
          {dates.map((d) => {
            const key = dateKey(d);
            const cached = getCachedArticle(key);
            const quiz = quizHistory[key];

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(d)}
                className="w-full text-left px-3 py-3 flex items-center justify-between transition-colors hover:bg-black/5"
                style={{ borderBottom: '1px solid rgba(26,26,46,0.08)' }}
              >
                <div className="flex-1 min-w-0">
                  <p
                    style={{ ...bodyFontStyle, color: '#1A1A2E', fontWeight: 600 }}
                    className="text-sm"
                  >
                    {formatDateShort(d)}
                  </p>
                  {cached && (
                    <p
                      style={{ ...fontStyle, color: '#6B6B7E' }}
                      className="text-xs italic truncate mt-0.5"
                    >
                      {cached.titles?.normalized || cached.title}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  {quiz && (
                    <span
                      className="text-xs px-2 py-0.5 flex items-center gap-1"
                      style={{
                        ...bodyFontStyle,
                        backgroundColor:
                          quiz.score === quiz.total
                            ? 'rgba(34, 197, 94, 0.15)'
                            : 'rgba(194, 65, 12, 0.1)',
                        color: quiz.score === quiz.total ? '#22c55e' : '#C2410C',
                        fontWeight: 600,
                      }}
                    >
                      <Check size={10} />
                      {quiz.score}/{quiz.total}
                    </span>
                  )}
                  <ArrowLeft
                    size={14}
                    style={{ transform: 'rotate(180deg)', color: '#6B6B7E' }}
                  />
                </div>
              </button>
            );
          })}
        </div>
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
        {children}
      </div>
    </div>
  );
}
