import { useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// AdBanner — renders a Google AdSense display ad unit
//
// HOW TO GET YOUR SLOT ID:
//  1. Go to https://adsense.google.com
//  2. Ads → By ad unit → Display ads → Create new
//  3. Name it (e.g. "Article Banner") → Create
//  4. Copy the data-ad-slot value (e.g. "1234567890")
//  5. Set the SLOT_ID constant below
//
// Until you have a slot ID, AdSense auto-ads will still run from index.html.
// ─────────────────────────────────────────────────────────────────────────────

const PUBLISHER_ID = 'ca-pub-6239569520497260';
const SLOT_ID = 'AUTO'; // ← Replace with your ad slot ID from AdSense dashboard

export default function AdBanner({ format = 'auto', style = {} }) {
  const adRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    // Only push once per mount — avoid duplicate pushes in StrictMode
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn('AdSense push failed:', e);
    }
  }, []);

  // Don't render in development (localhost) — AdSense blocks non-approved domains
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return (
      <div
        style={{
          backgroundColor: 'rgba(26,26,46,0.04)',
          border: '1px dashed rgba(26,26,46,0.15)',
          padding: '12px',
          textAlign: 'center',
          fontSize: '0.7rem',
          color: '#9B9BAE',
          ...style,
        }}
      >
        Ad placeholder (hidden on localhost)
      </div>
    );
  }

  if (SLOT_ID === 'AUTO') {
    // Auto ads are handled by AdSense via the script in index.html.
    // Return null here — AdSense will place ads automatically.
    return null;
  }

  return (
    <div style={{ overflow: 'hidden', textAlign: 'center', ...style }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={SLOT_ID}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
