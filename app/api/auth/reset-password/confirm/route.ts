import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      uid?: string
      token?: string
      password?: string
    }

    const uid = body.uid
    const token = body.token
    const password = body.password

    if (!uid || !token || !password) {
      return NextResponse.json(
        { error: '필수 값이 누락되었습니다.' },
        { status: 400 },
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 8자 이상이어야 합니다.' },
        { status: 400 },
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: '서버 설정 오류' }, { status: 500 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const { data, error } = await admin.auth.admin.getUserById(uid)
    if (error || !data.user) {
      return NextResponse.json(
        { error: '요청을 처리할 수 없습니다.' },
        { status: 400 },
      )
    }

    const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>
    const savedToken = meta.password_reset_token
    const expiresAt = meta.password_reset_expires_at

    if (typeof savedToken !== 'string' || typeof expiresAt !== 'number') {
      return NextResponse.json(
        { error: '요청을 처리할 수 없습니다.' },
        { status: 400 },
      )
    }

    if (savedToken !== token) {
      return NextResponse.json(
        { error: '요청을 처리할 수 없습니다.' },
        { status: 400 },
      )
    }

    if (Date.now() > expiresAt) {
      return NextResponse.json(
        { error: '링크가 만료되었습니다.' },
        { status: 400 },
      )
    }

    const { error: updateErr } = await admin.auth.admin.updateUserById(uid, {
      password,
      user_metadata: {
        ...meta,
        password_reset_token: null,
        password_reset_expires_at: null,
      },
    })

    if (updateErr) {
      return NextResponse.json(
        { error: '요청을 처리할 수 없습니다.' },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: '요청 처리에 실패했습니다.' },
      { status: 500 },
    )
  }
}
