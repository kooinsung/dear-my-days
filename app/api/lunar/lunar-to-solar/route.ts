import { NextResponse } from 'next/server'
import { lunarToSolar } from '@/libs/kasi/lunar-to-solar'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const year = Number(searchParams.get('year'))
  const month = Number(searchParams.get('month'))
  const day = Number(searchParams.get('day'))
  const isLeapMonth = searchParams.get('isLeapMonth') === 'true'

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return NextResponse.json(
      { error: 'year, month, day query params are required' },
      { status: 400 },
    )
  }

  try {
    const result = await lunarToSolar(year, month, day, isLeapMonth)
    return NextResponse.json(result)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
