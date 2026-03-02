import { type NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/libs/supabase/admin'
import { createSupabaseServer } from '@/libs/supabase/server'
import { handleApiError } from '@/libs/utils/errors'

/**
 * Provider 해제 API
 * - 최소 1개 provider는 남아 있어야 함
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const admin = supabaseAdmin()

    // 1. 로그인 유저 확인
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { provider } = body as {
      provider: 'naver' | 'google' | 'kakao' | 'email' | 'apple'
    }

    // 2. 현재 연결된 provider 개수 확인
    const { data: providers } = await admin
      .from('user_providers')
      .select('provider')
      .eq('user_id', user.id)

    if (!providers || providers.length <= 1) {
      return NextResponse.json(
        { error: 'At least one provider must remain' },
        { status: 400 },
      )
    }

    // 3. provider 해제
    const { error: deleteError } = await admin
      .from('user_providers')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', provider)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to unlink provider' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return await handleApiError(error)
  }
}
