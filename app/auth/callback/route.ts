import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/libs/supabase/server'

function normalizeNext(next: string): string {
  // open redirect 방지: 내부 경로만 허용
  if (!next.startsWith('/')) {
    return '/'
  }
  if (next.startsWith('//')) {
    return '/'
  }
  return next
}

type OtpType = 'signup' | 'magiclink' | 'recovery' | 'invite' | 'email_change'

function isOtpType(value: string): value is OtpType {
  return (
    value === 'signup' ||
    value === 'magiclink' ||
    value === 'recovery' ||
    value === 'invite' ||
    value === 'email_change'
  )
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)

  const next = normalizeNext(searchParams.get('next') ?? '/')

  // Supabase/Auth 링크는 상황에 따라 파라미터가 달라질 수 있음
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const supabase = await createSupabaseServer()

  // 1) OAuth(PKCE) / 일부 이메일 링크: code 교환
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      const params = new URLSearchParams({
        error: 'oauth_exchange_failed',
      })

      const anyErr = error as unknown as {
        code?: string
        name?: string
      }

      const errCode = anyErr.code ?? anyErr.name
      if (errCode) {
        params.set('error_code', String(errCode))
      }

      return NextResponse.redirect(`${origin}/login?${params.toString()}`)
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  // 2) 이메일 인증/매직링크/리커버리: token_hash + type 검증
  if (token_hash && type) {
    if (!isOtpType(type)) {
      return NextResponse.redirect(`${origin}/login?error=invalid_otp_type`)
    }

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (error) {
      const params = new URLSearchParams({
        error: 'otp_verify_failed',
      })

      const anyErr = error as unknown as {
        code?: string
        name?: string
      }

      const errCode = anyErr.code ?? anyErr.name
      if (errCode) {
        params.set('error_code', String(errCode))
      }

      return NextResponse.redirect(`${origin}/login?${params.toString()}`)
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_params_missing`)
}
