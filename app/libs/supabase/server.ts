import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/libs/config/env'

export async function createSupabaseServer() {
  const cookieStore = await cookies()

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Component에서 쿠키를 설정할 수 없는 경우 무시
            // Server Action이나 Route Handler에서는 정상 동작
          }
        },
      },
    },
  )
}
