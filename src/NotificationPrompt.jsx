import { useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { markNotifsAsked } from './storage.js';

// ── Notification scheduling helpers ─────────────────────────────────
// These run in the main thread (not the service worker).
// We use the Notifications API directly — no server needed.

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  const result = await Notification.requestPermission();
  return result;
}

export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// Schedule a daily reminder notification via the service worker.
// The SW will fire it at the next 9am local time.
export async function scheduleDailyReminder(hour = 9) {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.active) return false;

    // Calculate ms until next occurrence of the given hour
    const now = new Date();
    const target = new Date();
    target.setHours(hour, 0, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);

    const msUntil = target.getTime() - now.getTime();

    // Post message to service worker with the schedule
    reg.active.postMessage({
      type: 'SCHEDULE_REMINDER',
      msUntil,
      hour,
    });

    return true;
  } catch (e) {
    console.warn('Could not schedule reminder:', e);
    return false;
  }
}

export async function cancelDailyReminder() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: 'CANCEL_REMINDER' });
  } catch {}
}

// ── Prompt UI ────────────────────────────────────────────────────────

export default function NotificationPrompt({ onDismiss, fontStyle, bodyFontStyle }) {
  const [loading, setLoading] = useState(false);

  const handleEnable = async () => {
    setLoading(true);
    markNotifsAsked();

    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      await scheduleDailyReminder(9);
    }
    setLoading(false);
    onDismiss(permission === 'granted');
  };

  const handleDismiss = () => {
    markNotifsAsked();
    onDismiss(false);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 p-4"
      style={{
        background: 'linear-gradient(to top, rgba(250,247,242,1) 80%, rgba(250,247,242,0))',
      }}
    >
      <div
        className="max-w-xl mx-auto p-5 flex items-start gap-4"
        style={{
          backgroundColor: '#1A1A2E',
          color: '#FAF7F2',
        }}
      >
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: 40,
            height: 40,
            backgroundColor: 'rgba(250,247,242,0.1)',
          }}
        >
          <Bell size={20} style={{ color: '#FAF7F2' }} />
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="font-semibold mb-1 leading-snug"
            style={{ ...fontStyle, color: '#FAF7F2', fontWeight: 700, fontSize: '1rem' }}
          >
            Never miss a day
          </p>
          <p
            className="text-sm leading-snug mb-4"
            style={{ ...bodyFontStyle, color: 'rgba(250,247,242,0.7)' }}
          >
            Get a gentle nudge each morning when today's article is ready.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 transition-transform hover:scale-105 disabled:opacity-60"
              style={{
                ...bodyFontStyle,
                backgroundColor: '#FAF7F2',
                color: '#1A1A2E',
                fontWeight: 600,
                fontSize: '0.8rem',
              }}
            >
              <Bell size={13} />
              {loading ? 'Setting up…' : 'Remind me daily'}
            </button>
            <button
              onClick={handleDismiss}
              className="flex items-center gap-2 px-4 py-2 transition-opacity hover:opacity-70"
              style={{
                ...bodyFontStyle,
                backgroundColor: 'transparent',
                color: 'rgba(250,247,242,0.6)',
                fontWeight: 500,
                fontSize: '0.8rem',
                border: '1px solid rgba(250,247,242,0.2)',
              }}
            >
              Not now
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 hover:opacity-60"
          style={{ color: 'rgba(250,247,242,0.5)', marginTop: 2 }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
