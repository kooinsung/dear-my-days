function normalizeBasePath(basePath: string | undefined): string {
  if (!basePath) {
    throw new Error('BASE_PATH is required in this project.')
  }
  return basePath.startsWith('/') ? basePath : `/${basePath}`
}

/**
 * 앱 전역 basePath.
 *
 * next.config.ts의 basePath(BASE_PATH)와 동일한 값을 사용해야 합니다.
 * 로컬 기본값은 '/dear-days' 입니다.
 */
export function getAppBasePath(): string {
  return normalizeBasePath(process.env.BASE_PATH || '/dear-days')
}

/**
 * 주어진 path에 basePath를 prefix로 붙여 반환합니다.
 */
export function withBasePath(path: string): string {
  const base = getAppBasePath()
  if (!path.startsWith('/')) {
    return `${base}/${path}`
  }
  return `${base}${path}`
}
