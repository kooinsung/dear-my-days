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

    await sendSlackErrorNotification(
      formatServerErrorMessage({
        error: `[${source || 'client'}] ${message}`,
        url,
        statusCode: 0,
      }),
    )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Failed to report error' },
      { status: 500 },
    )
  }
}
