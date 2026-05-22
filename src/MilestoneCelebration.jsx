import { useState, useEffect } from 'react';
import { Share2, X } from 'lucide-react';
import { markMilestoneSeen } from './storage.js';

export default function MilestoneCelebration({ milestone, streak, onClose, fontStyle, bodyFontStyle }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay for entry animation
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    markMilestoneSeen(milestone.days);
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleShare = () => {
    const text = `I just hit a ${milestone.days}-day streak on Daily Wiki! ${milestone.emoji} "${milestone.label}" — ${milestone.message} dailywiki.app`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).then(() => alert('Copied to clipboard!'));
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-6 z-50"
      style={{
        backgroundColor: 'rgba(26,26,46,0.85)',
        transition: 'opacity 0.3s ease',
        opacity: visible ? 1 : 0,
      }}
      onClick={handleClose}
    >
      <div
        className="relative max-w-sm w-full text-center p-10"
        style={{
          backgroundColor: '#FAF7F2',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
          transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti dots — purely CSS */}
        <style>{`
          @keyframes confettiDrop {
            0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(80px) rotate(360deg); opacity: 0; }
          }
          .confetti-dot {
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            animation: confettiDrop 1.8s ease-in forwards;
          }
        `}</style>
        {[
          { left: '10%', bg: '#C2410C', delay: '0s' },
          { left: '25%', bg: '#1A1A2E', delay: '0.1s' },
          { left: '45%', bg: '#C2410C', delay: '0.05s' },
          { left: '65%', bg: '#1A1A2E', delay: '0.15s' },
          { left: '80%', bg: '#C2410C', delay: '0.08s' },
        ].map((dot, i) => (
          <div
            key={i}
            className="confetti-dot"
            style={{
              left: dot.left,
              top: 0,
              backgroundColor: dot.bg,
              animationDelay: dot.delay,
            }}
          />
        ))}

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 hover:opacity-60"
          style={{ color: '#1A1A2E' }}
        >
          <X size={18} />
        </button>

        {/* Badge */}
        <div
          className="inline-flex items-center justify-center mb-4"
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            backgroundColor: '#1A1A2E',
            fontSize: '2.5rem',
          }}
        >
          {milestone.emoji}
        </div>

        <p
          className="text-xs tracking-widest uppercase mb-2"
          style={{ ...bodyFontStyle, color: '#C2410C', fontWeight: 600 }}
        >
          {milestone.days}-day milestone
        </p>

        <h2
          className="mb-3 leading-tight"
          style={{
            ...fontStyle,
            color: '#1A1A2E',
            fontSize: '2.5rem',
            fontWeight: 900,
            letterSpacing: '-0.02em',
          }}
        >
          {milestone.label}
        </h2>

        <p
          className="mb-8 text-base leading-relaxed"
          style={{ ...fontStyle, color: '#6B6B7E', fontStyle: 'italic' }}
        >
          "{milestone.message}"
        </p>

        <div
          className="flex items-center justify-center gap-2 mb-6 px-4 py-2"
          style={{ backgroundColor: 'rgba(26,26,46,0.06)' }}
        >
          <span style={{ fontSize: '1.2rem' }}>🔥</span>
          <span
            style={{
              ...fontStyle,
              color: '#1A1A2E',
              fontWeight: 700,
              fontSize: '1.1rem',
            }}
          >
            {streak} day streak
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 transition-transform hover:scale-[1.02]"
            style={{
              ...bodyFontStyle,
              backgroundColor: '#1A1A2E',
              color: '#FAF7F2',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            <Share2 size={16} />
            Share this
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-3 transition-transform hover:scale-[1.02]"
            style={{
              ...bodyFontStyle,
              backgroundColor: 'transparent',
              color: '#1A1A2E',
              border: '1.5px solid #1A1A2E',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            Keep reading
          </button>
        </div>
      </div>
    </div>
  );
}
