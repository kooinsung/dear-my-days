import { getAppBasePath, withBasePath } from '@/libs/urls/base-path'

export { getAppBasePath, withBasePath }

export function getOAuthCallbackPath(): string {
  return `${getAppBasePath()}/auth/callback`
}

export function getOAuthCallbackUrl(origin: string): string {
  return `${origin}${getOAuthCallbackPath()}`
}
