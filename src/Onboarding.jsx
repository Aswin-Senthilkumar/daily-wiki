import { useState } from 'react';
import { ChevronRight, BookOpen, Flame, Trophy } from 'lucide-react';
import { ALL_TOPICS, setTopics, markOnboarded } from './storage.js';

export default function Onboarding({ onComplete, fontStyle, bodyFontStyle }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState([]);

  const toggleTopic = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleFinish = () => {
    setTopics(selected);
    markOnboarded();
    onComplete();
  };

  const steps = [
    {
      icon: BookOpen,
      title: 'One article a day',
      copy: "Daily Wiki sends you one hand-picked Wikipedia article every day. No feed, no algorithm — just one good read.",
    },
    {
      icon: Flame,
      title: 'Build a streak',
      copy: "Come back every day to grow your streak. Miss a day and it resets — gentle pressure to stay curious.",
    },
    {
      icon: Trophy,
      title: 'Test yourself',
      copy: "After reading, take a quick 3-question quiz on what you just learned. Share your scores with friends.",
    },
  ];

  if (step < steps.length) {
    const s = steps[step];
    const Icon = s.icon;

    return (
      <div
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
        style={{ backgroundColor: '#FAF7F2' }}
      >
        <div className="max-w-md w-full text-center">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-12">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-1 transition-all"
                style={{
                  width: i === step ? 24 : 8,
                  backgroundColor:
                    i <= step ? '#1A1A2E' : 'rgba(26,26,46,0.2)',
                }}
              />
            ))}
            <div
              className="h-1 transition-all"
              style={{
                width: 8,
                backgroundColor:
                  step >= steps.length ? '#1A1A2E' : 'rgba(26,26,46,0.2)',
              }}
            />
          </div>

          <div className="mb-8">
            <div
              className="inline-flex items-center justify-center mb-6"
              style={{
                width: 72,
                height: 72,
                backgroundColor: '#1A1A2E',
                color: '#FAF7F2',
              }}
            >
              <Icon size={32} />
            </div>
            <h2
              className="mb-4 leading-tight"
              style={{
                ...fontStyle,
                color: '#1A1A2E',
                fontSize: '2.25rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
              }}
            >
              {s.title}
            </h2>
            <p
              className="text-base px-4"
              style={{ ...fontStyle, color: '#3A3A4E', lineHeight: 1.6 }}
            >
              {s.copy}
            </p>
          </div>

          <button
            onClick={() => setStep(step + 1)}
            className="inline-flex items-center gap-2 px-6 py-3 transition-transform hover:scale-105"
            style={{
              ...bodyFontStyle,
              backgroundColor: '#1A1A2E',
              color: '#FAF7F2',
              fontWeight: 600,
            }}
          >
            {step === steps.length - 1 ? 'Pick your topics' : 'Next'}
            <ChevronRight size={16} />
          </button>

          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="block mx-auto mt-4 text-xs underline opacity-60 hover:opacity-100"
              style={{ ...bodyFontStyle, color: '#1A1A2E' }}
            >
              Back
            </button>
          )}
        </div>
      </div>
    );
  }

  // Final step: topic picker
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: '#FAF7F2' }}
    >
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2
            className="mb-3 leading-tight"
            style={{
              ...fontStyle,
              color: '#1A1A2E',
              fontSize: '2rem',
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
          >
            What interests you?
          </h2>
          <p
            className="text-sm px-4"
            style={{ ...bodyFontStyle, color: '#6B6B7E' }}
          >
            Pick a few — we'll prioritise these in your feed. (You can skip.)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-8">
          {ALL_TOPICS.map((topic) => {
            const isOn = selected.includes(topic.id);
            return (
              <button
                key={topic.id}
                onClick={() => toggleTopic(topic.id)}
                className="flex items-center gap-2 px-3 py-3 transition-all text-left"
                style={{
                  ...bodyFontStyle,
                  backgroundColor: isOn ? '#1A1A2E' : 'transparent',
                  color: isOn ? '#FAF7F2' : '#1A1A2E',
                  border: `1.5px solid ${isOn ? '#1A1A2E' : 'rgba(26,26,46,0.2)'}`,
                  fontWeight: 500,
                  fontSize: '0.9rem',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{topic.emoji}</span>
                <span>{topic.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleFinish}
          className="w-full px-6 py-3 transition-transform hover:scale-[1.02]"
          style={{
            ...bodyFontStyle,
            backgroundColor: '#1A1A2E',
            color: '#FAF7F2',
            fontWeight: 600,
          }}
        >
          {selected.length > 0
            ? `Continue with ${selected.length} topic${selected.length === 1 ? '' : 's'}`
            : 'Skip and continue'}
        </button>
      </div>
    </div>
  );
}
