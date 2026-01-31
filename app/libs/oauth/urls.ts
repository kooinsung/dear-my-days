/**
 * OAuth 관련 URL 생성기.
 *
 * 이 프로젝트는 Next.js basePath가 항상 설정되어 있다고 가정합니다.
 * (next.config.ts: basePath: process.env.BASE_PATH)
 */

function normalizeBasePath(basePath: string | undefined): string {
  if (!basePath) {
    throw new Error('BASE_PATH is required for OAuth URLs in this project.')
  }
  return basePath.startsWith('/') ? basePath : `/${basePath}`
}

export function getAppBasePath(): string {
  return normalizeBasePath(process.env.BASE_PATH || '/dear-days')
}

export function getOAuthCallbackPath(): string {
  return `${getAppBasePath()}/auth/callback`
}

export function getOAuthCallbackUrl(origin: string): string {
  return `${origin}${getOAuthCallbackPath()}`
}

export function withAppBasePath(path: string): string {
  const base = getAppBasePath()
  if (!path.startsWith('/')) {
    return `${base}/${path}`
  }
  return `${base}${path}`
}
