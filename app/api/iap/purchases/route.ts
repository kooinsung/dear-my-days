import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/libs/supabase/admin'
import { createSupabaseServer } from '@/libs/supabase/server'
import { handleApiError, successResponse } from '@/libs/utils/errors'

export async function GET() {
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

    const { data: purchases, error } = await admin
      .from('event_purchases')
      .select(
        'id, purchase_type, product_id, amount, currency, created_at, status, refunded_at',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: '구매 기록을 불러올 수 없습니다.' },
        { status: 500 },
      )
    }

    return successResponse(purchases ?? [])
  } catch (error) {
    return await handleApiError(error)
  }
}
