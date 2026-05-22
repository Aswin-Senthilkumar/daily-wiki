import { useState, useEffect, useRef } from 'react';
import {
  Flame, Share2, X, Download, ExternalLink, Loader2, BookOpen,
  Sparkles, Calendar, Settings as SettingsIcon, Trophy
} from 'lucide-react';

import { fetchTodaysFeed, dateKey } from './wikipedia.js';
import {
  updateStreak, getStreak, isOnboarded, cacheArticle, getCachedArticle,
  getTopics
} from './storage.js';

import Quiz from './Quiz.jsx';
import Archive from './Archive.jsx';
import Settings from './Settings.jsx';
import Onboarding from './Onboarding.jsx';

export default function App() {
  const [feed, setFeed] = useState(null);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [streak, setStreak] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!isOnboarded());
  const [userTopics, setUserTopics] = useState(getTopics());
  const imageRef = useRef(null);

  // Fetch today's article
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const todayKey = dateKey(new Date());
        const cached = getCachedArticle(todayKey);
        if (cached?.tfa) {
          setFeed(cached);
          setArticle(cached.tfa);
          setLoading(false);
          return;
        }

        const data = await fetchTodaysFeed();
        if (data?.tfa) {
          setFeed(data);
          setArticle(data.tfa);
          cacheArticle(todayKey, data);
        } else {
          // Fallback to random
          const res = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary');
          const random = await res.json();
          setArticle(random);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, []);

  // Update streak on mount (after onboarding)
  useEffect(() => {
    if (!showOnboarding) {
      const newStreak = updateStreak();
      setStreak(newStreak);
    }
  }, [showOnboarding]);

  // Canvas helpers (share card)
  const wrapText = (ctx, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      const { width } = ctx.measureText(test);
      if (width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  const downloadShareCard = async () => {
    if (!article) return;
    setDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      const W = 1080, H = 1920;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#FAF7F2';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = '#1A1A2E';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 200);
      ctx.lineTo(W - 80, 200);
      ctx.stroke();

      ctx.fillStyle = '#1A1A2E';
      ctx.font = 'bold 32px Georgia, serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('DAILY WIKI', 80, 150);

      const dateStr = new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
      ctx.font = '28px Georgia, serif';
      ctx.textAlign = 'right';
      ctx.fillText(dateStr, W - 80, 150);
      ctx.textAlign = 'left';

      const imgSrc = article.originalimage?.source || article.thumbnail?.source;
      if (imgSrc) {
        await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const tw = W - 160, th = 600;
            const iRatio = img.width / img.height;
            const tRatio = tw / th;
            let sx, sy, sw, sh;
            if (iRatio > tRatio) {
              sh = img.height;
              sw = img.height * tRatio;
              sx = (img.width - sw) / 2;
              sy = 0;
            } else {
              sw = img.width;
              sh = img.width / tRatio;
              sx = 0;
              sy = (img.height - sh) / 2;
            }
            ctx.drawImage(img, sx, sy, sw, sh, 80, 260, tw, th);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = imgSrc;
        });
      }

      ctx.fillStyle = '#1A1A2E';
      ctx.font = 'bold 64px Georgia, serif';
      const title = article.titles?.normalized || article.title || '';
      const titleLines = wrapText(ctx, title, W - 160);
      let y = 980;
      titleLines.forEach((line) => {
        ctx.fillText(line, 80, y);
        y += 80;
      });

      ctx.fillStyle = '#3A3A4E';
      ctx.font = '32px Georgia, serif';
      const summary = article.extract || '';
      const truncated = summary.length > 280 ? summary.slice(0, 280) + '…' : summary;
      const summaryLines = wrapText(ctx, truncated, W - 160);
      y += 30;
      summaryLines.forEach((line) => {
        ctx.fillText(line, 80, y);
        y += 48;
      });

      ctx.strokeStyle = '#1A1A2E';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, H - 160);
      ctx.lineTo(W - 80, H - 160);
      ctx.stroke();

      ctx.fillStyle = '#1A1A2E';
      ctx.font = 'bold 28px Georgia, serif';
      ctx.fillText('dailywiki.app', 80, H - 100);

      ctx.fillStyle = '#C2410C';
      ctx.font = 'bold 28px Georgia, serif';
      ctx.textAlign = 'right';
      ctx.fillText(`🔥 ${streak} day${streak !== 1 ? 's' : ''}`, W - 80, H - 100);
      ctx.textAlign = 'left';

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `daily-wiki-${new Date().toISOString().slice(0, 10)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const fontStyle = { fontFamily: "'Fraunces', Georgia, serif" };
  const bodyFontStyle = { fontFamily: "'DM Sans', system-ui, sans-serif" };

  // Show onboarding for first-time visitors
  if (showOnboarding) {
    return (
      <>
        <GlobalStyles />
        <Onboarding
          onComplete={() => {
            setShowOnboarding(false);
            setUserTopics(getTopics());
          }}
          fontStyle={fontStyle}
          bodyFontStyle={bodyFontStyle}
        />
      </>
    );
  }

  return (
    <div style={{ backgroundColor: '#FAF7F2', minHeight: '100vh' }}>
      <GlobalStyles />

      {/* Header */}
      <header className="border-b" style={{ borderColor: '#1A1A2E' }}>
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={22} style={{ color: '#1A1A2E' }} />
            <div>
              <h1
                className="text-xl font-bold tracking-tight leading-none"
                style={{ ...fontStyle, color: '#1A1A2E' }}
              >
                Daily Wiki
              </h1>
              <p
                className="text-xs mt-1 tracking-wider uppercase"
                style={{ ...bodyFontStyle, color: '#6B6B7E' }}
              >
                {today}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setArchiveOpen(true)}
              className="p-2 hover:bg-black/5 transition-colors"
              style={{ color: '#1A1A2E' }}
              title="Archive"
            >
              <Calendar size={18} />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 hover:bg-black/5 transition-colors"
              style={{ color: '#1A1A2E' }}
              title="Settings"
            >
              <SettingsIcon size={18} />
            </button>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full ml-1"
              style={{ backgroundColor: '#1A1A2E', color: '#FAF7F2' }}
            >
              <span className="flame-pulse" style={{ color: '#FB923C' }}>
                <Flame size={16} fill="#FB923C" />
              </span>
              <span className="text-sm font-semibold" style={bodyFontStyle}>
                {streak}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin" style={{ color: '#1A1A2E' }} />
            <p
              className="mt-4 text-sm tracking-wider uppercase"
              style={{ ...bodyFontStyle, color: '#6B6B7E' }}
            >
              Fetching today's article
            </p>
          </div>
        )}

        {error && (
          <div className="py-20 text-center">
            <p style={{ ...fontStyle, color: '#C2410C' }} className="text-lg">
              Couldn't load today's article.
            </p>
            <p style={{ ...bodyFontStyle, color: '#6B6B7E' }} className="text-sm mt-2">
              {error}
            </p>
          </div>
        )}

        {article && !loading && (
          <article>
            <div className="fade-up fade-up-1 flex items-center gap-2 mb-6">
              <Sparkles size={14} style={{ color: '#C2410C' }} />
              <span
                className="text-xs tracking-widest uppercase"
                style={{ ...bodyFontStyle, color: '#C2410C', fontWeight: 600 }}
              >
                Today's Featured Article
              </span>
              <span
                className="flex-1 h-px"
                style={{ backgroundColor: '#1A1A2E', opacity: 0.15 }}
              />
            </div>

            <h2
              className="fade-up fade-up-2 mb-4 leading-tight"
              style={{
                ...fontStyle,
                color: '#1A1A2E',
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: 900,
                letterSpacing: '-0.02em',
              }}
            >
              {article.titles?.normalized || article.title}
            </h2>

            {article.description && (
              <p
                className="fade-up fade-up-2 mb-8 text-lg italic"
                style={{ ...fontStyle, color: '#6B6B7E', fontWeight: 400 }}
              >
                {article.description}
              </p>
            )}

            {(article.thumbnail?.source || article.originalimage?.source) && (
              <div className="fade-up fade-up-3 mb-10 overflow-hidden">
                <img
                  ref={imageRef}
                  crossOrigin="anonymous"
                  src={article.originalimage?.source || article.thumbnail?.source}
                  alt={article.title}
                  onLoad={() => setImageLoaded(true)}
                  className="w-full h-auto"
                  style={{
                    maxHeight: '500px',
                    objectFit: 'cover',
                    filter: imageLoaded ? 'none' : 'blur(20px)',
                    transition: 'filter 0.4s ease',
                  }}
                />
                <p
                  className="text-xs mt-2 italic"
                  style={{ ...bodyFontStyle, color: '#6B6B7E' }}
                >
                  Image via Wikimedia Commons
                </p>
              </div>
            )}

            <div
              className="fade-up fade-up-3 mb-8 text-lg leading-relaxed"
              style={{ ...fontStyle, color: '#1A1A2E', fontWeight: 400 }}
            >
              <span
                style={{
                  fontSize: '4rem',
                  float: 'left',
                  lineHeight: '0.85',
                  marginRight: '0.5rem',
                  marginTop: '0.25rem',
                  color: '#C2410C',
                  fontWeight: 900,
                }}
              >
                {article.extract?.[0]}
              </span>
              {article.extract?.slice(1)}
            </div>

            {article.extract_html && (
              <div className="fade-up fade-up-4 mb-10">
                {!expanded ? (
                  <button
                    onClick={() => setExpanded(true)}
                    className="text-sm tracking-wider uppercase font-semibold border-b pb-1 transition-opacity hover:opacity-60"
                    style={{
                      ...bodyFontStyle,
                      color: '#1A1A2E',
                      borderColor: '#1A1A2E',
                    }}
                  >
                    Read full article ↓
                  </button>
                ) : (
                  <div
                    className="article-body text-base leading-relaxed mt-4"
                    style={{ ...fontStyle, color: '#1A1A2E' }}
                    dangerouslySetInnerHTML={{ __html: article.extract_html }}
                  />
                )}
              </div>
            )}

            {/* Action bar */}
            <div
              className="fade-up fade-up-4 flex flex-wrap items-center gap-3 pt-8 border-t"
              style={{ borderColor: 'rgba(26,26,46,0.15)' }}
            >
              <button
                onClick={() => setQuizOpen(true)}
                className="flex items-center gap-2 px-5 py-3 transition-transform hover:scale-105"
                style={{
                  ...bodyFontStyle,
                  backgroundColor: '#C2410C',
                  color: '#FAF7F2',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                <Trophy size={16} />
                Take today's quiz
              </button>
              <button
                onClick={() => setShareOpen(true)}
                className="flex items-center gap-2 px-5 py-3 transition-transform hover:scale-105"
                style={{
                  ...bodyFontStyle,
                  backgroundColor: '#1A1A2E',
                  color: '#FAF7F2',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                <Share2 size={16} />
                Share
              </button>
              {article.content_urls?.desktop?.page && (
                <a
                  href={article.content_urls.desktop.page}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 transition-transform hover:scale-105"
                  style={{
                    ...bodyFontStyle,
                    backgroundColor: 'transparent',
                    color: '#1A1A2E',
                    border: '1.5px solid #1A1A2E',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Read on Wikipedia
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </article>
        )}
      </main>

      <footer
        className="border-t mt-20"
        style={{ borderColor: 'rgba(26,26,46,0.15)' }}
      >
        <div className="max-w-3xl mx-auto px-6 py-8 text-center">
          <p
            className="text-xs tracking-wider uppercase"
            style={{ ...bodyFontStyle, color: '#6B6B7E' }}
          >
            One article. One day. Stay curious.
          </p>
        </div>
      </footer>

      {/* Share card modal */}
      {shareOpen && article && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: 'rgba(26,26,46,0.7)' }}
          onClick={() => setShareOpen(false)}
        >
          <div
            className="relative max-w-md w-full max-h-[90vh] overflow-auto"
            style={{ backgroundColor: '#FAF7F2' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShareOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full transition-opacity hover:opacity-60 z-10"
              style={{ color: '#1A1A2E' }}
            >
              <X size={20} />
            </button>

            <div className="p-6">
              <h3
                className="text-sm tracking-widest uppercase mb-1"
                style={{ ...bodyFontStyle, color: '#6B6B7E', fontWeight: 600 }}
              >
                Share Card Preview
              </h3>
              <p
                className="text-xs mb-6"
                style={{ ...bodyFontStyle, color: '#6B6B7E' }}
              >
                Sized for Instagram Stories (9:16)
              </p>

              <div
                className="aspect-[9/16] border w-full"
                style={{
                  backgroundColor: '#FAF7F2',
                  borderColor: 'rgba(26,26,46,0.2)',
                  padding: '7%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  className="flex justify-between items-center pb-3"
                  style={{ borderBottom: '1px solid #1A1A2E' }}
                >
                  <span
                    style={{
                      ...fontStyle,
                      color: '#1A1A2E',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      letterSpacing: '0.1em',
                    }}
                  >
                    DAILY WIKI
                  </span>
                  <span style={{ ...fontStyle, color: '#1A1A2E', fontSize: '0.65rem' }}>
                    {new Date().toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>

                {(article.thumbnail?.source || article.originalimage?.source) && (
                  <div className="my-3" style={{ height: '30%', overflow: 'hidden' }}>
                    <img
                      src={article.thumbnail?.source || article.originalimage?.source}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <h4
                  className="leading-tight mb-2"
                  style={{
                    ...fontStyle,
                    color: '#1A1A2E',
                    fontWeight: 900,
                    fontSize: '1.05rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {article.titles?.normalized || article.title}
                </h4>

                <p
                  className="leading-snug flex-1"
                  style={{ ...fontStyle, color: '#3A3A4E', fontSize: '0.7rem' }}
                >
                  {article.extract?.length > 140
                    ? article.extract.slice(0, 140) + '…'
                    : article.extract}
                </p>

                <div
                  className="flex justify-between items-center pt-3 mt-2"
                  style={{ borderTop: '1px solid #1A1A2E' }}
                >
                  <span
                    style={{
                      ...fontStyle,
                      color: '#1A1A2E',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                    }}
                  >
                    dailywiki.app
                  </span>
                  <span
                    style={{
                      ...fontStyle,
                      color: '#C2410C',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                    }}
                  >
                    🔥 {streak} day{streak !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <button
                onClick={downloadShareCard}
                disabled={downloading}
                className="w-full mt-6 flex items-center justify-center gap-2 px-5 py-3 transition-transform hover:scale-[1.02] disabled:opacity-50"
                style={{
                  ...bodyFontStyle,
                  backgroundColor: '#1A1A2E',
                  color: '#FAF7F2',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                {downloading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download PNG
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz modal */}
      {quizOpen && article && (
        <Quiz
          article={article}
          feed={feed}
          onClose={() => setQuizOpen(false)}
          fontStyle={fontStyle}
          bodyFontStyle={bodyFontStyle}
        />
      )}

      {/* Archive modal */}
      {archiveOpen && (
        <Archive
          onClose={() => setArchiveOpen(false)}
          fontStyle={fontStyle}
          bodyFontStyle={bodyFontStyle}
        />
      )}

      {/* Settings modal */}
      {settingsOpen && (
        <Settings
          onClose={() => setSettingsOpen(false)}
          onTopicsChange={setUserTopics}
          fontStyle={fontStyle}
          bodyFontStyle={bodyFontStyle}
        />
      )}
    </div>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&family=DM+Sans:wght@400;500;600&display=swap');
      @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
      .fade-up { animation: fadeUp 0.6s ease-out forwards; }
      .fade-up-1 { animation-delay: 0.1s; opacity: 0; }
      .fade-up-2 { animation-delay: 0.2s; opacity: 0; }
      .fade-up-3 { animation-delay: 0.3s; opacity: 0; }
      .fade-up-4 { animation-delay: 0.4s; opacity: 0; }
      .flame-pulse { animation: pulse 2.5s ease-in-out infinite; }
      .article-body p { margin-bottom: 1em; }
    `}</style>
  );
}
