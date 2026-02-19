'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { css, cx } from '@/styled-system/css'
import { center } from '@/styled-system/patterns'
import { button, card } from '@/styled-system/recipes'

const DEEP_LINK_URL = 'dearmydays://login?verified=1'
const WEB_FALLBACK_URL = '/login?verified=1'
const FALLBACK_DELAY_MS = 2000

export function VerifyEmailSuccessClient() {
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    window.location.href = DEEP_LINK_URL

    const timer = setTimeout(() => {
      setShowFallback(true)
    }, FALLBACK_DELAY_MS)

    return () => clearTimeout(timer)
  }, [])

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
          이메일 인증이 완료되었습니다. 앱으로 이동합니다...
        </p>

        {showFallback && (
          <div
            className={css({
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            })}
          >
            <a
              href={DEEP_LINK_URL}
              className={cx(
                button({ variant: 'primary' }),
                css({
                  width: '100%',
                  textDecoration: 'none',
                  textAlign: 'center',
                }),
              )}
            >
              앱으로 돌아가기
            </a>

            <Link
              href={WEB_FALLBACK_URL}
              className={css({
                color: 'primary',
                fontSize: '14px',
                textDecoration: 'underline',
              })}
            >
              웹에서 로그인하기
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
