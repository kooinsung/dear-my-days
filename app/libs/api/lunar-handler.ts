import type { NextRequest } from 'next/server'
import { handleApiError, successResponse } from '@/libs/utils/errors'
import { lunarQuerySchema } from '@/libs/validation/schemas'

type LunarApiHandler<T> = (
  year: number,
  month: number,
  day: number,
) => Promise<T>

// 공통 패턴 추출: 쿼리 파라미터 검증 + 에러 처리
export function createLunarApiRoute<T>(handler: LunarApiHandler<T>) {
  return async function GET(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url)
      const params = lunarQuerySchema.parse({
        year: searchParams.get('year'),
        month: searchParams.get('month'),
        day: searchParams.get('day'),
      })

      const result = await handler(params.year, params.month, params.day)
      return successResponse(result)
    } catch (error) {
      return handleApiError(error)
    }
  }
}
