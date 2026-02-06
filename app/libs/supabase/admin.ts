import 'server-only' // 브라우저에서 import 시 빌드 에러 발생
import { createClient } from '@supabase/supabase-js'
import { env } from '@/libs/config/env'

// 브라우저에서 사용 금지
export function supabaseAdmin() {
  // 추가 안전장치: 런타임 체크
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin can only be used on server')
  }

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}
