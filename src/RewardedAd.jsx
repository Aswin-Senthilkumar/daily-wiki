import { useState, useEffect, useRef } from 'react';
import { X, Play, Heart, ExternalLink } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// RewardedAd — "Support by watching an ad"
//
// TO ENABLE REAL REWARDED ADS:
//  1. In AdSense dashboard: Ads → By ad unit → Rewarded ads → Create
//  2. Copy the data-ad-slot value
//  3. Replace REWARDED_SLOT_ID below with that value
//  4. AdSense will serve a real rewarded ad and fire the reward callback
// ─────────────────────────────────────────────────────────────────────────────

const PUBLISHER_ID   = 'ca-pub-6239569520497260';
const REWARDED_SLOT_ID = null; // ← Paste your rewarded ad slot ID here when ready

const AD_DURATION = 15; // seconds for fallback countdown

export default function RewardedAd({ onClose, onComplete, fontStyle, bodyFontStyle }) {
  const [phase, setPhase]         = useState('intro');
  const [countdown, setCountdown] = useState(AD_DURATION);
  const [canSkip, setCanSkip]     = useState(false);
  const adContainerRef            = useRef(null);
  const adPushed                  = useRef(false);

  // Load real AdSense rewarded ad if slot ID is configured
  useEffect(() => {
    if (phase !== 'watching') return;
    if (!REWARDED_SLOT_ID) return;
    if (adPushed.current) return;
    adPushed.current = true;

    try {
      const adsbygoogle = window.adsbygoogle || [];
      adsbygoogle.push({
        googletag: {
          cmd: [],
        },
      });
      // Rewarded ad API
      (window.adsbygoogle = adsbygoogle).push({
        params: {
          google_ad_client: PUBLISHER_ID,
          google_ad_slot:   REWARDED_SLOT_ID,
        },
        callbacks: {
          reward: () => {
            // User earned the reward
            setPhase('done');
            onComplete?.();
          },
          adClosed: () => {
            setPhase('done');
            onComplete?.();
          },
        },
      });
    } catch (e) {
      console.warn('AdSense rewarded failed, falling back to countdown:', e);
    }
  }, [phase, onComplete]);

  // Fallback countdown timer (used when no real ad slot is configured)
  useEffect(() => {
    if (phase !== 'watching') return;
    if (REWARDED_SLOT_ID) return; // real ad handles its own timer
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

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

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

        {/* ── Intro ──────────────────────────────────────────────── */}
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
              Daily Wiki is free. Watching a short ad helps keep it that way.
            </p>
            <p
              className="text-xs mb-8"
              style={{ ...bodyFontStyle, color: '#9B9BAE' }}
            >
              {AD_DURATION} seconds · No sign-up required
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
              className="w-full py-2.5 text-sm hover:opacity-60"
              style={{ ...bodyFontStyle, color: '#9B9BAE' }}
            >
              No thanks
            </button>
          </div>
        )}

        {/* ── Watching ───────────────────────────────────────────── */}
        {phase === 'watching' && (
          <div className="relative">

            {/* Ad container */}
            <div
              ref={adContainerRef}
              style={{ minHeight: 280, backgroundColor: '#1A1A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: 24 }}
            >
              {REWARDED_SLOT_ID && !isLocalhost ? (
                // Real AdSense rewarded ad unit
                <ins
                  className="adsbygoogle"
                  style={{ display: 'block', width: '100%' }}
                  data-ad-client={PUBLISHER_ID}
                  data-ad-slot={REWARDED_SLOT_ID}
                  data-ad-format="rewarded"
                />
              ) : (
                // Placeholder until real slot ID is added or on localhost
                <div className="text-center">
                  <p
                    className="text-xs tracking-widest uppercase mb-4"
                    style={{ ...bodyFontStyle, color: 'rgba(250,247,242,0.4)' }}
                  >
                    Advertisement
                  </p>
                  <p
                    style={{ ...fontStyle, color: '#FAF7F2', fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}
                  >
                    {isLocalhost
                      ? 'Ad preview (localhost — real ads show on live site)'
                      : 'Ad loading…'}
                  </p>
                  {!REWARDED_SLOT_ID && (
                    <p style={{ ...bodyFontStyle, color: 'rgba(250,247,242,0.5)', fontSize: '0.75rem' }}>
                      Add your rewarded ad slot ID to RewardedAd.jsx to show real ads here.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div style={{ height: 4, backgroundColor: 'rgba(26,26,46,0.1)' }}>
              <div
                style={{
                  height: '100%',
                  backgroundColor: '#C2410C',
                  width: REWARDED_SLOT_ID
                    ? '100%'
                    : `${((AD_DURATION - countdown) / AD_DURATION) * 100}%`,
                  transition: 'width 1s linear',
                }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-xs" style={{ ...bodyFontStyle, color: '#6B6B7E' }}>
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
                  Skip in {Math.max(0, 5 - (AD_DURATION - countdown))}s
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Done ───────────────────────────────────────────────── */}
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
              Your support keeps Daily Wiki free for everyone. You can also support directly:
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
