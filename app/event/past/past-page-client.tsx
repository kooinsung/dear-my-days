'use client'

import Link from 'next/link'
import { getCategoryIcon, getCategoryLabel } from '@/libs/helpers'
import type { CategoryType, Event } from '@/libs/supabase/database.types'

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
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* 헤더 */}
      <header
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e5e5',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
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
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              margin: 0,
              flex: 1,
              textAlign: 'center',
            }}
          >
            지난 이벤트
          </h1>
          <div style={{ width: '48px' }} />
        </div>
      </header>

      {/* 필터 */}
      <div
        style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e5e5' }}
      >
        <div
          style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 20px' }}
        >
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
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
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid #e5e5e5',
                    textDecoration: 'none',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    backgroundColor: isActive ? '#007bff' : 'white',
                    color: isActive ? 'white' : '#666',
                  }}
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
        style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}
      >
        {Object.keys(groupedEvents).length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              backgroundColor: 'white',
              borderRadius: '8px',
            }}
          >
            <p style={{ fontSize: '18px', color: '#666' }}>
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
                  style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    marginBottom: '16px',
                    color: '#333',
                  }}
                >
                  {yearMonth.replace('.', '년 ')}월
                </h2>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {monthEvents.map((event) => {
                    return (
                      <Link
                        key={event.id}
                        href={`/event/detail?id=${event.id}`}
                        style={{
                          display: 'block',
                          backgroundColor: 'white',
                          padding: '20px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          color: 'inherit',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          transition: 'box-shadow 0.2s',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '12px',
                          }}
                        >
                          <span style={{ fontSize: '32px' }}>
                            {getCategoryIcon(event.category)}
                          </span>
                          <div style={{ flex: 1 }}>
                            <h3
                              style={{
                                fontSize: '18px',
                                fontWeight: 'bold',
                                marginBottom: '4px',
                                color: '#333',
                              }}
                            >
                              {event.title}
                            </h3>
                            <span
                              style={{ fontSize: '12px', color: '#007bff' }}
                            >
                              {getCategoryLabel(event.category)}
                            </span>
                          </div>
                        </div>

                        {event.note && (
                          <p
                            style={{
                              fontSize: '14px',
                              color: '#666',
                              margin: 0,
                            }}
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
