import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { createNaverMagicLink, findOrCreateNaverUser } from '@/libs/auth/naver'
import { exchangeNaverToken, getNaverUser } from '@/libs/naver/oauth'
import { createSupabaseServer } from '@/libs/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const receivedState = searchParams.get('state')
  const cookieStore = await cookies()
  const storedState = cookieStore.get('naver_state')?.value

  // State 파라미터 검증
  if (!code || !receivedState || !storedState) {
    const params = new URLSearchParams({
      error: encodeURIComponent('네이버 로그인 정보가 올바르지 않습니다.'),
    })
    return NextResponse.redirect(`${origin}/login?${params.toString()}`)
  }

  // CSRF 방지: state 값 일치 확인
  if (receivedState !== storedState) {
    const params = new URLSearchParams({
      error: encodeURIComponent(
        '보안 검증에 실패했습니다. 다시 시도해 주세요.',
      ),
    })
    return NextResponse.redirect(`${origin}/login?${params.toString()}`)
  }

  // 사용 완료된 state 삭제
  cookieStore.delete('naver_state')

  try {
    const { access_token } = await exchangeNaverToken(code, receivedState)
    const naverUser = await getNaverUser(access_token)

    await findOrCreateNaverUser(naverUser)
    const token = await createNaverMagicLink(
      naverUser.email ?? `naver_${naverUser.id}@no-email.local`,
    )

    const supabase = await createSupabaseServer()
    await supabase.auth.verifyOtp({
      type: 'magiclink',
      token_hash: token,
    })

    return NextResponse.redirect(`${origin}/`)
  } catch (error) {
    console.error('Naver OAuth error:', error)
    const params = new URLSearchParams({
      error: encodeURIComponent(
        '네이버 로그인에 실패했습니다. 다시 시도해 주세요.',
      ),
    })
    return NextResponse.redirect(`${origin}/login?${params.toString()}`)
  }
}
