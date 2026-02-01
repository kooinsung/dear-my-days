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

export function withBasePath(path: string): string {
  const base = getAppBasePath()
  if (!path.startsWith('/')) {
    return `${base}/${path}`
  }
  return `${base}${path}`
}
