/**
 * 미들웨어에서 인증을 적용할 보호/공개 경로 정책
 */

const PUBLIC_PATHS = [
  '/login',
  '/auth/callback',
  '/auth/provider',
  '/auth/verify-email',
  '/auth/reset-password',
  '/api/health-check',
] as const

const PUBLIC_PREFIXES = ['/_next', '/favicon.ico', '/api'] as const

const PUBLIC_FILE_EXT = /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/i

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_FILE_EXT.test(pathname)) {
    return true
  }

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return true
  }

  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

export function buildLoginRedirect(pathname: string, origin: string): string {
  const url = new URL(`${origin}/login`)

  url.searchParams.set('returnUrl', pathname)

  return url.toString()
}
