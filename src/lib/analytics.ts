import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

// Initialize PostHog
if (typeof window !== 'undefined' && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    persistence: 'localStorage',
    autocapture: false,
  });
}

// Simple in-memory cache for idempotency (1s window)
const trackedEventsCache = new Set<string>();

/**
 * Tracks an event to PostHog with automatic enrichment and idempotency check.
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window === 'undefined' || !POSTHOG_KEY) return;

  try {
    const eventSignature = `${eventName}:${JSON.stringify(properties || {})}`;
    
    // Check for duplicate events within a short timeframe
    if (trackedEventsCache.has(eventSignature)) {
      return;
    }

    const payload = {
      ...properties,
      timestamp: new Date().toISOString(),
    };

    posthog.capture(eventName, payload);

    // Maintain idempotency
    trackedEventsCache.add(eventSignature);
    setTimeout(() => {
      trackedEventsCache.delete(eventSignature);
    }, 1000);

  } catch (error) {
    // Fail silently to avoid breaking the UI
    console.error('[Analytics Error]', error);
  }
};
