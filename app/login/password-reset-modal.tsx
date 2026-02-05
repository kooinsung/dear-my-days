'use client'

import { useEffect, useState } from 'react'
import { css, cx } from '@/styled-system/css'
import { button, card, input } from '@/styled-system/recipes'

interface PasswordResetModalProps {
  isOpen: boolean
  defaultEmail?: string
  onClose: () => void
  onSuccess?: (email: string) => void
}

export function PasswordResetModal({
  isOpen,
  defaultEmail,
  onClose,
  onSuccess,
}: PasswordResetModalProps) {
  const [email, setEmail] = useState(defaultEmail ?? '')
  const [message, setMessage] = useState('')
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail ?? '')
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

    setIsPending(true)
    try {
      setMessage('')

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = (await res.json()) as { success?: boolean; error?: string }

      if (!res.ok || data.error) {
        setMessage(data.error ?? '요청 처리에 실패했습니다.')
        return
      }

      onSuccess?.(email)
      setMessage(
        '재설정 메일을 발송했습니다. 메일함을 확인해 주세요. (가입된 이메일이라면 발송됩니다)',
      )
    } catch {
      setMessage('요청 처리에 실패했습니다.')
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
              비밀번호 재설정
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
            {isPending ? '발송 중...' : '재설정 메일 보내기'}
          </button>

          <p
            className={css({
              marginTop: '12px',
              color: '#6b7280',
              fontSize: 13,
            })}
          >
            메일에 포함된 링크로 이동해 새 비밀번호를 설정할 수 있어요.
          </p>
        </div>
      </div>
    </div>
  )
}
