'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { logout } from '@/login/actions'
import { css, cx } from '@/styled-system/css'
import { button } from '@/styled-system/recipes'

export function LogoutButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>('')

  const handleLogout = () => {
    setError('')
    startTransition(async () => {
      try {
        await logout()
        router.push('/login')
        router.refresh()
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '로그아웃에 실패했습니다.'
        setError(msg)
      }
    })
  }

  return (
    <div>
      {error && (
        <p
          className={css({
            color: 'danger',
            marginTop: 0,
            marginBottom: '8px',
          })}
        >
          {error}
        </p>
      )}
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
        {isPending ? '로그아웃 중...' : '로그아웃'}
      </button>
    </div>
  )
}
