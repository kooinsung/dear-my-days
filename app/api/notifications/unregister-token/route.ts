import { type NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/libs/supabase/admin'
import { createSupabaseServer } from '@/libs/supabase/server'
import { handleApiError, successResponse } from '@/libs/utils/errors'

/**
 * 푸시 알림 토큰 해제
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const admin = supabaseAdmin()

    // 현재 사용자 확인
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
    const { platform } = body

    // 입력 검증
    if (!platform) {
      return NextResponse.json(
        { success: false, error: 'Missing platform' },
        { status: 400 },
      )
    }

    // 토큰 삭제
    const { error: deleteError } = await admin
      .from('device_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('platform', platform)

    if (deleteError) {
      console.error('Failed to delete token:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to unregister token' },
        { status: 500 },
      )
    }

    return successResponse({ unregistered: true })
  } catch (error) {
    return handleApiError(error)
  }
}
