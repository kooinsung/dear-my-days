import { Suspense } from 'react'
import { createSupabaseServer } from '@/libs/supabase/server'
import { LoginPageClient } from './login-page-client'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <Suspense>
      <LoginPageClient initialUser={user} />
    </Suspense>
  )
}
