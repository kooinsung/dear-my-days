import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  buildLoginRedirect,
  isPublicPath,
  stripBasePath,
} from '@/libs/auth/route-policy'
import { updateSession } from '@/libs/supabase/proxy'

export async function proxy(request: NextRequest) {
  const response = await updateSession(request)

  const pathnameWithBase = request.nextUrl.pathname
  const pathname = stripBasePath(pathnameWithBase)

  // 공개 경로는 통과하되, 홈('/')은 항상 로그인 체크가 필요함
  if (isPublicPath(pathnameWithBase) && pathname !== '/') {
    return response
  }

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
      buildLoginRedirect(pathnameWithBase, request.nextUrl.origin),
    )
  }

  return authResponse
}

export const config = {
  matcher: [
    '/',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
