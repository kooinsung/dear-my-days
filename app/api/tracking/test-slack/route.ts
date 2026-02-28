import { NextResponse } from 'next/server'
import { env } from '@/libs/config/env'
import { sendSlackNotification } from '@/libs/slack/client'
import { formatSignupMessage } from '@/libs/slack/formatters'

export async function GET() {
  const url = env.SLACK_WEBHOOK_URL

  if (!url) {
    return NextResponse.json({
      error: 'SLACK_WEBHOOK_URL is not set',
      hasValue: false,
    })
  }

  await sendSlackNotification(formatSignupMessage('test@dearmydays.com'))

  return NextResponse.json({
    success: true,
    hasValue: true,
    urlPrefix: url.slice(0, 30),
  })
}
