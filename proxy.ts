import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { buildLoginRedirect, isPublicPath } from '@/libs/auth/route-policy'
import { updateSession } from '@/libs/supabase/proxy'

/**
 * Supabase 세션 유지 + 보호 경로 접근 제어
 *
 * - updateSession(request)에서 반드시 auth.getUser()를 호출해 세션 갱신이 안정적으로 동작하게 합니다.
 * - 보호 경로에서 미로그인일 경우 /login으로 리다이렉트합니다.
 */
export async function proxy(request: NextRequest) {
  // 1) 세션 갱신(쿠키 refresh)
  const response = await updateSession(request)

  // 2) 공개 경로는 통과
  if (isPublicPath(request.nextUrl.pathname)) {
    return response
  }

  // 3) 보호 경로는 로그인 여부 확인
  let authResponse = response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          authResponse = NextResponse.next({ request })

          cookiesToSet.forEach(({ name, value, options }) => {
            authResponse.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(
      buildLoginRedirect(request.nextUrl.pathname, request.nextUrl.origin),
    )
  }

  return authResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
