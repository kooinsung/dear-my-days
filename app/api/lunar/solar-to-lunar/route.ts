import { NextResponse } from 'next/server'
import { solarToLunar } from '@/libs/kasi/solar-to-lunar'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const year = Number(searchParams.get('year'))
  const month = Number(searchParams.get('month'))
  const day = Number(searchParams.get('day'))

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
    const result = await solarToLunar(year, month, day)
    console.log('result', result)
    return NextResponse.json(result)
  } catch (e: unknown) {
    console.log('e', e)
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
