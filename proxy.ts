import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { buildLoginRedirect, isPublicPath } from '@/libs/auth/route-policy'
import { updateSession } from '@/libs/supabase/proxy'

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)

  const pathname = request.nextUrl.pathname

  // OAuth code가 루트에 도착한 경우 /auth/callback으로 포워딩
  if (pathname === '/' && request.nextUrl.searchParams.has('code')) {
    const callbackUrl = new URL('/auth/callback', request.nextUrl.origin)
    callbackUrl.search = request.nextUrl.search
    return NextResponse.redirect(callbackUrl)
  }

  if (isPublicPath(pathname)) {
    return response
  }

  if (!user) {
    return NextResponse.redirect(
      buildLoginRedirect(pathname, request.nextUrl.origin),
    )
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
