import { NextResponse } from 'next/server'
import { sendFcmToDevices } from '@/libs/fcm/send'
import { supabaseAdmin } from '@/libs/supabase/admin'
import { createSupabaseServer } from '@/libs/supabase/server'
import { handleApiError, successResponse } from '@/libs/utils/errors'

/**
 * 현재 로그인한 사용자에게 테스트 푸시 발송
 * POST /api/notifications/test-send
 */
export async function POST() {
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

    // 내 디바이스 토큰 조회
    const { data: tokens, error: tokensError } = await admin
      .from('device_tokens')
      .select('token, platform')
      .eq('user_id', user.id)

    if (tokensError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tokens' },
        { status: 500 },
      )
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '등록된 디바이스가 없습니다. 앱에서 푸시 권한을 허용해주세요.',
        },
        { status: 404 },
      )
    }

    // 테스트 푸시 발송
    const results = await sendFcmToDevices({
      tokens,
      title: 'Dear Days 테스트',
      body: '푸시 알림이 정상적으로 도착했습니다!',
      data: { type: 'test' },
    })

    return successResponse({
      sent: results.filter((r) => r.success).length,
      total: results.length,
      devices: tokens.map((t) => t.platform),
      results,
    })
  } catch (error) {
    return await handleApiError(error)
  }
}
