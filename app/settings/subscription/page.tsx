'use client'

import { css, cx } from '@/styled-system/css'
import { card } from '@/styled-system/recipes'

export default function SubscriptionPage() {
  return (
    <div
      className={css({ padding: '20px', maxWidth: '600px', margin: '0 auto' })}
    >
      <h1
        className={css({
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '20px',
        })}
      >
        구독 관리
      </h1>

      <div className={cx(card(), css({ marginBottom: '24px' }))}>
        <div
          className={css({
            padding: '12px',
            backgroundColor: '#fff3cd',
            color: '#856404',
            borderRadius: '4px',
          })}
        >
          인앱결제 기능은 모바일 앱 출시 후 제공됩니다.
        </div>

        <h2
          className={css({
            fontSize: '18px',
            fontWeight: 'bold',
            marginTop: '20px',
            marginBottom: '12px',
          })}
        >
          현재 플랜
        </h2>
        <p
          className={css({
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#666',
          })}
        >
          무료
        </p>
        <p
          className={css({ color: '#666', fontSize: '14px', marginTop: '8px' })}
        >
          이벤트 등록 제한: 3개
        </p>
      </div>
    </div>
  )
}
