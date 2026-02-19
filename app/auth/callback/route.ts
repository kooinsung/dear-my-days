import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/libs/supabase/server'

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

  // 디버깅: 요청 URL 로깅
  console.log('🔍 [Callback] Request URL:', req.url)
  console.log('🔍 [Callback] Origin:', origin)

  // Supabase/Auth 링크는 상황에 따라 파라미터가 달라질 수 있음
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  console.log('🔍 [Callback] Params:', {
    code: `${code?.slice(0, 10)}...`,
    token_hash,
    type,
  })

  const supabase = await createSupabaseServer()

  // 1) OAuth(PKCE) / 일부 이메일 링크: code 교환
  if (code) {
    console.log('🔐 [Callback] Exchanging code for session...')
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('❌ [Callback] Exchange failed:', error)

      // 사용자 친화적 에러 메시지 매핑
      const friendlyErrors: Record<string, string> = {
        access_denied: '권한을 거부했습니다.',
        invalid_request: '잘못된 요청입니다.',
        server_error: '서버 오류가 발생했습니다.',
        temporarily_unavailable: '일시적으로 서비스를 사용할 수 없습니다.',
      }

      const anyErr = error as unknown as {
        code?: string
        name?: string
        message?: string
      }

      const errCode = anyErr.code ?? anyErr.name ?? ''
      const friendlyMessage =
        friendlyErrors[errCode] ||
        friendlyErrors[error.message] ||
        '로그인에 실패했습니다.'

      console.log('🔍 [Callback] Error details:', {
        code: errCode,
        message: error.message,
        friendly: friendlyMessage,
      })

      const params = new URLSearchParams({
        error: encodeURIComponent(friendlyMessage),
      })

      return NextResponse.redirect(`${origin}/login?${params.toString()}`)
    }

    console.log('✅ [Callback] Session created, redirecting to home...')
    console.log('🔍 [Callback] Redirect URL:', `${origin}/`)

    // OAuth 성공: 홈으로 리다이렉트
    return NextResponse.redirect(`${origin}/`)
  }

  // 2) 이메일 인증/매직링크/리커버리: token_hash + type 검증
  if (token_hash && type) {
    if (!isOtpType(type)) {
      const params = new URLSearchParams({
        error: encodeURIComponent('유효하지 않은 인증 유형입니다.'),
      })
      return NextResponse.redirect(`${origin}/login?${params.toString()}`)
    }

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (error) {
      // 사용자 친화적 에러 메시지
      const friendlyErrors: Record<string, string> = {
        otp_expired: '인증 링크가 만료되었습니다.',
        otp_disabled: '이메일 인증이 비활성화되었습니다.',
        invalid_otp: '유효하지 않은 인증 링크입니다.',
      }

      const anyErr = error as unknown as {
        code?: string
        name?: string
        message?: string
      }

      const errCode = anyErr.code ?? anyErr.name ?? ''
      const friendlyMessage =
        friendlyErrors[errCode] ||
        friendlyErrors[error.message] ||
        '이메일 인증에 실패했습니다.'

      const params = new URLSearchParams({
        error: encodeURIComponent(friendlyMessage),
      })

      return NextResponse.redirect(`${origin}/login?${params.toString()}`)
    }

    // 인증 성공: 홈으로 리다이렉트
    return NextResponse.redirect(`${origin}/`)
  }

  const params = new URLSearchParams({
    error: encodeURIComponent('인증 정보가 누락되었습니다.'),
  })
  return NextResponse.redirect(`${origin}/login?${params.toString()}`)
}
