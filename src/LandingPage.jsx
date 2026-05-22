import { useState, useEffect } from 'react';
import { BookOpen, Flame, Trophy, Shuffle, ChevronRight, Star } from 'lucide-react';

const FEATURES = [
  {
    icon: BookOpen,
    title: 'One article a day',
    body: 'No feed, no algorithm. Wikipedia\'s editors pick one outstanding article every day — we present it beautifully.',
  },
  {
    icon: Flame,
    title: 'Build a streak',
    body: 'Come back every day to grow your streak. Simple, satisfying, habit-forming.',
  },
  {
    icon: Trophy,
    title: 'Quiz yourself',
    body: 'Three questions generated from the article. Can you get a perfect score?',
  },
  {
    icon: Shuffle,
    title: 'Discover more',
    body: 'Finished the daily? Pull a random article matched to your interests and keep exploring.',
  },
];

const SAMPLE_TOPICS = ['Science', 'History', 'Technology', 'Nature', 'Culture', 'Geography'];

export default function LandingPage({ onGetStarted, fontStyle, bodyFontStyle }) {
  const [visible, setVisible] = useState(false);
  const [topicIdx, setTopicIdx] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Cycle through topic examples
  useEffect(() => {
    const interval = setInterval(() => {
      setTopicIdx((i) => (i + 1) % SAMPLE_TOPICS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        backgroundColor: '#FAF7F2',
        minHeight: '100vh',
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(26,22,18,0.04) 1px, transparent 0)`,
        backgroundSize: '24px 24px',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes topicFade {
          0%, 100% { opacity: 0; transform: translateY(6px); }
          15%, 85%  { opacity: 1; transform: translateY(0); }
        }
        .land-1 { animation: fadeUp 0.6s ease-out 0.1s both; }
        .land-2 { animation: fadeUp 0.6s ease-out 0.25s both; }
        .land-3 { animation: fadeUp 0.6s ease-out 0.4s both; }
        .land-4 { animation: fadeUp 0.6s ease-out 0.55s both; }
        .land-5 { animation: fadeUp 0.6s ease-out 0.7s both; }
        .topic-cycle { animation: topicFade 1.8s ease-in-out; }
      `}</style>

      {/* Nav */}
      <nav
        className="flex items-center justify-between px-6 py-5 md:px-12 border-b"
        style={{ borderColor: 'rgba(26,26,46,0.15)' }}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={20} style={{ color: '#1A1A2E' }} />
          <span
            style={{ ...fontStyle, color: '#1A1A2E', fontWeight: 900, letterSpacing: '-0.02em' }}
            className="text-lg"
          >
            Daily Wiki
          </span>
        </div>
        <button
          onClick={onGetStarted}
          className="text-sm px-4 py-2 transition-transform hover:scale-105"
          style={{
            ...bodyFontStyle,
            backgroundColor: '#1A1A2E',
            color: '#FAF7F2',
            fontWeight: 600,
          }}
        >
          Start reading
        </button>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-12 md:px-12 md:pt-24 text-center">
        <div className="land-1 inline-flex items-center gap-2 px-3 py-1 mb-6" style={{ backgroundColor: 'rgba(194,65,12,0.1)' }}>
          <Star size={12} style={{ color: '#C2410C' }} />
          <span
            className="text-xs tracking-widest uppercase"
            style={{ ...bodyFontStyle, color: '#C2410C', fontWeight: 600 }}
          >
            Free · No account needed
          </span>
        </div>

        <h1
          className="land-2 leading-tight mb-6"
          style={{
            ...fontStyle,
            color: '#1A1A2E',
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
          }}
        >
          One Wikipedia article.<br />
          Every day.
        </h1>

        <p
          className="land-3 text-lg md:text-xl mb-4 max-w-xl mx-auto leading-relaxed"
          style={{ ...fontStyle, color: '#6B6B7E', fontStyle: 'italic' }}
        >
          Stay curious about{' '}
          <span
            key={topicIdx}
            className="topic-cycle"
            style={{ color: '#C2410C', fontWeight: 600, fontStyle: 'normal', display: 'inline-block' }}
          >
            {SAMPLE_TOPICS[topicIdx]}
          </span>
          {' '}— one hand-picked read a day, no noise.
        </p>

        <p
          className="land-3 text-sm mb-10"
          style={{ ...bodyFontStyle, color: '#9B9BAE' }}
        >
          Curated by Wikipedia's own editors. Always free.
        </p>

        <div className="land-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onGetStarted}
            className="flex items-center gap-2 px-8 py-4 text-base transition-transform hover:scale-105 w-full sm:w-auto justify-center"
            style={{
              ...bodyFontStyle,
              backgroundColor: '#1A1A2E',
              color: '#FAF7F2',
              fontWeight: 700,
            }}
          >
            Start for free
            <ChevronRight size={18} />
          </button>
          <p
            className="text-xs"
            style={{ ...bodyFontStyle, color: '#9B9BAE' }}
          >
            No sign-up. Works on any device.
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <div
        className="land-4 border-t border-b py-6"
        style={{ borderColor: 'rgba(26,26,46,0.1)' }}
      >
        <div className="max-w-3xl mx-auto px-6 md:px-12 flex flex-wrap justify-center gap-10">
          {[
            { value: '6,000,000+', label: 'Wikipedia articles' },
            { value: 'Daily',      label: 'New article every day' },
            { value: '3',          label: 'Quiz questions per article' },
            { value: '100%',       label: 'Free forever' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p
                style={{ ...fontStyle, color: '#1A1A2E', fontWeight: 900, fontSize: '1.5rem' }}
              >
                {s.value}
              </p>
              <p
                className="text-xs tracking-wider uppercase mt-1"
                style={{ ...bodyFontStyle, color: '#9B9BAE' }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="land-5 max-w-3xl mx-auto px-6 py-16 md:px-12">
        <h2
          className="text-center mb-12 leading-tight"
          style={{
            ...fontStyle,
            color: '#1A1A2E',
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            fontWeight: 900,
            letterSpacing: '-0.02em',
          }}
        >
          Everything you need.<br />Nothing you don't.
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="p-6 flex gap-4"
                style={{ backgroundColor: 'rgba(26,26,46,0.04)' }}
              >
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: 44,
                    height: 44,
                    backgroundColor: '#1A1A2E',
                    color: '#FAF7F2',
                  }}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <h3
                    className="mb-2"
                    style={{ ...fontStyle, color: '#1A1A2E', fontWeight: 700, fontSize: '1.1rem' }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{ ...bodyFontStyle, color: '#6B6B7E', fontSize: '0.9rem', lineHeight: 1.6 }}
                  >
                    {f.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section
        className="border-t"
        style={{ borderColor: 'rgba(26,26,46,0.1)', backgroundColor: '#1A1A2E' }}
      >
        <div className="max-w-3xl mx-auto px-6 py-16 md:px-12 text-center">
          <h2
            className="mb-4 leading-tight"
            style={{
              ...fontStyle,
              color: '#FAF7F2',
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
          >
            Start your streak today.
          </h2>
          <p
            className="mb-8 text-base"
            style={{ ...fontStyle, color: 'rgba(250,247,242,0.6)', fontStyle: 'italic' }}
          >
            It only takes a minute to read. Come back tomorrow to keep it going.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 transition-transform hover:scale-105"
            style={{
              ...bodyFontStyle,
              backgroundColor: '#FAF7F2',
              color: '#1A1A2E',
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            Read today's article
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-6 text-center border-t"
        style={{ borderColor: 'rgba(26,26,46,0.1)' }}
      >
        <p
          className="text-xs"
          style={{ ...bodyFontStyle, color: '#9B9BAE' }}
        >
          Daily Wiki · Content from Wikipedia, CC BY-SA 4.0 ·{' '}
          <a
            href="https://buymeacoffee.com/aswinsenthilkumar"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-70"
          >
            Support the project
          </a>
        </p>
      </footer>
    </div>
  );
}
