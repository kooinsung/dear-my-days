'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useDeleteEvent } from '@/hooks/use-events'
import { getCategoryIcon, getCategoryLabel } from '@/libs/helpers'
import { createSupabaseBrowser } from '@/libs/supabase/browser'
import type { Event } from '@/libs/supabase/database.types'
import { calculateDday, formatDday, toThisYearDate } from '@/libs/utils'
import { useUIStore } from '@/stores/ui-store'
import { css, cx } from '@/styled-system/css'
import { flex, grid } from '@/styled-system/patterns'
import { button, card } from '@/styled-system/recipes'

interface NotificationSchedule {
  days_before: number
  notification_hour: number
  notification_minute: number
}

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
  const [notifications, setNotifications] = useState<NotificationSchedule[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(true)

  useEffect(() => {
    router.prefetch('/')
  }, [router])

  // 알림 설정 불러오기
  useEffect(() => {
    async function loadNotifications() {
      const supabase = createSupabaseBrowser()
      const { data, error } = await supabase
        .from('event_notification_settings')
        .select('days_before, notification_hour, notification_minute')
        .eq('event_id', eventId)
        .order('days_before', { ascending: false })

      if (error) {
        console.error('Failed to load notifications:', error)
      } else if (data) {
        setNotifications(data)
      }
      setLoadingNotifications(false)
    }

    loadNotifications()
  }, [eventId])

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
            href={`/event/edit/${eventId}`}
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
                  <div
                    className={flex({
                      align: 'center',
                      gap: '8px',
                      wrap: 'wrap',
                    })}
                  >
                    <p
                      className={css({
                        fontSize: '16px',
                        fontWeight: '500',
                        color: 'text',
                      })}
                    >
                      {event.lunar_date}
                    </p>
                    {event.calendar_type === 'LUNAR' && event.is_leap_month && (
                      <span
                        className={css({
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: 'warning.100',
                          color: 'warning.700',
                          border: '1px solid',
                          borderColor: 'warning.200',
                        })}
                      >
                        윤달
                      </span>
                    )}
                  </div>
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

        {/* 알림 설정 */}
        <div className={cx(card(), css({ marginBottom: '24px' }))}>
          <div
            className={flex({
              justify: 'space-between',
              align: 'center',
              marginBottom: '16px',
            })}
          >
            <h3
              className={css({
                fontSize: '18px',
                fontWeight: '600',
                margin: 0,
              })}
            >
              알림 설정
            </h3>
            <Link
              href={`/event/edit/${eventId}`}
              className={button({ variant: 'secondary', size: 'sm' })}
            >
              설정하기
            </Link>
          </div>

          {loadingNotifications ? (
            <p className={css({ color: '#666', margin: 0, fontSize: '14px' })}>
              로딩 중...
            </p>
          ) : notifications.length === 0 ? (
            <div
              className={css({
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center',
              })}
            >
              <p
                className={css({
                  margin: 0,
                  fontSize: '14px',
                  color: '#666',
                  marginBottom: '4px',
                })}
              >
                설정된 알림이 없습니다
              </p>
              <p
                className={css({
                  margin: 0,
                  fontSize: '12px',
                  color: '#999',
                })}
              >
                이벤트 편집에서 알림을 추가할 수 있어요
              </p>
            </div>
          ) : (
            <div
              className={css({
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              })}
            >
              {notifications.map((notif, index) => (
                <div
                  key={`${index}-${notif.days_before}-${notif.notification_hour}-${notif.notification_minute}`}
                  className={css({
                    padding: '12px',
                    backgroundColor: '#f0f9f4',
                    border: '1px solid #c3e6cb',
                    borderRadius: '8px',
                    fontSize: '14px',
                  })}
                >
                  🔔{' '}
                  {notif.days_before === 0
                    ? '당일'
                    : `${notif.days_before}일 전`}{' '}
                  {String(notif.notification_hour).padStart(2, '0')}:
                  {String(notif.notification_minute).padStart(2, '0')}
                </div>
              ))}
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
