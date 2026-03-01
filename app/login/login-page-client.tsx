'use client'

import type { User } from '@supabase/supabase-js'
import LoginForm from './login-form'

interface LoginPageClientProps {
  initialUser: User | null
}

export function LoginPageClient({ initialUser }: LoginPageClientProps) {
  return <LoginForm initialUser={initialUser} />
}
