'use client'

import Link from 'next/link'
import { useState } from 'react'
import { css, cx } from '@/styled-system/css'
import { flex, vstack } from '@/styled-system/patterns'
import { button, card } from '@/styled-system/recipes'

type TestResult = {
  status: 'idle' | 'loading' | 'success' | 'error'
  message?: string
}

export function NotificationsClient() {
  const [testResult, setTestResult] = useState<TestResult>({ status: 'idle' })

  const handleTestPush = async () => {
    setTestResult({ status: 'loading' })

    try {
      const res = await fetch('/api/notifications/test-send', {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setTestResult({
          status: 'error',
          message: data.error ?? '발송에 실패했습니다.',
        })
        return
      }

      setTestResult({
        status: 'success',
        message: `${data.data.sent}/${data.data.total}개 디바이스에 발송 완료`,
      })
    } catch {
      setTestResult({
        status: 'error',
        message: '네트워크 오류가 발생했습니다.',
      })
    }
  }

  return (
    <div className={css({ minHeight: '100vh', backgroundColor: 'background' })}>
      <header
        className={css({
          backgroundColor: 'white',
          borderBottom: '1px solid',
          borderColor: 'border',
          padding: '16px 0',
        })}
      >
        <div
          className={flex({
            maxWidth: 'container',
            margin: '0 auto',
            padding: '0 24px',
            justify: 'space-between',
            align: 'center',
          })}
        >
          <h1
            className={css({ fontSize: '20px', fontWeight: 'bold', margin: 0 })}
          >
            알림 설정
          </h1>
          <Link href="/settings" className={button({ variant: 'secondary' })}>
            설정으로
          </Link>
        </div>
      </header>

      <main
        className={css({
          maxWidth: '800px',
          margin: '0 auto',
          padding: '24px',
        })}
      >
        <section
          className={cx(card(), vstack({ gap: '16px', alignItems: 'stretch' }))}
        >
          <h2
            className={css({ fontSize: '18px', marginTop: 0, marginBottom: 0 })}
          >
            푸시 알림 테스트
          </h2>
          <p className={css({ margin: 0, color: '#666', fontSize: '14px' })}>
            등록된 디바이스로 테스트 푸시 알림을 보냅니다. 앱에서 푸시 권한을
            허용한 상태여야 합니다.
          </p>

          <button
            type="button"
            onClick={handleTestPush}
            disabled={testResult.status === 'loading'}
            className={button({ variant: 'primary' })}
          >
            {testResult.status === 'loading'
              ? '발송 중...'
              : '테스트 푸시 보내기'}
          </button>

          {testResult.status === 'success' && (
            <div
              className={css({
                padding: '12px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                color: '#166534',
                fontSize: '14px',
              })}
            >
              {testResult.message}
            </div>
          )}

          {testResult.status === 'error' && (
            <div
              className={css({
                padding: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '14px',
              })}
            >
              {testResult.message}
            </div>
          )}
        </section>

        <section
          className={cx(
            card(),
            vstack({ gap: '8px', alignItems: 'stretch' }),
            css({ marginTop: '16px' }),
          )}
        >
          <h2
            className={css({ fontSize: '18px', marginTop: 0, marginBottom: 0 })}
          >
            추후 제공 예정
          </h2>
          <ul
            className={css({ margin: 0, paddingLeft: '18px', color: '#666' })}
          >
            <li>푸시 알림 ON/OFF</li>
            <li>D-Day 알림 규칙(몇 일 전/당일 등)</li>
          </ul>
        </section>
      </main>
    </div>
  )
}
