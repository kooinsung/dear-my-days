'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDeleteEvent } from '@/hooks/use-events'
import { getCategoryIcon, getCategoryLabel } from '@/libs/helpers'
import type { Event } from '@/libs/supabase/database.types'
import { calculateDday, formatDday, toThisYearDate } from '@/libs/utils'
import { useUIStore } from '@/stores/ui-store'
import { css, cx } from '@/styled-system/css'
import { flex, grid } from '@/styled-system/patterns'
import { button, card } from '@/styled-system/recipes'

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

  const thisYearOccurrence = toThisYearDate(event.solar_date)
  const dday = calculateDday(thisYearOccurrence)
  const ddayText = formatDday(dday)
  const isToday = dday === 0

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
            maxWidth: '800px',
            margin: '0 auto',
            padding: '0 24px',
            justify: 'space-between',
            align: 'center',
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
          <Link
            href={`/event/edit?id=${eventId}`}
            className={button({ variant: 'primary', size: 'sm' })}
          >
            편집
          </Link>
        </div>
      </header>

      <div
        className={css({
          maxWidth: '800px',
          margin: '0 auto',
          padding: '24px',
        })}
      >
        <div
          className={css({
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '40px',
            marginBottom: '24px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          })}
        >
          <p
            className={css({
              fontSize: '14px',
              color: '#666',
              marginBottom: '8px',
            })}
          >
            올해 이벤트까지
          </p>
          <p
            className={css({
              fontSize: '48px',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: isToday ? 'danger' : 'primary',
            })}
          >
            {ddayText}
          </p>
          <p
            className={css({
              fontSize: '14px',
              color: '#999',
              marginBottom: '16px',
            })}
          >
            {thisYearOccurrence}
          </p>
          <h2
            className={css({
              fontSize: '28px',
              fontWeight: 'bold',
              color: 'text',
            })}
          >
            {event.title}
          </h2>
        </div>

        <div className={cx(card(), css({ marginBottom: '24px' }))}>
          <div className={css({ marginBottom: '24px' })}>
            <p
              className={css({
                fontSize: '14px',
                color: '#666',
                marginBottom: '8px',
              })}
            >
              카테고리
            </p>
            <div
              className={cx(
                flex({
                  display: 'inline-flex',
                  align: 'center',
                  gap: '8px',
                }),
                css({
                  padding: '8px 16px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '20px',
                }),
              )}
            >
              <span className={css({ fontSize: '20px' })}>
                {getCategoryIcon(event.category)}
              </span>
              <span>{getCategoryLabel(event.category)}</span>
            </div>
          </div>

          <div className={css({ marginBottom: '24px' })}>
            <p
              className={css({
                fontSize: '14px',
                color: '#666',
                marginBottom: '12px',
              })}
            >
              날짜 정보
            </p>
            <div className={grid({ gridTemplateColumns: '1fr', gap: '16px' })}>
              <div>
                <p
                  className={css({
                    fontSize: '12px',
                    color: '#999',
                    marginBottom: '4px',
                  })}
                >
                  등록된 날짜 (양력)
                </p>
                <p
                  className={css({
                    fontSize: '16px',
                    fontWeight: '500',
                    color: 'text',
                  })}
                >
                  {event.solar_date}
                </p>
              </div>
              {event.lunar_date && (
                <div>
                  <p
                    className={css({
                      fontSize: '12px',
                      color: '#999',
                      marginBottom: '4px',
                    })}
                  >
                    등록된 날짜 (음력)
                  </p>
                  <p
                    className={css({
                      fontSize: '16px',
                      fontWeight: '500',
                      color: 'text',
                    })}
                  >
                    {event.lunar_date}
                  </p>
                </div>
              )}
              {thisYearOccurrence !== event.solar_date && (
                <div
                  className={css({
                    backgroundColor: 'primaryLight',
                    padding: '12px',
                    borderRadius: '8px',
                    marginTop: '8px',
                  })}
                >
                  <p
                    className={css({
                      fontSize: '12px',
                      color: '#0066cc',
                      marginBottom: '4px',
                    })}
                  >
                    올해 발생일
                  </p>
                  <p
                    className={css({
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#0066cc',
                    })}
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
                className={css({
                  fontSize: '14px',
                  color: '#666',
                  marginBottom: '8px',
                })}
              >
                메모
              </p>
              <p
                className={css({
                  fontSize: '16px',
                  color: 'text',
                  lineHeight: '1.6',
                })}
              >
                {event.note}
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteEvent.isPending}
          className={cx(
            button({ variant: 'primary', size: 'lg' }),
            css({
              width: '100%',
              backgroundColor: 'danger',
              cursor: deleteEvent.isPending ? 'not-allowed' : 'pointer',
              opacity: deleteEvent.isPending ? 0.6 : 1,
            }),
          )}
        >
          {deleteEvent.isPending ? '삭제 중...' : '이벤트 삭제'}
        </button>
      </div>
    </div>
  )
}
