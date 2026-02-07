import { type NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/libs/supabase/admin'
import { createSupabaseServer } from '@/libs/supabase/server'
import { handleApiError, successResponse } from '@/libs/utils/errors'

/**
 * 푸시 알림 발송 (기본 구현)
 *
 * Firebase Cloud Messaging 설정이 필요합니다.
 * 실제 구현 시 firebase-admin SDK 사용
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const admin = supabaseAdmin()

    // 현재 사용자 확인 (관리자 권한 체크 등)
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

    // 입력 검증
    if (!userId || !title || !bodyText) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      )
    }

    // 1. 유저의 device tokens 조회
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

    // 2. FCM으로 푸시 발송 (Mock 구현)
    // TODO: Firebase Admin SDK 통합
    // 실제 구현 시:
    // - Firebase Admin SDK 초기화
    // - messaging().send() 사용
    // - iOS APNS, Android FCM 자동 처리

    const results = tokens.map((device) => {
      console.log(`Would send push to ${device.platform}: ${device.token}`)
      console.log(`Title: ${title}`)
      console.log(`Body: ${bodyText}`)
      console.log(`Data:`, data)

      // Mock 성공 응답
      return {
        token: device.token,
        platform: device.platform,
        success: true,
      }
    })

    // 3. 알림 로그 기록 (선택사항)
    // await admin.from('notification_logs').insert({
    //   user_id: userId,
    //   title,
    //   body: bodyText,
    //   sent_at: new Date().toISOString(),
    //   status: 'SUCCESS',
    // })

    return successResponse({
      sent: results.length,
      results,
      note: 'This is a mock implementation. Integrate Firebase Admin SDK for actual push notifications.',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
