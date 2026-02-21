'use client'

import Link from 'next/link'
import { getCategoryIcon, getCategoryLabel } from '@/libs/helpers'
import type { CategoryType, Event } from '@/libs/supabase/database.types'
import { css, cx } from '@/styled-system/css'
import { flex, grid, hstack } from '@/styled-system/patterns'

interface PastPageClientProps {
  events: Event[]
  filterCategory?: CategoryType
  groupedEvents: Record<string, Event[]>
}

export function PastPageClient({
  groupedEvents,
  filterCategory,
}: PastPageClientProps) {
  const categories: { value: CategoryType | 'ALL'; label: string }[] = [
    { value: 'ALL', label: '전체' },
    { value: 'BIRTHDAY', label: '생일' },
    { value: 'ANNIVERSARY', label: '기념일' },
    { value: 'MEMORIAL', label: '기일' },
  ]

  return (
    <div className={css({ minHeight: '100vh', backgroundColor: 'background' })}>
      {/* 헤더 */}
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
            maxWidth: 'container',
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
            지난 이벤트
          </h1>
          <div className={css({ width: '48px' })} />
        </div>
      </header>

      {/* 필터 */}
      <div
        className={css({
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e5e5',
        })}
      >
        <div
          className={css({
            maxWidth: 'container',
            margin: '0 auto',
            padding: '16px 20px',
          })}
        >
          <div
            className={cx(hstack({ gap: '8px' }), css({ overflowX: 'auto' }))}
          >
            {categories.map((cat) => {
              const isActive =
                (cat.value === 'ALL' && !filterCategory) ||
                cat.value === filterCategory

              return (
                <Link
                  key={cat.value}
                  href={
                    cat.value === 'ALL'
                      ? '/event/past'
                      : `/event/past?category=${cat.value}`
                  }
                  className={css({
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid #e5e5e5',
                    textDecoration: 'none',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    backgroundColor: isActive ? 'primary' : 'white',
                    color: isActive ? 'white' : '#666',
                  })}
                >
                  {cat.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div
        className={css({
          maxWidth: 'container',
          margin: '0 auto',
          padding: '24px 20px',
        })}
      >
        {Object.keys(groupedEvents).length === 0 ? (
          <div
            className={css({
              padding: '60px 20px',
              textAlign: 'center',
              backgroundColor: 'white',
              borderRadius: '8px',
            })}
          >
            <p className={css({ fontSize: '18px', color: '#666' })}>
              지난 이벤트가 없습니다
            </p>
          </div>
        ) : (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
          >
            {Object.entries(groupedEvents).map(([yearMonth, monthEvents]) => (
              <div key={yearMonth}>
                <h2
                  className={css({
                    fontSize: '20px',
                    fontWeight: 'bold',
                    marginBottom: '16px',
                    color: 'text',
                  })}
                >
                  {yearMonth.replace('.', '년 ')}월
                </h2>

                <div
                  className={grid({
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '16px',
                  })}
                >
                  {monthEvents.map((event) => {
                    return (
                      <Link
                        key={event.id}
                        href={`/event/detail?id=${event.id}`}
                        className={css({
                          display: 'block',
                          backgroundColor: 'white',
                          padding: '20px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          color: 'inherit',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          transition: 'box-shadow 0.2s',
                          _hover: {
                            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                          },
                        })}
                      >
                        <div
                          className={cx(
                            flex({
                              align: 'center',
                              gap: '12px',
                            }),
                            css({ marginBottom: '12px' }),
                          )}
                        >
                          <span className={css({ fontSize: '32px' })}>
                            {getCategoryIcon(event.category)}
                          </span>
                          <div className={css({ flex: 1 })}>
                            <h3
                              className={css({
                                fontSize: '18px',
                                fontWeight: 'bold',
                                marginBottom: '4px',
                                color: 'text',
                              })}
                            >
                              {event.title}
                            </h3>
                            <span
                              className={css({
                                fontSize: '12px',
                                color: 'primary',
                              })}
                            >
                              {getCategoryLabel(event.category)}
                            </span>
                          </div>
                        </div>

                        {event.note && (
                          <p
                            className={css({
                              fontSize: '14px',
                              color: '#666',
                              margin: 0,
                            })}
                          >
                            {event.note}
                          </p>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
