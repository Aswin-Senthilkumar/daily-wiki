import { useState, useEffect } from 'react';
import { X, Check, BarChart3, Coffee, Settings as SettingsIcon } from 'lucide-react';
import { ALL_TOPICS, getTopics, setTopics, getQuizStats, getStreak } from './storage.js';

export default function Settings({ onClose, fontStyle, bodyFontStyle, onTopicsChange }) {
  const [selected, setSelectedState] = useState(getTopics());
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setStats(getQuizStats());
  }, []);

  const streak = getStreak();

  const toggleTopic = (id) => {
    const next = selected.includes(id)
      ? selected.filter((t) => t !== id)
      : [...selected, id];
    setSelectedState(next);
    setTopics(next);
    onTopicsChange?.(next);
  };

  const clearAll = () => {
    setSelectedState([]);
    setTopics([]);
    onTopicsChange?.([]);
  };

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
        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FAF7F2' }}>
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: 'rgba(26,26,46,0.15)' }}
          >
            <div className="flex items-center gap-2">
              <SettingsIcon size={18} style={{ color: '#1A1A2E' }} />
              <h3
                style={{ ...fontStyle, color: '#1A1A2E', fontWeight: 700 }}
                className="text-lg"
              >
                Settings
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:opacity-60"
              style={{ color: '#1A1A2E' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Stats section */}
          {stats && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} style={{ color: '#1A1A2E' }} />
                <h4
                  className="text-sm uppercase tracking-widest"
                  style={{ ...bodyFontStyle, color: '#1A1A2E', fontWeight: 600 }}
                >
                  Your stats
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Current streak"
                  value={`${streak.count}`}
                  suffix={streak.count === 1 ? 'day' : 'days'}
                  fontStyle={fontStyle}
                  bodyFontStyle={bodyFontStyle}
                />
                <StatCard
                  label="Quizzes played"
                  value={stats.totalPlayed}
                  fontStyle={fontStyle}
                  bodyFontStyle={bodyFontStyle}
                />
                <StatCard
                  label="Accuracy"
                  value={stats.accuracy}
                  suffix="%"
                  fontStyle={fontStyle}
                  bodyFontStyle={bodyFontStyle}
                />
                <StatCard
                  label="Perfect scores"
                  value={stats.perfectScores}
                  fontStyle={fontStyle}
                  bodyFontStyle={bodyFontStyle}
                />
              </div>
            </section>
          )}

          {/* Topic preferences */}
          <section>
            <h4
              className="text-sm uppercase tracking-widest mb-2"
              style={{ ...bodyFontStyle, color: '#1A1A2E', fontWeight: 600 }}
            >
              Topics you like
            </h4>
            <p
              className="text-xs mb-4"
              style={{ ...bodyFontStyle, color: '#6B6B7E' }}
            >
              Tap to toggle. Selected topics will be highlighted in the article
              feed. (Filtering coming in v1.2.)
            </p>

            <div className="grid grid-cols-2 gap-2">
              {ALL_TOPICS.map((topic) => {
                const isOn = selected.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    onClick={() => toggleTopic(topic.id)}
                    className="flex items-center gap-2 px-3 py-2.5 transition-all text-left"
                    style={{
                      ...bodyFontStyle,
                      backgroundColor: isOn ? '#1A1A2E' : 'transparent',
                      color: isOn ? '#FAF7F2' : '#1A1A2E',
                      border: `1.5px solid ${isOn ? '#1A1A2E' : 'rgba(26,26,46,0.2)'}`,
                      fontWeight: 500,
                      fontSize: '0.85rem',
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{topic.emoji}</span>
                    <span className="flex-1">{topic.label}</span>
                    {isOn && <Check size={14} />}
                  </button>
                );
              })}
            </div>

            {selected.length > 0 && (
              <button
                onClick={clearAll}
                className="mt-3 text-xs underline opacity-60 hover:opacity-100"
                style={{ ...bodyFontStyle, color: '#1A1A2E' }}
              >
                Clear all
              </button>
            )}
          </section>

          {/* Support */}
          <section
            className="pt-6"
            style={{ borderTop: '1px solid rgba(26,26,46,0.15)' }}
          >
            <h4
              className="text-sm uppercase tracking-widest mb-3"
              style={{ ...bodyFontStyle, color: '#1A1A2E', fontWeight: 600 }}
            >
              Support Daily Wiki
            </h4>
            <p
              className="text-xs mb-4"
              style={{ ...bodyFontStyle, color: '#6B6B7E' }}
            >
              Daily Wiki is free and ad-free. If you enjoy it, consider buying
              the maker a coffee.
            </p>
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-3 transition-transform hover:scale-[1.02]"
              style={{
                ...bodyFontStyle,
                backgroundColor: 'transparent',
                color: '#1A1A2E',
                border: '1.5px solid #1A1A2E',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
              onClick={() => window.open('https://buymeacoffee.com/aswinsenthilkumar', '_blank')}
            >
              <Coffee size={14} />
              Buy me a coffee
            </button>
          </section>

          <p
            className="text-xs text-center opacity-50 pt-2"
            style={{ ...bodyFontStyle, color: '#6B6B7E' }}
          >
            Daily Wiki v1.2 · Content from Wikipedia, CC BY-SA 4.0
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix, fontStyle, bodyFontStyle }) {
  return (
    <div
      className="p-3"
      style={{
        backgroundColor: 'rgba(26,26,46,0.05)',
        borderLeft: '3px solid #C2410C',
      }}
    >
      <p
        className="text-xs uppercase tracking-wider mb-1"
        style={{ ...bodyFontStyle, color: '#6B6B7E', fontWeight: 500 }}
      >
        {label}
      </p>
      <p
        style={{ ...fontStyle, color: '#1A1A2E', fontWeight: 900 }}
        className="text-2xl"
      >
        {value}
        {suffix && (
          <span
            className="text-xs ml-1 font-normal"
            style={{ ...bodyFontStyle, color: '#6B6B7E' }}
          >
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}
