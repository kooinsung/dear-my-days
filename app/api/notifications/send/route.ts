import { type NextRequest, NextResponse } from 'next/server'
import { sendFcmToDevices } from '@/libs/fcm/send'
import { supabaseAdmin } from '@/libs/supabase/admin'
import { createSupabaseServer } from '@/libs/supabase/server'
import { handleApiError, successResponse } from '@/libs/utils/errors'

/**
 * 푸시 알림 발송 (FCM HTTP v1 API)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const admin = supabaseAdmin()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const body = await req.json()
    const { userId, title, bodyText, data } = body

    if (!userId || !title || !bodyText) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      )
    }

    // 유저의 device tokens 조회
    const { data: tokens, error: tokensError } = await admin
      .from('device_tokens')
      .select('token, platform')
      .eq('user_id', userId)

    if (tokensError || !tokens || tokens.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No devices found' },
        { status: 404 },
      )
    }

    // FCM 발송
    const results = await sendFcmToDevices({
      tokens,
      title,
      body: bodyText,
      data,
    })

    return successResponse({
      sent: results.filter((r) => r.success).length,
      total: results.length,
      results,
    })
  } catch (error) {
    return await handleApiError(error)
  }
}
