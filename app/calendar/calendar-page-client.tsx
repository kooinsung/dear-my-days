'use client'

import Link from 'next/link'
import type { CategoryType } from '@/libs/supabase/database.types'
import { css } from '@/styled-system/css'
import { flex } from '@/styled-system/patterns'
import { card } from '@/styled-system/recipes'

interface MonthData {
  month: number
  name: string
  events: Record<CategoryType, number>
}

interface CalendarPageClientProps {
  monthsData: MonthData[]
  currentYear: number
}

const CATEGORY_COLORS: Record<CategoryType, string> = {
  BIRTHDAY: '#ff6b9d',
  ANNIVERSARY: '#ff6347',
  MEMORIAL: '#6c757d',
  HOLIDAY: '#ffd700',
  OTHER: '#4f46e5',
}

const CATEGORY_LABELS: Record<CategoryType, string> = {
  BIRTHDAY: '생일',
  ANNIVERSARY: '기념일',
  MEMORIAL: '기일',
  HOLIDAY: '공휴일',
  OTHER: '기타',
}

export function CalendarPageClient({
  monthsData,
  currentYear,
}: CalendarPageClientProps) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* 헤더 */}
      <header
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e0e0e0',
          padding: '16px 0',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
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
            ← 홈
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              href={`/calendar?year=${currentYear - 1}`}
              style={{
                padding: '8px 12px',
                color: '#333',
                textDecoration: 'none',
                fontSize: '20px',
              }}
            >
              ◀
            </Link>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              {currentYear}년
            </h1>
            <Link
              href={`/calendar?year=${currentYear + 1}`}
              style={{
                padding: '8px 12px',
                color: '#333',
                textDecoration: 'none',
                fontSize: '20px',
              }}
            >
              ▶
            </Link>
          </div>
          <div style={{ width: '60px' }} />
        </div>
      </header>

      {/* 12개월 그리드 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {monthsData.map((monthData) => {
            const totalEvents = Object.values(monthData.events).reduce(
              (a, b) => a + b,
              0,
            )
            const hasEvents = totalEvents > 0

            return (
              <div key={monthData.month} className={card()}>
                {/* 월 이름 */}
                <h3
                  className={css({
                    fontSize: '20px',
                    fontWeight: 'bold',
                    marginBottom: '16px',
                    color: 'text',
                  })}
                >
                  {monthData.name}
                </h3>

                {/* 이벤트 요약 */}
                <div
                  className={css({
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  })}
                >
                  {hasEvents ? (
                    (
                      Object.entries(monthData.events) as [
                        CategoryType,
                        number,
                      ][]
                    ).map(([category, count]) =>
                      count > 0 ? (
                        <div
                          key={category}
                          className={flex({ align: 'center', gap: '8px' })}
                        >
                          <div
                            className={css({
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: CATEGORY_COLORS[category],
                            })}
                          />
                          <span
                            className={css({
                              flex: 1,
                              fontSize: '14px',
                              color: '#666',
                            })}
                          >
                            {CATEGORY_LABELS[category]}
                          </span>
                          <span
                            className={css({
                              fontSize: '14px',
                              fontWeight: '500',
                              color: 'text',
                            })}
                          >
                            {count}개
                          </span>
                        </div>
                      ) : null,
                    )
                  ) : (
                    <span
                      className={css({
                        fontSize: '14px',
                        color: '#999',
                        textAlign: 'center',
                      })}
                    >
                      이벤트 없음
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
