'use client'

import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { generateNaverAuthUrl } from '@/libs/naver/oauth'
import { createSupabaseBrowser } from '@/libs/supabase/browser'
import { login, logout } from './actions'

interface LoginFormProps {
  initialUser: User | null
}

export default function LoginForm({ initialUser }: LoginFormProps) {
  const supabase = createSupabaseBrowser()
  const router = useRouter()

  const [user, setUser] = useState<User | null>(initialUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  // 세션 변화 감지
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => data.subscription.unsubscribe()
  }, [supabase])

  // ✅ Email 로그인 (Server Action 직접 호출)
  const handleEmailLogin = () => {
    startTransition(async () => {
      const result = await login(email, password)

      if (result?.error) {
        setMessage(result.error)
        return
      }

      router.push('/')
    })
  }

  // OAuth
  const oauthLogin = async (provider: 'google' | 'kakao') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    })
  }

  const naverLogin = () => {
    const state = crypto.randomUUID()
    sessionStorage.setItem('naver_state', state)
    window.location.href = generateNaverAuthUrl(state)
  }

  const handleLogout = () => {
    startTransition(async () => {
      await logout()
      setUser(null)
      router.push('/login')
    })
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>로그인</h1>

      {user ? (
        <>
          <p>로그인된 사용자: {user.email ?? user.id}</p>
          <button type="button" onClick={handleLogout}>
            로그아웃
          </button>
        </>
      ) : (
        <>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
          />

          <button type="button" onClick={handleEmailLogin} disabled={isPending}>
            Email 로그인
          </button>

          <hr />

          <button type="button" onClick={() => oauthLogin('google')}>
            Google
          </button>
          <button type="button" onClick={() => oauthLogin('kakao')}>
            Kakao
          </button>
          <button type="button" onClick={naverLogin}>
            Naver
          </button>
        </>
      )}

      {message && <p>{message}</p>}
    </div>
  )
}
