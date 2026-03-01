import 'server-only'

import { env } from '@/libs/config/env'

type SlackResult = { ok: true } | { ok: false; status: number; error: string }

export async function sendSlackNotification(
  message: Record<string, unknown>,
): Promise<SlackResult> {
  const url = env.SLACK_WEBHOOK_URL
  if (!url) {
    return { ok: false, status: 0, error: 'SLACK_WEBHOOK_URL not configured' }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: await response.text().catch(() => 'unknown'),
      }
    }
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function sendSlackErrorNotification(
  message: Record<string, unknown>,
): Promise<SlackResult> {
  const url = env.SLACK_WEBHOOK_URL_ERRORS ?? env.SLACK_WEBHOOK_URL
  if (!url) {
    return {
      ok: false,
      status: 0,
      error: 'SLACK_WEBHOOK_URL_ERRORS not configured',
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: await response.text().catch(() => 'unknown'),
      }
    }
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
