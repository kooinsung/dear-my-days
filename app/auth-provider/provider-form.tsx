'use client'

import type { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { generateNaverAuthUrl } from '@/libs/naver/oauth'
import { createSupabaseBrowser } from '@/libs/supabase/browser'
import * as styles from './provider-form.css'

type OAuthProvider = 'google' | 'kakao'
type TestProvider = 'email' | OAuthProvider | 'naver'

interface ProviderTestProps {
  initialUser: User | null
}

export default function ProviderTestForm({ initialUser }: ProviderTestProps) {
  const supabase = createSupabaseBrowser()
  const [user, setUser] = useState<User | null>(initialUser)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      },
    )
    return () => listener.subscription.unsubscribe()
  }, [supabase])

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

    const { error } = await supabase.auth.updateUser({ email, password })
    if (error) {
      setMessage(`이메일 연결 실패: ${error.message}`)
    } else {
      setMessage('이메일 연결 성공')
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Provider 연결/해제 테스트</h1>
      {user ? (
        <>
          <p className={styles.userInfo}>
            로그인된 사용자: {user.email || user.id}
          </p>
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.button}
              onClick={() => linkProvider('email')}
            >
              Email 연결
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => linkProvider('google')}
            >
              Google 연결
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => linkProvider('kakao')}
            >
              Kakao 연결
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => linkProvider('naver')}
            >
              Naver 연결
            </button>
          </div>

          <div className={styles.divider} />

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={() => unlinkProvider('email')}
            >
              Email 해제
            </button>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={() => unlinkProvider('google')}
            >
              Google 해제
            </button>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={() => unlinkProvider('kakao')}
            >
              Kakao 해제
            </button>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={() => unlinkProvider('naver')}
            >
              Naver 해제
            </button>
          </div>

          {message && <p className={styles.message}>{message}</p>}
        </>
      ) : (
        <p className={styles.loginRequired}>로그인이 필요합니다.</p>
      )}
    </div>
  )
}
