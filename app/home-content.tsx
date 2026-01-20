'use client'

import Link from 'next/link'
import { useUpcomingEvents } from '@/hooks/use-events'
import { getCategoryIcon, getCategoryLabel } from '@/libs/helpers'
import type { Event } from '@/libs/supabase/database.types'
import { calculateDday, formatDday } from '@/libs/utils'
import { css, cx } from '@/styled-system/css'
import { flex, vstack } from '@/styled-system/patterns'
import { badge, ddayBadge, eventCard } from '@/styled-system/recipes'

export function HomeContent() {
  const { data: events, isLoading, error } = useUpcomingEvents()

  if (isLoading) {
    // ...existing code...
  }

  if (error) {
    // ...existing code...
  }

  const upcomingEvents = events || []

  return (
    <section>
      <div
        className={cx(
          flex({
            justify: 'space-between',
            align: 'center',
          }),
          css({ marginBottom: '24px' }),
        )}
      >
        <h2
          className={css({ fontSize: '24px', fontWeight: 'bold', margin: 0 })}
        >
          다가오는 이벤트
        </h2>
        <Link
          href="/event/past"
          className={css({ color: 'primary', textDecoration: 'none' })}
        >
          지난 이벤트 보기 →
        </Link>
      </div>

      {upcomingEvents.length === 0 ? (
        <div
          className={css({
            padding: '60px 20px',
            textAlign: 'center',
            backgroundColor: 'white',
            borderRadius: '8px',
          })}
        >
          <p
            className={css({
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '8px',
            })}
          >
            등록된 이벤트가 없습니다
          </p>
          <p className={css({ color: '#666' })}>
            새 이벤트를 추가하여 소중한 날을 기억하세요!
          </p>
        </div>
      ) : (
        <div className={vstack({ gap: '16px', alignItems: 'stretch' })}>
          {upcomingEvents.map((event: Event) => {
            const dday = calculateDday(event.solar_date)
            const ddayText = formatDday(dday)
            const primaryDate =
              event.calendar_type === 'SOLAR'
                ? event.solar_date
                : event.lunar_date || event.solar_date
            const calendarLabel =
              event.calendar_type === 'SOLAR' ? '양력' : '음력'
            const isToday = dday === 0

            return (
              <Link
                key={event.id}
                href={`/event/detail?id=${event.id}`}
                className={eventCard()}
              >
                {/* D-Day */}
                <div className={css({ flexShrink: 0 })}>
                  <span className={ddayBadge({ isToday })}>{ddayText}</span>
                </div>

                {/* 이벤트 정보 */}
                <div className={css({ flex: 1 })}>
                  <div
                    className={cx(
                      flex({
                        align: 'center',
                        gap: '8px',
                      }),
                      css({ marginBottom: '8px' }),
                    )}
                  >
                    <span className={css({ fontSize: '20px' })}>
                      {getCategoryIcon(event.category)}
                    </span>
                    <h3
                      className={css({
                        fontSize: '18px',
                        fontWeight: 'bold',
                        margin: 0,
                      })}
                    >
                      {event.title}
                    </h3>
                  </div>

                  <div
                    className={cx(
                      flex({
                        align: 'center',
                        gap: '8px',
                      }),
                      css({ marginBottom: '8px' }),
                    )}
                  >
                    <p className={css({ margin: 0, color: '#666' })}>
                      {primaryDate}
                    </p>
                    <span className={badge()}>{calendarLabel}</span>
                  </div>

                  {event.note && (
                    <p
                      className={css({
                        margin: 0,
                        color: '#666',
                        fontSize: '14px',
                      })}
                    >
                      {event.note}
                    </p>
                  )}
                </div>

                {/* 카테고리 라벨 */}
                <div
                  className={css({
                    flexShrink: 0,
                    padding: '4px 12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    alignSelf: 'flex-start',
                  })}
                >
                  {getCategoryLabel(event.category)}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
