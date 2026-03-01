import * as Sentry from '@sentry/nextjs'
import { type NextRequest, NextResponse } from 'next/server'
import { sendSlackErrorNotification } from '@/libs/slack/client'
import { formatServerErrorMessage } from '@/libs/slack/formatters'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, url, source } = body

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }

    Sentry.addBreadcrumb({
      category: 'error-report',
      message: `Received: [${source}] ${message}`,
      data: { url, source },
      level: 'info',
    })

    const slackPayload = formatServerErrorMessage({
      error: `[${source || 'client'}] ${message}`,
      url,
      statusCode: 0,
    })

    const result = await sendSlackErrorNotification(slackPayload)

    if (!result.ok) {
      Sentry.captureMessage('[error-report] Slack notification failed', {
        level: 'error',
        extra: {
          slackStatus: result.status,
          slackError: result.error,
          originalMessage: message,
          source,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    Sentry.captureException(error, {
      extra: { context: 'error-report' },
    })
    return NextResponse.json(
      { error: 'Failed to report error' },
      { status: 500 },
    )
  }
}
