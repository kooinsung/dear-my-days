import { type NextRequest, NextResponse } from 'next/server'
import { createNaverMagicLink, findOrCreateNaverUser } from '@/libs/auth/naver'
import { exchangeNaverToken, getNaverUser } from '@/libs/naver/oauth'
import { createSupabaseServer } from '@/libs/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/login?error=naver`)
  }

  const { access_token } = await exchangeNaverToken(code, state)
  const naverUser = await getNaverUser(access_token)

  const { userId } = await findOrCreateNaverUser(naverUser)
  const token = await createNaverMagicLink(
    naverUser.email ?? `naver_${naverUser.id}@no-email.local`,
  )

  const supabase = await createSupabaseServer()
  await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: token,
  })

  return NextResponse.redirect(`${origin}/`)
}
