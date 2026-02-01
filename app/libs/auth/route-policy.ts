import { getAppBasePath } from '@/libs/urls/base-path'

/**
 * 미들웨어에서 인증을 적용할 보호/공개 경로 정책
 *
 * - next.config.ts의 basePath(BASE_PATH)를 사용하므로, 실제 요청 pathname은 항상 basePath로 시작합니다.
 */

export function getBasePath(): string {
  return getAppBasePath()
}

const PUBLIC_PATHS = [
  '/login',
  '/auth/callback',
  '/auth/provider',
  '/api/health-check',
] as const

const PUBLIC_PREFIXES = ['/_next', '/favicon.ico'] as const

const PUBLIC_FILE_EXT = /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/i

export function stripBasePath(pathname: string): string {
  const base = getBasePath()
  if (pathname.startsWith(base)) {
    const stripped = pathname.slice(base.length)
    return stripped.length ? stripped : '/'
  }
  return pathname
}

export function isPublicPath(pathnameWithBase: string): boolean {
  const pathname = stripBasePath(pathnameWithBase)

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

export function buildLoginRedirect(
  pathnameWithBase: string,
  origin: string,
): string {
  const base = getBasePath()
  const pathname = stripBasePath(pathnameWithBase)

  const url = new URL(`${origin}${base}/login`)

  // 홈으로 돌아가는 경우는 next 없이도 동일하므로 파라미터를 생략
  if (pathname !== '/') {
    // 로그인 후 원래 페이지로 돌아가기 위해 next 파라미터를 basePath 없는 내부 경로로 유지
    url.searchParams.set('next', pathname)
  }

  return url.toString()
}
