import 'server-only'

import { env } from '@/libs/config/env'

export async function sendSlackNotification(
  message: Record<string, unknown>,
): Promise<void> {
  const url = env.SLACK_WEBHOOK_URL
  if (!url) {
    return
  }

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
  } catch {
    // Slack 알림 실패가 앱에 영향 없도록 무시
  }
}

export async function sendSlackErrorNotification(
  message: Record<string, unknown>,
): Promise<void> {
  const url = env.SLACK_WEBHOOK_URL_ERRORS ?? env.SLACK_WEBHOOK_URL
  if (!url) {
    return
  }

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
  } catch {
    // Slack 알림 실패가 앱에 영향 없도록 무시
  }
}
