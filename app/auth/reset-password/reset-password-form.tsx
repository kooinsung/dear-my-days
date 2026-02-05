'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { css, cx } from '@/styled-system/css'
import { button, input } from '@/styled-system/recipes'

export default function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const uid = searchParams.get('uid') ?? ''
  const token = searchParams.get('token') ?? ''

  const hasParams = useMemo(() => Boolean(uid && token), [uid, token])

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async () => {
    if (!hasParams) {
      setMessage('메일의 재설정 링크로 접속하셔야 비밀번호를 변경할 수 있어요.')
      return
    }

    if (!password || password.length < 8) {
      setMessage('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    if (password !== passwordConfirm) {
      setMessage('비밀번호가 일치하지 않습니다.')
      return
    }

    setIsPending(true)
    try {
      setMessage('')

      const res = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, token, password }),
      })

      const data = (await res.json()) as { success?: boolean; error?: string }

      if (!res.ok || data.error) {
        setMessage(data.error ?? '요청을 처리할 수 없습니다.')
        return
      }

      router.replace('/login?reset=1')
    } catch {
      setMessage('요청을 처리할 수 없습니다.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div>
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

      <div className={css({ marginBottom: '12px' })}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="새 비밀번호 (8자 이상)"
          className={input()}
        />
      </div>

      <div className={css({ marginBottom: '16px' })}>
        <input
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="새 비밀번호 확인"
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
        {isPending ? '변경 중...' : '비밀번호 변경'}
      </button>

      {!hasParams && (
        <p
          className={css({ marginTop: '12px', color: '#6b7280', fontSize: 13 })}
        >
          메일의 재설정 링크로 접속하셔야 비밀번호를 변경할 수 있어요.
        </p>
      )}
    </div>
  )
}
