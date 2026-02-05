import { type NextRequest, NextResponse } from 'next/server'
import {
  generateEmailVerificationToken,
  sendEmailVerificationMail,
} from '@/libs/auth/email-verification'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      email?: string
      password?: string
    }

    const email = body.email?.trim()
    const password = body.password

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력하세요' },
        { status: 400 },
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: '서버 설정 오류(NEXT_PUBLIC_SUPABASE_URL)' },
        { status: 500 },
      )
    }

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: '서버 설정 오류(SUPABASE_SERVICE_ROLE_KEY)' },
        { status: 500 },
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    // 1) Admin API로 유저 생성 (Supabase confirmation email 발송을 피함)
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
      })

    // 유저 열거 방지: 구체적 에러 노출 최소화
    if (createErr || !created.user) {
      return NextResponse.json(
        { error: '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 400 },
      )
    }

    // 2) 우리가 발급한 verification token을 user metadata에 저장
    const token = generateEmailVerificationToken()

    const now = Date.now()
    const expiresAt = now + 1000 * 60 * 30 // 30분

    const { error: updateErr } = await admin.auth.admin.updateUserById(
      created.user.id,
      {
        user_metadata: {
          email_verify_token: token,
          email_verify_expires_at: expiresAt,
        },
      },
    )

    if (updateErr) {
      return NextResponse.json(
        { error: '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 400 },
      )
    }

    // 3) Resend로 인증 메일 발송
    const origin = req.nextUrl.origin
    const baseUrl = process.env.NEXT_PUBLIC_WEB_BASE_URL || origin

    const verificationUrl = new URL(`${baseUrl}/auth/verify-email/confirm`)
    verificationUrl.searchParams.set('uid', created.user.id)
    verificationUrl.searchParams.set('token', token)

    const mail = await sendEmailVerificationMail({
      to: email,
      verificationUrl: verificationUrl.toString(),
    })

    if (!mail.success) {
      return NextResponse.json(
        {
          error: `인증 메일 발송에 실패했습니다. (${mail.error})`,
        },
        { status: 500 },
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
