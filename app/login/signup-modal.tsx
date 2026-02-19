'use client'

import { useEffect, useState } from 'react'
import { css, cx } from '@/styled-system/css'
import { button, card, input } from '@/styled-system/recipes'
import { signup } from './actions'

interface SignupModalProps {
  isOpen: boolean
  defaultEmail?: string
  onClose: () => void
  onSuccess?: () => void
}

export function SignupModal({
  isOpen,
  defaultEmail,
  onClose,
  onSuccess,
}: SignupModalProps) {
  const [email, setEmail] = useState(defaultEmail ?? '')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail ?? '')
      setPassword('')
      setMessage('')
      setIsPending(false)
    }
  }, [isOpen, defaultEmail])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  const handleSubmit = async () => {
    if (!email) {
      setMessage('이메일을 입력하세요')
      return
    }
    if (password.length < 8) {
      setMessage('비밀번호는 8자 이상이어야 합니다')
      return
    }

    setIsPending(true)
    try {
      setMessage('')

      const result = await signup(email, password)

      if (result?.error) {
        setMessage(result.error)
        return
      }

      onSuccess?.()
      onClose()
    } catch {
      setMessage('회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsPending(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={css({
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
      })}
    >
      <button
        type="button"
        aria-label="close"
        onClick={onClose}
        className={css({
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.45)',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        })}
      />

      <div
        className={css({
          position: 'relative',
          maxWidth: '420px',
          margin: '18vh auto 0',
          padding: '0 16px',
        })}
      >
        <div
          className={cx(
            card(),
            css({
              padding: '20px',
            }),
          )}
        >
          <div
            className={css({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            })}
          >
            <h2 className={css({ fontSize: '18px', fontWeight: 700 })}>
              이메일 회원가입
            </h2>

            <button
              type="button"
              onClick={onClose}
              className={css({
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                lineHeight: 1,
              })}
            >
              ×
            </button>
          </div>

          {message && (
            <div
              className={css({
                padding: '12px',
                marginBottom: '12px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '4px',
                fontSize: '14px',
              })}
            >
              {message}
            </div>
          )}

          <div className={css({ marginBottom: '12px' })}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              className={input()}
            />
          </div>

          <div className={css({ marginBottom: '12px' })}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 (8자 이상)"
              className={input()}
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
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
            {isPending ? '가입 중...' : '회원가입'}
          </button>

          <p
            className={css({
              marginTop: '12px',
              color: '#6b7280',
              fontSize: 13,
            })}
          >
            가입 후 이메일 인증을 완료해야 로그인할 수 있어요.
          </p>
        </div>
      </div>
    </div>
  )
}
