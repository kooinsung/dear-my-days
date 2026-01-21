import { createSupabaseServer } from '@/libs/supabase/server'
import { LoginPageClient } from './login-page-client'

export default async function LoginPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <LoginPageClient initialUser={user} />
}
