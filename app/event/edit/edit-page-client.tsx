'use client'

import Link from 'next/link'
import { css } from '@/styled-system/css'
import { flex } from '@/styled-system/patterns'
import { card } from '@/styled-system/recipes'
import EventForm from './event-form'

export function EventEditPageClient({ eventId }: { eventId?: string }) {
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
            href={eventId ? `/event/detail?id=${eventId}` : '/'}
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
            {eventId ? '이벤트 수정' : '새 이벤트'}
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
        <div className={card()}>
          <EventForm eventId={eventId} />
        </div>
      </div>
    </div>
  )
}
