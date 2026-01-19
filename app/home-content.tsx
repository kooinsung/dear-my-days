'use client'

import Link from 'next/link'
import { useUpcomingEvents } from '@/hooks/use-events'
import { getCategoryIcon, getCategoryLabel } from '@/libs/helpers'
import type { Event } from '@/libs/supabase/database.types'
import { calculateDday, formatDday } from '@/libs/utils'

export function HomeContent() {
  const { data: events, isLoading, error } = useUpcomingEvents()

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>로딩 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#dc3545' }}>이벤트를 불러오는데 실패했습니다.</p>
      </div>
    )
  }

  const upcomingEvents = events || []

  return (
    <section>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
          다가오는 이벤트
        </h2>
        <Link
          href="/event/past"
          style={{ color: '#007bff', textDecoration: 'none' }}
        >
          지난 이벤트 보기 →
        </Link>
      </div>

      {upcomingEvents.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            backgroundColor: 'white',
            borderRadius: '8px',
          }}
        >
          <p
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '8px',
            }}
          >
            등록된 이벤트가 없습니다
          </p>
          <p style={{ color: '#666' }}>
            새 이벤트를 추가하여 소중한 날을 기억하세요!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
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
                style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '20px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: 'inherit',
                  border: '1px solid #e0e0e0',
                  transition: 'box-shadow 0.2s',
                }}
              >
                {/* D-Day */}
                <div style={{ flexShrink: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      backgroundColor: isToday ? '#dc3545' : '#007bff',
                      color: 'white',
                    }}
                  >
                    {ddayText}
                  </span>
                </div>

                {/* 이벤트 정보 */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>
                      {getCategoryIcon(event.category)}
                    </span>
                    <h3
                      style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        margin: 0,
                      }}
                    >
                      {event.title}
                    </h3>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                    }}
                  >
                    <p style={{ margin: 0, color: '#666' }}>{primaryDate}</p>
                    <span
                      style={{
                        padding: '2px 8px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      {calendarLabel}
                    </span>
                  </div>

                  {event.note && (
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                      {event.note}
                    </p>
                  )}
                </div>

                {/* 카테고리 라벨 */}
                <div
                  style={{
                    flexShrink: 0,
                    padding: '4px 12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    alignSelf: 'flex-start',
                  }}
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
