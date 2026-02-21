'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { css, cx } from '@/styled-system/css'
import { center } from '@/styled-system/patterns'
import { button, card } from '@/styled-system/recipes'

const CUSTOM_SCHEME_URL = 'dearmydays://login?verified=1'
const INTENT_URL =
  'intent://login?verified=1#Intent;scheme=dearmydays;package=com.dearmydays.app;end'
const WEB_FALLBACK_URL = '/login?verified=1'

function getDeepLinkUrl() {
  if (typeof navigator === 'undefined') {
    return CUSTOM_SCHEME_URL
  }
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('android')) {
    return INTENT_URL
  }
  return CUSTOM_SCHEME_URL
}

export function VerifyEmailSuccessClient() {
  const [deepLinkUrl, setDeepLinkUrl] = useState(CUSTOM_SCHEME_URL)

  useEffect(() => {
    setDeepLinkUrl(getDeepLinkUrl())
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
          이메일 인증이 완료되었습니다.
        </p>

        <div
          className={css({
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          })}
        >
          <a
            href={deepLinkUrl}
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
      </div>
    </div>
  )
}
