import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { buildLoginRedirect, isPublicPath } from '@/libs/auth/route-policy'
import { updateSession } from '@/libs/supabase/proxy'

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)

  const pathname = request.nextUrl.pathname

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
