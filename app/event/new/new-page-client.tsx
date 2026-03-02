'use client'

import Link from 'next/link'
import { useEventLimit } from '@/hooks/use-event-limit'
import { css } from '@/styled-system/css'
import { flex, vstack } from '@/styled-system/patterns'
import { button, card } from '@/styled-system/recipes'
import EventForm from '../edit/[id]/event-form'

function EventLimitReached({
  eventCount,
  eventLimit,
  isPremium,
}: {
  eventCount: number
  eventLimit: number
  isPremium: boolean
}) {
  return (
    <div className={card()}>
      <div
        className={vstack({
          gap: '16px',
          alignItems: 'center',
          padding: '24px 0',
        })}
      >
        <div
          className={css({
            fontSize: '48px',
            lineHeight: 1,
          })}
        >
          🔒
        </div>
        <h2
          className={css({
            fontSize: '18px',
            fontWeight: 'bold',
            margin: 0,
            textAlign: 'center',
          })}
        >
          이벤트 등록 제한에 도달했습니다
        </h2>
        <p
          className={css({
            color: '#666',
            fontSize: '14px',
            margin: 0,
            textAlign: 'center',
            lineHeight: 1.6,
          })}
        >
          현재 {eventCount}개 / 최대 {eventLimit}개 등록됨
          <br />
          {isPremium ? (
            <>
              이번 달 이벤트 등록 허용량을 모두 사용했습니다.
              <br />
              다음 달에 추가 등록이 가능합니다.
            </>
          ) : (
            <>
              프리미엄 구독 또는 추가 슬롯을 구매하면
              <br />더 많은 이벤트를 등록할 수 있습니다.
            </>
          )}
        </p>
        <Link
          href="/settings/subscription"
          className={button({ variant: 'primary' })}
        >
          구독 관리로 이동
        </Link>
      </div>
    </div>
  )
}

export function EventNewPageClient() {
  const { data: limitInfo, isLoading } = useEventLimit()

  return (
    <div className={css({ minHeight: '100vh', backgroundColor: 'background' })}>
      <header
        className={css({
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e5e5',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        })}
      >
        <div
          className={flex({
            maxWidth: '800px',
            margin: '0 auto',
            padding: '16px 20px',
            align: 'center',
            gap: '16px',
          })}
        >
          <Link
            href="/"
            className={css({
              color: 'primary',
              textDecoration: 'none',
              fontSize: '14px',
            })}
          >
            ← 뒤로
          </Link>
          <h1
            className={css({
              fontSize: '20px',
              fontWeight: 'bold',
              margin: 0,
              flex: 1,
              textAlign: 'center',
            })}
          >
            새 이벤트
          </h1>
          <div className={css({ width: '48px' })} />
        </div>
      </header>

      <div
        className={css({
          maxWidth: '800px',
          margin: '0 auto',
          padding: '24px 20px',
        })}
      >
        {isLoading ? (
          <div
            className={css({
              textAlign: 'center',
              padding: '40px 0',
              color: '#666',
            })}
          >
            확인 중...
          </div>
        ) : limitInfo && !limitInfo.canCreate ? (
          <EventLimitReached
            eventCount={limitInfo.eventCount}
            eventLimit={limitInfo.eventLimit}
            isPremium={limitInfo.isPremium}
          />
        ) : (
          <div className={card()}>
            <EventForm showNotifications={true} />
          </div>
        )}
      </div>
    </div>
  )
}
