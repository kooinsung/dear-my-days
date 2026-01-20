'use client'

import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { generateNaverAuthUrl } from '@/libs/naver/oauth'
import { createSupabaseBrowser } from '@/libs/supabase/browser'
import { css, cx } from '@/styled-system/css'
import { center, vstack } from '@/styled-system/patterns'
import { button, card, input } from '@/styled-system/recipes'
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
      className={center({
        minHeight: '100vh',
        backgroundColor: 'background',
        padding: '20px',
      })}
    >
      <div
        className={cx(
          card(),
          css({
            width: '100%',
            maxWidth: '400px',
          }),
        )}
      >
        <h1
          className={css({
            fontSize: '28px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '32px',
            color: 'text',
          })}
        >
          Dear Days
        </h1>

        {user ? (
          <div className={css({ textAlign: 'center' })}>
            <p
              className={css({
                marginBottom: '16px',
                color: '#666',
                fontSize: '14px',
              })}
            >
              {user.email ?? user.id}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              className={cx(
                button({ variant: 'primary' }),
                css({
                  width: '100%',
                  backgroundColor: 'danger',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  opacity: isPending ? 0.6 : 1,
                }),
              )}
            >
              로그아웃
            </button>
          </div>
        ) : (
          <>
            {message && (
              <div
                className={css({
                  padding: '12px',
                  marginBottom: '16px',
                  backgroundColor: '#f8d7da',
                  color: '#721c24',
                  borderRadius: '4px',
                  fontSize: '14px',
                })}
              >
                {message}
              </div>
            )}

            <div className={css({ marginBottom: '16px' })}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일"
                className={input()}
              />
            </div>

            <div className={css({ marginBottom: '16px' })}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                className={input()}
              />
            </div>

            <div className={css({ marginBottom: '24px' })}>
              <button
                type="button"
                onClick={handleEmailLogin}
                disabled={isPending}
                className={cx(
                  button({ variant: 'primary' }),
                  css({
                    width: '100%',
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    opacity: isPending ? 0.6 : 1,
                  }),
                )}
              >
                {isPending ? '로그인 중...' : '이메일 로그인'}
              </button>
            </div>

            <div
              className={css({
                height: '1px',
                backgroundColor: 'border',
                margin: '24px 0',
              })}
            />

            <div className={vstack({ gap: '12px' })}>
              <button
                type="button"
                onClick={() => oauthLogin('google')}
                className={cx(
                  button({ variant: 'secondary' }),
                  css({ width: '100%' }),
                )}
              >
                Google 로그인
              </button>
              <button
                type="button"
                onClick={() => oauthLogin('kakao')}
                className={cx(
                  button({ variant: 'secondary' }),
                  css({ width: '100%' }),
                )}
              >
                Kakao 로그인
              </button>
              <button
                type="button"
                onClick={naverLogin}
                className={cx(
                  button({ variant: 'secondary' }),
                  css({ width: '100%' }),
                )}
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
