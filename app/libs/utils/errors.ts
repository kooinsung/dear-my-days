import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { sendSlackErrorNotification } from '@/libs/slack/client'
import { formatServerErrorMessage } from '@/libs/slack/formatters'

// 커스텀 애플리케이션 에러
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

type ErrorContext = {
  url?: string
  method?: string
}

// 통합 에러 핸들러
export async function handleApiError(
  error: unknown,
  context?: ErrorContext,
): Promise<NextResponse> {
  // Zod 검증 에러 (클라이언트 입력 에러 — Sentry/Slack 불필요)
  if (error instanceof ZodError) {
    const firstError = error.issues[0]
    return NextResponse.json(
      { error: firstError?.message || '입력값이 올바르지 않습니다' },
      { status: 400 },
    )
  }

  // 커스텀 앱 에러
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      Sentry.captureException(error)
      await sendSlackErrorNotification(
        formatServerErrorMessage({
          error: error.message,
          url: context?.url,
          method: context?.method,
          statusCode: error.statusCode,
        }),
      )
    }
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode },
    )
  }

  // 일반 에러 (500)
  const message =
    error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'

  Sentry.captureException(error)
  await sendSlackErrorNotification(
    formatServerErrorMessage({
      error: message,
      url: context?.url,
      method: context?.method,
      statusCode: 500,
    }),
  )

  return NextResponse.json({ error: message }, { status: 500 })
}

// 성공 응답 헬퍼
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}
