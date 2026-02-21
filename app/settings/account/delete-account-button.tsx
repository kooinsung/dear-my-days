'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { css, cx } from '@/styled-system/css'
import { button } from '@/styled-system/recipes'
import { deleteAccount } from './actions'

export function DeleteAccountButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>('')

  const handleDelete = () => {
    const ok = window.confirm(
      '정말 탈퇴하시겠어요?\n탈퇴하면 이 서비스의 계정이 삭제되며 복구가 어려울 수 있어요.',
    )
    if (!ok) {
      return
    }

    setError('')
    startTransition(async () => {
      try {
        const result = await deleteAccount()
        if ('error' in result) {
          setError(result.error)
          return
        }
        if (!result.ok) {
          const failed = Object.entries(result.steps)
            .filter(([, v]) => !v.ok)
            .map(([k, v]) => `${k}: ${v.error ?? 'failed'}`)
            .join('\n')
          setError(failed || '탈퇴 처리에 실패했습니다.')
          return
        }

        // server action에서 redirect가 실행되면 아래 코드는 실행되지 않을 수 있음
        router.push('/login')
        router.refresh()
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '탈퇴에 실패했습니다.'
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
        onClick={handleDelete}
        disabled={isPending}
        className={cx(
          button({ variant: 'secondary' }),
          css({
            width: '100%',
            border: '1px solid',
            borderColor: 'danger',
            color: 'danger',
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.6 : 1,
          }),
        )}
      >
        {isPending ? '탈퇴 처리 중...' : '계정 탈퇴'}
      </button>
    </div>
  )
}
