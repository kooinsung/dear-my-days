import { NextResponse } from 'next/server'
import { findLunarDateRange } from '@/libs/kasi/find-special-lunar'

export async function GET(req: Request) {
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
    return NextResponse.json(
      {
        error:
          'lunarMonth, lunarDay, fromYear, toYear query params are required',
      },
      { status: 400 },
    )
  }

  try {
    const result = await findLunarDateRange(
      lunarMonth,
      lunarDay,
      fromYear,
      toYear,
    )
    return NextResponse.json(result)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
