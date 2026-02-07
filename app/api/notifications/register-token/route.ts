import { type NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/libs/supabase/admin'
import { createSupabaseServer } from '@/libs/supabase/server'
import { handleApiError, successResponse } from '@/libs/utils/errors'

/**
 * 푸시 알림 토큰 등록
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
    const { platform, token } = body

    // 입력 검증
    if (!platform || !token) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 },
      )
    }

    if (platform !== 'ios' && platform !== 'android') {
      return NextResponse.json(
        { success: false, error: 'Invalid platform' },
        { status: 400 },
      )
    }

    // 기존 토큰 확인 (같은 사용자, 같은 플랫폼)
    const { data: existing } = await admin
      .from('device_tokens')
      .select('id, token')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .single()

    if (existing) {
      // 토큰이 변경된 경우에만 업데이트
      if (existing.token !== token) {
        const { error: updateError } = await admin
          .from('device_tokens')
          .update({
            token,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('Failed to update token:', updateError)
          return NextResponse.json(
            { success: false, error: 'Failed to update token' },
            { status: 500 },
          )
        }
      }
    } else {
      // 새 토큰 등록
      const { error: insertError } = await admin.from('device_tokens').insert({
        user_id: user.id,
        platform,
        token,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error('Failed to insert token:', insertError)
        return NextResponse.json(
          { success: false, error: 'Failed to register token' },
          { status: 500 },
        )
      }
    }

    return successResponse({ registered: true })
  } catch (error) {
    return handleApiError(error)
  }
}
