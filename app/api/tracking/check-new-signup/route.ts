import { NextResponse } from 'next/server'
import { sendSlackNotification } from '@/libs/slack/client'
import { formatSignupMessage } from '@/libs/slack/formatters'
import { supabaseAdmin } from '@/libs/supabase/admin'
import { createSupabaseServer } from '@/libs/supabase/server'

export async function POST() {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ notified: false })
    }

    // signup_notified 플래그로 중복 알림 방지
    if (user.user_metadata?.signup_notified) {
      return NextResponse.json({ notified: false })
    }

    const provider =
      user.app_metadata?.provider ?? user.app_metadata?.providers?.[0]

    await sendSlackNotification(
      formatSignupMessage(user.email ?? 'unknown', provider),
    )

    // 중복 방지 플래그 설정
    const admin = supabaseAdmin()
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, signup_notified: true },
    })

    return NextResponse.json({ notified: true })
  } catch {
    return NextResponse.json({ notified: false })
  }
}
