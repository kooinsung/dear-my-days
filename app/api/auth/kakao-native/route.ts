import { type NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/libs/supabase/admin'
import { handleApiError } from '@/libs/utils/errors'

/**
 * 네이티브 Kakao 로그인 처리
 * 1. Kakao accessToken으로 사용자 정보 조회
 * 2. Supabase 사용자 생성/조회
 * 3. Magic link 토큰 생성 → 클라이언트에서 세션 생성
 */
export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json()

    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json(
        { error: 'accessToken이 필요합니다.' },
        { status: 400 },
      )
    }

    // 1. Kakao API로 사용자 정보 조회
    const kakaoResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!kakaoResponse.ok) {
      return NextResponse.json(
        { error: 'Kakao 토큰 검증에 실패했습니다.' },
        { status: 401 },
      )
    }

    const kakaoUser = await kakaoResponse.json()
    const email = kakaoUser.kakao_account?.email

    if (!email) {
      return NextResponse.json(
        {
          error:
            '카카오 계정에 이메일 정보가 없습니다. 이메일 제공에 동의해주세요.',
        },
        { status: 400 },
      )
    }

    // 2. Supabase 사용자 조회/생성
    const admin = supabaseAdmin()

    const { data: existingUsers } = await admin.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find((u) => u.email === email)

    if (!existingUser) {
      const { error: createError } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          provider: 'kakao',
          kakao_id: kakaoUser.id,
          name: kakaoUser.kakao_account?.profile?.nickname,
          avatar_url: kakaoUser.kakao_account?.profile?.profile_image_url,
        },
      })

      if (createError) {
        return NextResponse.json(
          { error: '사용자 생성에 실패했습니다.' },
          { status: 500 },
        )
      }
    }

    // 3. Magic link 생성 → token_hash 반환
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
      })

    if (linkError || !linkData) {
      return NextResponse.json(
        { error: '인증 링크 생성에 실패했습니다.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      tokenHash: linkData.properties.hashed_token,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
