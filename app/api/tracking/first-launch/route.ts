import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { sendSlackNotification } from '@/libs/slack/client'
import { formatFirstLaunchMessage } from '@/libs/slack/formatters'
import { supabaseAdmin } from '@/libs/supabase/admin'

const firstLaunchSchema = z.object({
  deviceId: z.string().min(1),
  platform: z.enum(['ios', 'android']),
  deviceModel: z.string().optional(),
  osVersion: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = firstLaunchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ isNew: false }, { status: 400 })
    }

    const { deviceId, platform, deviceModel, osVersion } = parsed.data
    const admin = supabaseAdmin()

    const { data: existing } = await admin
      .from('app_launches')
      .select('id')
      .eq('device_id', deviceId)
      .single()

    if (existing) {
      return NextResponse.json({ isNew: false })
    }

    const { error: insertError } = await admin.from('app_launches').insert({
      device_id: deviceId,
      platform,
      device_model: deviceModel ?? null,
      os_version: osVersion ?? null,
    })

    // unique constraint 충돌(23505) 시 무시
    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ isNew: false })
      }
      return NextResponse.json({ isNew: false }, { status: 500 })
    }

    await sendSlackNotification(
      formatFirstLaunchMessage({ platform, deviceModel, osVersion }),
    )

    return NextResponse.json({ isNew: true })
  } catch {
    return NextResponse.json({ isNew: false }, { status: 500 })
  }
}
