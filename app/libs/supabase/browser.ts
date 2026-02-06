import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/libs/config/env'

export function createSupabaseBrowser() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  )
}
