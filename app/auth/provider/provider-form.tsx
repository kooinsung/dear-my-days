'use client'

import type { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { generateNaverAuthUrl } from '@/libs/naver/oauth'
import { createSupabaseBrowser } from '@/libs/supabase/browser'

type OAuthProvider = 'google' | 'kakao'
type TestProvider = 'email' | OAuthProvider | 'naver'

interface ProviderTestProps {
  initialUser: User | null
}

export default function ProviderTestForm({ initialUser }: ProviderTestProps) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const supabase = createSupabaseBrowser()
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      },
    )
    return () => listener.subscription.unsubscribe()
  }, [])

  const linkProvider = async (provider: TestProvider) => {
    setMessage('')
    if (!user) {
      return setMessage('로그인이 필요합니다.')
    }

    if (provider === 'email') {
      return linkEmail()
    }
    if (provider === 'naver') {
      const state = crypto.randomUUID()
      sessionStorage.setItem('naver_state', state)
      window.location.href = generateNaverAuthUrl(state)
      return
    }
    if (provider === 'google' || provider === 'kakao') {
      const supabase = createSupabaseBrowser()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth-provider` },
      })
      if (error) {
        setMessage(`연결 실패: ${error.message}`)
      }
      return
    }
  }

  const unlinkProvider = async (provider: TestProvider) => {
    setMessage('')
    if (!user) {
      return setMessage('로그인이 필요합니다.')
    }

    try {
      const res = await fetch('/api/providers/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('Provider 해제 성공')
      } else {
        setMessage(`Provider 해제 실패: ${data.error}`)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setMessage(`Provider 해제 실패: ${message}`)
    }
  }

  const linkEmail = async () => {
    setMessage('')
    if (!user) {
      return setMessage('로그인이 필요합니다.')
    }
    const email = prompt('연결할 이메일')
    const password = prompt('비밀번호')
    if (!email || !password) {
      return setMessage('이메일 또는 비밀번호 필요')
    }

    const supabase = createSupabaseBrowser()
    const { error } = await supabase.auth.updateUser({ email, password })
    if (error) {
      setMessage(`이메일 연결 실패: ${error.message}`)
    } else {
      setMessage('이메일 연결 성공')
    }
  }

  return (
    <div
      style={{
        maxWidth: '600px',
        margin: '40px auto',
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '24px',
          textAlign: 'center',
          color: '#333',
        }}
      >
        Provider 연결/해제 테스트
      </h1>
      {user ? (
        <>
          <p
            style={{
              marginBottom: '24px',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              color: '#666',
              textAlign: 'center',
            }}
          >
            로그인된 사용자: {user.email || user.id}
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <button
              type="button"
              style={{
                padding: '12px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onClick={() => linkProvider('email')}
            >
              Email 연결
            </button>
            <button
              type="button"
              style={{
                padding: '12px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onClick={() => linkProvider('google')}
            >
              Google 연결
            </button>
            <button
              type="button"
              style={{
                padding: '12px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onClick={() => linkProvider('kakao')}
            >
              Kakao 연결
            </button>
            <button
              type="button"
              style={{
                padding: '12px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onClick={() => linkProvider('naver')}
            >
              Naver 연결
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
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <button
              type="button"
              style={{
                padding: '12px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onClick={() => unlinkProvider('email')}
            >
              Email 해제
            </button>
            <button
              type="button"
              style={{
                padding: '12px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onClick={() => unlinkProvider('google')}
            >
              Google 해제
            </button>
            <button
              type="button"
              style={{
                padding: '12px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onClick={() => unlinkProvider('kakao')}
            >
              Kakao 해제
            </button>
            <button
              type="button"
              style={{
                padding: '12px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onClick={() => unlinkProvider('naver')}
            >
              Naver 해제
            </button>
          </div>

          {message && (
            <p
              style={{
                padding: '12px',
                backgroundColor: '#d4edda',
                color: '#155724',
                borderRadius: '4px',
                textAlign: 'center',
                margin: 0,
              }}
            >
              {message}
            </p>
          )}
        </>
      ) : (
        <p
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#666',
            fontSize: '16px',
          }}
        >
          로그인이 필요합니다.
        </p>
      )}
    </div>
  )
}
