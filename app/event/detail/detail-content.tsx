'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDeleteEvent } from '@/hooks/use-events'
import { getCategoryIcon, getCategoryLabel } from '@/libs/helpers'
import type { Event } from '@/libs/supabase/database.types'
import { calculateDday, formatDday } from '@/libs/utils'
import { useUIStore } from '@/stores/ui-store'

interface EventDetailContentProps {
  event: Event
  eventId: string
}

export function EventDetailContent({
  event,
  eventId,
}: EventDetailContentProps) {
  const router = useRouter()
  const showToast = useUIStore((state) => state.showToast)
  const deleteEvent = useDeleteEvent()

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return
    }

    try {
      await deleteEvent.mutateAsync(event.id)
      showToast('이벤트가 삭제되었습니다', 'success')
      router.push('/')
      router.refresh()
    } catch (_error) {
      showToast('삭제에 실패했습니다', 'error')
    }
  }

  // 올해 발생일 계산
  const calculateThisYearOccurrence = (solarDate: string): string => {
    const eventDate = new Date(solarDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const thisYear = today.getFullYear()
    const eventThisYear = new Date(
      thisYear,
      eventDate.getMonth(),
      eventDate.getDate(),
    )
    eventThisYear.setHours(0, 0, 0, 0)

    const year = eventThisYear.getFullYear()
    const month = String(eventThisYear.getMonth() + 1).padStart(2, '0')
    const day = String(eventThisYear.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const thisYearOccurrence = calculateThisYearOccurrence(event.solar_date)
  const dday = calculateDday(thisYearOccurrence)
  const ddayText = formatDday(dday)
  const isToday = dday === 0

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <header
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e0e0e0',
          padding: '16px 0',
        }}
      >
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link
            href="/"
            style={{
              color: '#007bff',
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            ← 뒤로
          </Link>
          <Link
            href={`/event/edit?id=${eventId}`}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            편집
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '40px',
            marginBottom: '24px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            올해 이벤트까지
          </p>
          <p
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: isToday ? '#dc3545' : '#007bff',
            }}
          >
            {ddayText}
          </p>
          <p style={{ fontSize: '14px', color: '#999', marginBottom: '16px' }}>
            {thisYearOccurrence}
          </p>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
            {event.title}
          </h2>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              카테고리
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '20px',
              }}
            >
              <span style={{ fontSize: '20px' }}>
                {getCategoryIcon(event.category)}
              </span>
              <span>{getCategoryLabel(event.category)}</span>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <p
              style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}
            >
              날짜 정보
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '16px',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '12px',
                    color: '#999',
                    marginBottom: '4px',
                  }}
                >
                  등록된 날짜 (양력)
                </p>
                <p
                  style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}
                >
                  {event.solar_date}
                </p>
              </div>
              {event.lunar_date && (
                <div>
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#999',
                      marginBottom: '4px',
                    }}
                  >
                    등록된 날짜 (음력)
                  </p>
                  <p
                    style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#333',
                    }}
                  >
                    {event.lunar_date}
                  </p>
                </div>
              )}
              {thisYearOccurrence !== event.solar_date && (
                <div
                  style={{
                    backgroundColor: '#e7f3ff',
                    padding: '12px',
                    borderRadius: '8px',
                    marginTop: '8px',
                  }}
                >
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#0066cc',
                      marginBottom: '4px',
                    }}
                  >
                    올해 발생일
                  </p>
                  <p
                    style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#0066cc',
                    }}
                  >
                    {thisYearOccurrence}
                  </p>
                </div>
              )}
            </div>
          </div>

          {event.note && (
            <div>
              <p
                style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}
              >
                메모
              </p>
              <p style={{ fontSize: '16px', color: '#333', lineHeight: '1.6' }}>
                {event.note}
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteEvent.isPending}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: deleteEvent.isPending ? 'not-allowed' : 'pointer',
            opacity: deleteEvent.isPending ? 0.6 : 1,
          }}
        >
          {deleteEvent.isPending ? '삭제 중...' : '이벤트 삭제'}
        </button>
      </div>
    </div>
  )
}
