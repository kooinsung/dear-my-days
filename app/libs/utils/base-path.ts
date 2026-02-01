import { withBasePath } from '@/libs/urls/base-path'

/**
 * Next.js basePath가 설정된 경우에도 안전하게 API URL을 만들기 위한 유틸.
 *
 * - 브라우저 환경: 현재 origin + basePath 를 사용해 `/api/...`를 basePath 하위로 보냅니다.
 * - 서버/테스트 환경: 상대경로로 basePath가 포함된 path를 반환합니다.
 */
export function getApiUrl(pathname: string): string {
  const pathWithBase = withBasePath(pathname)

  if (typeof window === 'undefined') {
    return pathWithBase
  }

  return new URL(pathWithBase, window.location.origin).toString()
}
