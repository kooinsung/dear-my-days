'use client'

import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateNaverAuthUrl } from '@/libs/naver/oauth'
import { getOAuthCallbackUrl } from '@/libs/oauth/urls'
import { createSupabaseBrowser } from '@/libs/supabase/browser'
import { css, cx } from '@/styled-system/css'
import { center, vstack } from '@/styled-system/patterns'
import { button, card, input } from '@/styled-system/recipes'
import { login, logout, signup } from './actions'
import { PasswordResetModal } from './password-reset-modal'

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
  // success 메시지도 필요해서 별도 상태로 둠
  const [infoMessage, setInfoMessage] = useState('')

  const [isLoginPending, setIsLoginPending] = useState(false)
  const [isSignupPending, setIsSignupPending] = useState(false)
  const [isLogoutPending, setIsLogoutPending] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)

  // 세션 변화 감지
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => data.subscription.unsubscribe()
  }, [supabase])

  // 인증 완료 후 리다이렉트(/login?verified=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const verified = params.get('verified')
    if (verified === '1') {
      setInfoMessage('이메일 인증이 완료되었습니다. 이제 로그인할 수 있어요.')
    }

    const reset = params.get('reset')
    if (reset === '1') {
      setInfoMessage(
        '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.',
      )
    }
  }, [])

  // ✅ Email 로그인 (Server Action 직접 호출)
  const handleEmailLogin = async () => {
    if (isLoginPending || isSignupPending || isLogoutPending) {
      return
    }

    setIsLoginPending(true)
    try {
      setMessage('')
      setInfoMessage('')

      const result = await login(email, password)

      if (result?.error) {
        setMessage(result.error)
        return
      }

      router.push('/')
    } finally {
      setIsLoginPending(false)
    }
  }

  const handleEmailSignup = async () => {
    if (isLoginPending || isSignupPending || isLogoutPending) {
      return
    }

    setIsSignupPending(true)
    try {
      setMessage('')
      setInfoMessage('')

      const result = await signup(email, password)

      if (result?.error) {
        setMessage(result.error)
        return
      }

      setInfoMessage(
        '회원가입이 완료되었습니다. 인증 메일을 보냈으니 메일함에서 확인 후 링크를 클릭해 로그인해 주세요.',
      )
    } finally {
      setIsSignupPending(false)
    }
  }

  // OAuth
  const oauthLogin = async (provider: 'google' | 'kakao') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getOAuthCallbackUrl(window.location.origin),
      },
    })
  }

  const naverLogin = () => {
    const state = crypto.randomUUID()
    sessionStorage.setItem('naver_state', state)
    window.location.href = generateNaverAuthUrl(state)
  }

  const handleLogout = async () => {
    if (isLoginPending || isSignupPending || isLogoutPending) {
      return
    }

    setIsLogoutPending(true)
    try {
      await logout()
      setUser(null)
      router.push('/login')
    } finally {
      setIsLogoutPending(false)
    }
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
              disabled={isLogoutPending}
              className={cx(
                button({ variant: 'primary' }),
                css({
                  width: '100%',
                  backgroundColor: 'danger',
                  cursor: isLogoutPending ? 'not-allowed' : 'pointer',
                  opacity: isLogoutPending ? 0.6 : 1,
                }),
              )}
            >
              {isLogoutPending ? '로그아웃 중...' : '로그아웃'}
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

            {infoMessage && (
              <div
                className={css({
                  padding: '12px',
                  marginBottom: '16px',
                  backgroundColor: '#d1ecf1',
                  color: '#0c5460',
                  borderRadius: '4px',
                  fontSize: '14px',
                })}
              >
                {infoMessage}
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
                disabled={isLoginPending || isSignupPending}
                className={cx(
                  button({ variant: 'primary' }),
                  css({
                    width: '100%',
                    cursor:
                      isLoginPending || isSignupPending
                        ? 'not-allowed'
                        : 'pointer',
                    opacity: isLoginPending || isSignupPending ? 0.6 : 1,
                  }),
                )}
              >
                {isLoginPending ? '로그인 중...' : '이메일 로그인'}
              </button>
            </div>

            <div className={css({ marginBottom: '24px' })}>
              <button
                type="button"
                onClick={handleEmailSignup}
                disabled={isSignupPending || isLoginPending}
                className={cx(
                  button({ variant: 'secondary' }),
                  css({
                    width: '100%',
                    cursor:
                      isSignupPending || isLoginPending
                        ? 'not-allowed'
                        : 'pointer',
                    opacity: isSignupPending || isLoginPending ? 0.6 : 1,
                  }),
                )}
              >
                {isSignupPending ? '회원가입 중...' : '이메일 회원가입'}
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

            <div className={css({ marginTop: '16px', textAlign: 'center' })}>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className={css({
                  backgroundColor: 'transparent',
                  color: 'primary',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: '14px',
                  textDecoration: 'underline',
                })}
              >
                비밀번호를 잊으셨나요?
              </button>
            </div>

            <PasswordResetModal
              isOpen={isResetModalOpen}
              defaultEmail={email}
              onClose={() => setIsResetModalOpen(false)}
              onSuccess={() => {
                // 모달에서 성공 메시지는 자체 노출, 화면 상단에도 안내 표시
                setInfoMessage(
                  '재설정 메일을 발송했습니다. 메일함을 확인해 주세요. (가입된 이메일이라면 발송됩니다)',
                )
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
