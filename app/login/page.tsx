import { Suspense } from 'react'
import { LoginPageClient } from './login-page-client'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageClient />
    </Suspense>
  )
}
