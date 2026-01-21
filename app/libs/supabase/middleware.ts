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
          cookiesToSet.forEach(({ name, value, options }) => {
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

  // 3. 세션 갱신 (매우 중요)
  // 이 호출은 만료된 토큰을 갱신하고, setAll을 트리거하여 새 쿠키를 응답에 굽습니다.
  // user 정보를 반환하지만, 여기서는 변수에 할당하지 않아도 됩니다.
  await supabase.auth.getUser()

  return response
}
