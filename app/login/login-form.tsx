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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '32px',
            color: '#333',
          }}
        >
          Dear Days
        </h1>

        {user ? (
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                marginBottom: '16px',
                color: '#666',
                fontSize: '14px',
              }}
            >
              {user.email ?? user.id}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.6 : 1,
              }}
            >
              로그아웃
            </button>
          </div>
        ) : (
          <>
            {message && (
              <div
                style={{
                  padding: '12px',
                  marginBottom: '16px',
                  backgroundColor: '#f8d7da',
                  color: '#721c24',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                {message}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <button
                type="button"
                onClick={handleEmailLogin}
                disabled={isPending}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  opacity: isPending ? 0.6 : 1,
                }}
              >
                {isPending ? '로그인 중...' : '이메일 로그인'}
              </button>
            </div>

            <div
              style={{
                height: '1px',
                backgroundColor: '#e0e0e0',
                margin: '24px 0',
              }}
            />

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <button
                type="button"
                onClick={() => oauthLogin('google')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#fff',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Google 로그인
              </button>
              <button
                type="button"
                onClick={() => oauthLogin('kakao')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#fff',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Kakao 로그인
              </button>
              <button
                type="button"
                onClick={naverLogin}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#fff',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Naver 로그인
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
