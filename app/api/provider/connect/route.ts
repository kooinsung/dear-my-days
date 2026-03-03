import { type NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/libs/supabase/admin'
import type { AuthProvider } from '@/libs/supabase/database.types'
import { createSupabaseServer } from '@/libs/supabase/server'
import { handleApiError } from '@/libs/utils/errors'

/**
 * Provider 연결 API
 * - 로그인된 사용자만 가능
 * - provider_user_id는 provider 고유 ID
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const admin = supabaseAdmin()

    // 1. 현재 로그인 유저 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { provider, providerUserId } = body as {
      provider: AuthProvider
      providerUserId: string
    }

    // 2. 이미 다른 계정에 연결된 provider인지 확인
    const { data: existing } = await admin
      .from('user_providers')
      .select('user_id')
      .eq('provider', provider)
      .eq('provider_user_id', providerUserId)
      .single()

    if (existing && existing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'This provider is already linked to another account' },
        { status: 409 },
      )
    }

    // 3. provider 연결
    const { error: insertError } = await admin.from('user_providers').insert({
      user_id: user.id,
      provider,
      provider_user_id: providerUserId,
    })

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to link provider' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return await handleApiError(error)
  }
}
