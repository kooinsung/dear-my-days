import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

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

// 통합 에러 핸들러
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  // Zod 검증 에러
  if (error instanceof ZodError) {
    const firstError = error.issues[0]
    return NextResponse.json(
      { error: firstError?.message || '입력값이 올바르지 않습니다' },
      { status: 400 },
    )
  }

  // 커스텀 앱 에러
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode },
    )
  }

  // 일반 에러
  const message =
    error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
  return NextResponse.json({ error: message }, { status: 500 })
}

// 성공 응답 헬퍼
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}
