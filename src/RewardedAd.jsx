import { useState, useEffect } from 'react';
import { X, Play, Heart, ExternalLink } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// RewardedAd — "Support by watching an ad"
//
// HOW TO WIRE UP REAL ADS WHEN ADSENSE IS APPROVED:
//  1. Add to index.html:
//     <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
//  2. Replace the <SimulatedAd> component below with:
//       <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXX"
//            data-ad-slot="XXXXXXXXXX" data-ad-format="rewarded"></ins>
//  3. Call: (adsbygoogle = window.adsbygoogle || []).push({})
//  4. On the reward callback, call onComplete()
//
// For now: shows a simulated ad countdown so the UX is in place.
// ─────────────────────────────────────────────────────────────────────────────

const AD_DURATION = 10; // seconds

export default function RewardedAd({ onClose, onComplete, fontStyle, bodyFontStyle }) {
  const [phase, setPhase]         = useState('intro');   // intro | watching | done
  const [countdown, setCountdown] = useState(AD_DURATION);
  const [canSkip, setCanSkip]     = useState(false);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'watching') return;
    if (countdown <= 0) {
      setPhase('done');
      onComplete?.();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, onComplete]);

  // Allow skip after 5s
  useEffect(() => {
    if (phase !== 'watching') return;
    const t = setTimeout(() => setCanSkip(true), 5000);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: 'rgba(26,26,46,0.85)' }}
    >
      <div
        className="relative max-w-md w-full"
        style={{ backgroundColor: '#FAF7F2' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Intro phase */}
        {phase === 'intro' && (
          <div className="p-8 text-center">
            <div
              className="inline-flex items-center justify-center mb-5"
              style={{ width: 64, height: 64, backgroundColor: '#1A1A2E' }}
            >
              <Heart size={28} style={{ color: '#FAF7F2' }} />
            </div>

            <h3
              className="mb-3 leading-tight"
              style={{ ...fontStyle, color: '#1A1A2E', fontWeight: 900, fontSize: '1.75rem', letterSpacing: '-0.02em' }}
            >
              Support Daily Wiki
            </h3>
            <p
              className="text-sm mb-2 leading-relaxed"
              style={{ ...bodyFontStyle, color: '#6B6B7E' }}
            >
              Daily Wiki is free. Watching a short ad helps keep it that way
              and supports development.
            </p>
            <p
              className="text-xs mb-8"
              style={{ ...bodyFontStyle, color: '#9B9BAE' }}
            >
              {AD_DURATION} seconds · No sign-up · Skip after 5s
            </p>

            <button
              onClick={() => setPhase('watching')}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 mb-3 transition-transform hover:scale-[1.02]"
              style={{ ...bodyFontStyle, backgroundColor: '#1A1A2E', color: '#FAF7F2', fontWeight: 600 }}
            >
              <Play size={16} />
              Watch ad
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm transition-opacity hover:opacity-60"
              style={{ ...bodyFontStyle, color: '#9B9BAE' }}
            >
              No thanks
            </button>
          </div>
        )}

        {/* Watching phase */}
        {phase === 'watching' && (
          <div className="relative">
            {/* Simulated ad space */}
            <div
              className="flex flex-col items-center justify-center"
              style={{
                height: 280,
                backgroundColor: '#1A1A2E',
                backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 0, transparent 50%)',
                backgroundSize: '10px 10px',
              }}
            >
              <p
                className="text-xs tracking-widest uppercase mb-4"
                style={{ ...bodyFontStyle, color: 'rgba(250,247,242,0.4)' }}
              >
                Advertisement
              </p>

              {/* ── REPLACE THIS BLOCK WITH REAL ADSENSE REWARDED AD ── */}
              <div className="text-center px-8">
                <p
                  style={{ ...fontStyle, color: '#FAF7F2', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.3 }}
                  className="mb-3"
                >
                  Ad space
                </p>
                <p
                  style={{ ...bodyFontStyle, color: 'rgba(250,247,242,0.5)', fontSize: '0.8rem' }}
                >
                  Real ads will appear here once Google AdSense is approved.
                  Apply at{' '}
                  <a
                    href="https://adsense.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    style={{ color: 'rgba(250,247,242,0.7)' }}
                  >
                    adsense.google.com
                  </a>
                </p>
              </div>
              {/* ─────────────────────────────────────────────────────── */}
            </div>

            {/* Progress bar */}
            <div style={{ height: 4, backgroundColor: 'rgba(26,26,46,0.15)' }}>
              <div
                style={{
                  height: '100%',
                  backgroundColor: '#C2410C',
                  width: `${((AD_DURATION - countdown) / AD_DURATION) * 100}%`,
                  transition: 'width 1s linear',
                }}
              />
            </div>

            {/* Countdown + skip */}
            <div className="flex items-center justify-between px-4 py-3">
              <p
                className="text-xs"
                style={{ ...bodyFontStyle, color: '#6B6B7E' }}
              >
                {countdown > 0 ? `${countdown}s remaining` : 'Almost done…'}
              </p>
              {canSkip ? (
                <button
                  onClick={() => { setPhase('done'); onComplete?.(); }}
                  className="text-xs px-3 py-1.5 transition-transform hover:scale-105"
                  style={{ ...bodyFontStyle, color: '#1A1A2E', border: '1px solid #1A1A2E', fontWeight: 600 }}
                >
                  Skip ad →
                </button>
              ) : (
                <p className="text-xs" style={{ ...bodyFontStyle, color: '#9B9BAE' }}>
                  Skip in {5 - (AD_DURATION - countdown)}s
                </p>
              )}
            </div>
          </div>
        )}

        {/* Done phase */}
        {phase === 'done' && (
          <div className="p-8 text-center">
            <div
              className="inline-flex items-center justify-center mb-5"
              style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.12)' }}
            >
              <Heart size={28} style={{ color: '#22c55e' }} />
            </div>

            <h3
              className="mb-2 leading-tight"
              style={{ ...fontStyle, color: '#1A1A2E', fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.02em' }}
            >
              Thank you!
            </h3>
            <p
              className="text-sm mb-6 leading-relaxed"
              style={{ ...bodyFontStyle, color: '#6B6B7E' }}
            >
              Your support keeps Daily Wiki free and ad-light for everyone. 
              You can also support directly:
            </p>

            <a
              href="https://buymeacoffee.com/aswinsenthilkumar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm px-4 py-2 mb-4 transition-transform hover:scale-105"
              style={{ ...bodyFontStyle, color: '#1A1A2E', border: '1.5px solid #1A1A2E', fontWeight: 600 }}
            >
              ☕ Buy me a coffee
              <ExternalLink size={13} />
            </a>

            <button
              onClick={onClose}
              className="block w-full py-3 mt-2 transition-transform hover:scale-[1.02]"
              style={{ ...bodyFontStyle, backgroundColor: '#1A1A2E', color: '#FAF7F2', fontWeight: 600 }}
            >
              Back to reading
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
