'use client'

import Link from 'next/link'
import { css, cx } from '@/styled-system/css'
import { center } from '@/styled-system/patterns'
import { button, card } from '@/styled-system/recipes'

export function VerifyEmailSuccessClient() {
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
            textAlign: 'center',
          }),
        )}
      >
        <h1
          className={css({
            fontSize: '20px',
            fontWeight: 700,
            marginBottom: '12px',
          })}
        >
          이메일 인증 완료
        </h1>

        <p
          className={css({
            color: '#6b7280',
            fontSize: '14px',
            marginBottom: '24px',
          })}
        >
          이메일 인증이 완료되었습니다.
        </p>

        <Link
          href="/login?verified=1"
          className={cx(
            button({ variant: 'primary' }),
            css({
              width: '100%',
              textDecoration: 'none',
              textAlign: 'center',
            }),
          )}
        >
          로그인하기
        </Link>
      </div>
    </div>
  )
}
