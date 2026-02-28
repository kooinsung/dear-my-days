import 'server-only'

import { env } from '@/libs/config/env'

export function sendSlackNotification(message: Record<string, unknown>): void {
  const url = env.SLACK_WEBHOOK_URL
  if (!url) {
    return
  }

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  }).catch(() => {})
}

export function sendSlackErrorNotification(
  message: Record<string, unknown>,
): void {
  const url = env.SLACK_WEBHOOK_URL_ERRORS ?? env.SLACK_WEBHOOK_URL
  if (!url) {
    return
  }

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  }).catch(() => {})
}
