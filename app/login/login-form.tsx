'use client'

import type { User } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { isNative } from '@/libs/capacitor/platform'
import { googleLogin, kakaoLogin } from '@/libs/capacitor/social-login'
import { generateNaverAuthUrl } from '@/libs/naver/oauth'
import { getOAuthCallbackUrl } from '@/libs/oauth/urls'
import { createSupabaseBrowser } from '@/libs/supabase/browser'
import { css, cx } from '@/styled-system/css'
import { center, vstack } from '@/styled-system/patterns'
import { button, card, input } from '@/styled-system/recipes'
import { login } from './actions'
import { PasswordResetModal } from './password-reset-modal'
import { SignupModal } from './signup-modal'

interface LoginFormProps {
  initialUser: User | null
}

export default function LoginForm({ initialUser }: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isNativeApp, setIsNativeApp] = useState(false)

  const [user, setUser] = useState<User | null>(initialUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  // success 메시지도 필요해서 별도 상태로 둠
  const [infoMessage, setInfoMessage] = useState('')

  const [isLoginPending, setIsLoginPending] = useState(false)
  const [isOAuthPending, setIsOAuthPending] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false)

  const isAnyPending = isLoginPending || isOAuthPending

  const alertStyle = (bg: string, color: string) =>
    css({
      padding: '12px',
      marginBottom: '16px',
      backgroundColor: bg,
      color,
      borderRadius: '4px',
      fontSize: '14px',
    })

  // 플랫폼 감지
  useEffect(() => {
    const checkNative = async () => {
      const native = await isNative()
      setIsNativeApp(native)
    }
    checkNative()
  }, [])

  // 세션 변화 감지
  useEffect(() => {
    const supabase = createSupabaseBrowser()
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // 인증 완료 후 리다이렉트(/login?verified=1)
  useEffect(() => {
    const verified = searchParams.get('verified')
    if (verified === '1') {
      setInfoMessage('이메일 인증이 완료되었습니다. 이제 로그인할 수 있어요.')
    }

    const reset = searchParams.get('reset')
    if (reset === '1') {
      setInfoMessage(
        '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.',
      )
    }

    // OAuth 에러 처리
    const error = searchParams.get('error')
    if (error) {
      setMessage(decodeURIComponent(error))
    }
  }, [searchParams])

  // ✅ Email 로그인 (Server Action 직접 호출)
  const handleEmailLogin = async () => {
    if (isAnyPending) {
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

  // OAuth
  const oauthLogin = async (provider: 'google' | 'kakao' | 'apple') => {
    setIsOAuthPending(true)
    setMessage('')
    setInfoMessage('')
    try {
      if (isNativeApp && (provider === 'google' || provider === 'kakao')) {
        // 네이티브 앱: 네이티브 SDK 사용
        const result =
          provider === 'google' ? await googleLogin() : await kakaoLogin()
        if (result.success) {
          router.replace('/')
          return
        }
      } else {
        // 웹 또는 네이티브 미지원 제공자: Supabase OAuth 플로우
        const supabase = createSupabaseBrowser()
        await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: getOAuthCallbackUrl(window.location.origin),
          },
        })
      }
    } catch (error) {
      console.error('❌ OAuth login error:', error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : '로그인에 실패했습니다. 다시 시도해 주세요.'
      setMessage(errorMessage)
      setIsOAuthPending(false)
    }
  }

  const naverLogin = async () => {
    try {
      const state = crypto.randomUUID()
      // Cookie로 state 저장 (서버에서 검증 가능)
      // biome-ignore lint/suspicious/noDocumentCookie: CSRF 방지를 위해 서버에서 검증 가능한 cookie 사용 필요
      document.cookie = `naver_state=${state}; path=/; max-age=600; SameSite=Lax`

      const naverUrl = generateNaverAuthUrl(state)
      window.location.href = naverUrl
    } catch (error) {
      console.error('❌ Naver login error:', error)
      setMessage('로그인에 실패했습니다. 다시 시도해 주세요.')
    }
  }

  const oauthProviders = [
    {
      provider: 'google',
      label: 'Google 로그인',
      onClick: () => oauthLogin('google'),
    },
    {
      provider: 'kakao',
      label: 'Kakao 로그인',
      onClick: () => oauthLogin('kakao'),
    },
    {
      provider: 'apple',
      label: 'Apple 로그인',
      onClick: () => oauthLogin('apple'),
    },
    { provider: 'naver', label: 'Naver 로그인', onClick: naverLogin },
  ]

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
        {isOAuthPending && (
          <div
            className={cx(
              alertStyle('#e8f4fd', '#1a73e8'),
              css({ textAlign: 'center' }),
            )}
          >
            로그인 진행중...
          </div>
        )}
        {!user && (
          <>
            {message && (
              <div className={alertStyle('#f8d7da', '#721c24')}>{message}</div>
            )}
            {infoMessage && (
              <div className={alertStyle('#d1ecf1', '#0c5460')}>
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
                disabled={isAnyPending}
                className={cx(
                  button({ variant: 'primary' }),
                  css({
                    width: '100%',
                    cursor: isAnyPending ? 'not-allowed' : 'pointer',
                    opacity: isAnyPending ? 0.6 : 1,
                  }),
                )}
              >
                {isLoginPending ? '로그인 중...' : '이메일 로그인'}
              </button>
            </div>
            <div className={css({ marginBottom: '24px' })}>
              <button
                type="button"
                onClick={() => setIsSignupModalOpen(true)}
                disabled={isAnyPending}
                className={cx(
                  button({ variant: 'secondary' }),
                  css({
                    width: '100%',
                    cursor: isAnyPending ? 'not-allowed' : 'pointer',
                    opacity: isAnyPending ? 0.6 : 1,
                  }),
                )}
              >
                이메일 회원가입
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
              {oauthProviders.map(({ provider, label, onClick }) => (
                <button
                  key={provider}
                  type="button"
                  onClick={onClick}
                  className={cx(
                    button({ variant: 'secondary' }),
                    css({ width: '100%' }),
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div
              className={css({
                marginTop: '16px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              })}
            >
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
              <button
                type="button"
                onClick={() => router.push('/test')}
                className={css({
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: '14px',
                  textDecoration: 'underline',
                })}
              >
                테스트 페이지로 이동
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
            <SignupModal
              isOpen={isSignupModalOpen}
              defaultEmail={email}
              onClose={() => setIsSignupModalOpen(false)}
              onSuccess={() => {
                setInfoMessage(
                  '회원가입이 완료되었습니다. 인증 메일을 보냈으니 메일함에서 확인 후 링크를 클릭해 로그인해 주세요.',
                )
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
