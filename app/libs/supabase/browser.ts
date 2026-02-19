import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/libs/config/env'

export function createSupabaseBrowser() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        get(name) {
          // 브라우저 쿠키 읽기
          const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
          return cookie ? decodeURIComponent(cookie.split('=')[1]) : null
        },
        set(name, value, options) {
          // 브라우저 쿠키 쓰기
          let cookie = `${name}=${encodeURIComponent(value)}`

          if (options?.maxAge) {
            cookie += `; max-age=${options.maxAge}`
          }
          if (options?.path) {
            cookie += `; path=${options.path}`
          }
          if (options?.domain) {
            cookie += `; domain=${options.domain}`
          }
          if (options?.sameSite) {
            cookie += `; samesite=${options.sameSite}`
          }
          if (options?.secure) {
            cookie += '; secure'
          }

          // biome-ignore lint/suspicious/noDocumentCookie: Supabase SSR 쿠키 관리에 직접 할당 필요
          document.cookie = cookie
        },
        remove(name, options) {
          // 브라우저 쿠키 삭제
          this.set(name, '', { ...options, maxAge: 0 })
        },
      },
    },
  )
}
