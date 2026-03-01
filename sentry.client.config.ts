import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  ignoreErrors: [
    'ResizeObserver loop',
    'ResizeObserver loop completed with undelivered notifications',
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    'AbortError',
    'The operation was aborted',
    'cancelled',
    'Non-Error promise rejection captured',
    /^TypeError: cancelled$/,
    /^TypeError: NetworkError/,
  ],

  beforeSend(event) {
    if (event.level === 'error' || event.level === 'fatal') {
      const message =
        event.exception?.values?.[0]?.type &&
        event.exception?.values?.[0]?.value
          ? `${event.exception.values[0].type}: ${event.exception.values[0].value}`
          : event.message || 'Unknown client error'

      fetch('/api/error-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          url: event.request?.url || window.location.href,
          source: 'sentry-client',
        }),
      }).catch(() => {})
    }
    return event
  },
})
