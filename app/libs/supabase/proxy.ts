import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  // 1. 초기 응답 객체 생성 (요청 헤더 유지)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // 2. 쿠키 업데이트 로직
          // 요청(Request) 객체에 쿠키 설정
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          // 응답(Response) 객체 재성성 (변경된 요청 쿠키 반영)
          response = NextResponse.next({
            request,
          })

          // 응답(Response) 객체에 쿠키 설정
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  // 3. 세션 확인 (JWT 로컬 디코딩, 네트워크 호출 없음)
  // 만료된 토큰은 자동 갱신되고, setAll을 트리거하여 새 쿠키를 응답에 굽습니다.
  // 민감한 작업은 서버 컴포넌트/API 라우트에서 getUser()로 별도 검증
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return { response, user: session?.user ?? null }
}
