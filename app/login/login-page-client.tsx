'use client'

import { useAuth } from '@/hooks/use-auth'
import LoginForm from './login-form'

export function LoginPageClient() {
  const { user } = useAuth()

  return <LoginForm initialUser={user} />
}
