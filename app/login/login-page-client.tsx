'use client'

import { SsgoiTransition } from '@ssgoi/react'
import type { User } from '@supabase/supabase-js'
import LoginForm from './login-form'

interface LoginPageClientProps {
  initialUser: User | null
}

export function LoginPageClient({ initialUser }: LoginPageClientProps) {
  return (
    <SsgoiTransition id="/login">
      <LoginForm initialUser={initialUser} />
    </SsgoiTransition>
  )
}
