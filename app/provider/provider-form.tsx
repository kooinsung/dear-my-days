'use client'

import { useEffect, useState } from 'react'
import { generateNaverAuthUrl } from '@/libs/naver/oauth'
import { createSupabaseBrowser } from '@/libs/supabase/browser'

type OAuthProvider = 'google' | 'kakao'
type TestProvider = 'email' | OAuthProvider | 'naver'

interface ProviderTestProps {
  initialUser: any
}

export default function ProviderTestForm({ initialUser }: ProviderTestProps) {
  const supabase = createSupabaseBrowser()
  const [user, setUser] = useState<any>(initialUser)
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
        options: { redirectTo: window.location.origin + '/provider' },
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
    } catch (err: any) {
      setMessage(`Provider 해제 실패: ${err.message}`)
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
    <div style={{ padding: 20 }}>
      <h1>Provider 연결/해제 테스트</h1>
      {user ? (
        <>
          <p>로그인된 사용자: {user.email || user.id}</p>
          <button type="button" onClick={() => linkProvider('email')}>
            Email 연결
          </button>
          <button type="button" onClick={() => linkProvider('google')}>
            Google 연결
          </button>
          <button type="button" onClick={() => linkProvider('kakao')}>
            Kakao 연결
          </button>
          <button type="button" onClick={() => linkProvider('naver')}>
            Naver 연결
          </button>
          <hr />
          <button type="button" onClick={() => unlinkProvider('email')}>
            Email 해제
          </button>
          <button type="button" onClick={() => unlinkProvider('google')}>
            Google 해제
          </button>
          <button type="button" onClick={() => unlinkProvider('kakao')}>
            Kakao 해제
          </button>
          <button type="button" onClick={() => unlinkProvider('naver')}>
            Naver 해제
          </button>
          {message && <p>{message}</p>}
        </>
      ) : (
        <p>로그인이 필요합니다.</p>
      )}
    </div>
  )
}
