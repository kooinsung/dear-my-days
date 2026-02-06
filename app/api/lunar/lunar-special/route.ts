import { findLunarDateRange } from '@/libs/kasi/find-special-lunar'
import { handleApiError, successResponse } from '@/libs/utils/errors'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const lunarMonth = Number(searchParams.get('lunarMonth'))
    const lunarDay = Number(searchParams.get('lunarDay'))
    const fromYear = Number(searchParams.get('fromYear'))
    const toYear = Number(searchParams.get('toYear'))

    if (
      !Number.isFinite(lunarMonth) ||
      !Number.isFinite(lunarDay) ||
      !Number.isFinite(fromYear) ||
      !Number.isFinite(toYear)
    ) {
      throw new Error(
        'lunarMonth, lunarDay, fromYear, toYear query params are required',
      )
    }

    const result = await findLunarDateRange(
      lunarMonth,
      lunarDay,
      fromYear,
      toYear,
    )
    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}
