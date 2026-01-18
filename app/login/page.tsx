import { createSupabaseServer } from '@/libs/supabase/server'
import LoginForm from './login-form'

export default async function LoginPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // SSR 시점에서 로그인 상태 조회 후 클라이언트 컴포넌트에 전달
  return <LoginForm initialUser={session?.user || null} />
}
