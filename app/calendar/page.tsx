import Link from 'next/link'
import type { CategoryType, Event } from '@/libs/supabase/database.types'
import { createSupabaseServer } from '@/libs/supabase/server'

// 월별 이벤트 카운트
interface MonthData {
  month: number
  name: string
  events: Record<CategoryType, number>
}

function getMonthData(events: Event[], year: number): MonthData[] {
  const months: MonthData[] = []

  for (let month = 1; month <= 12; month++) {
    const monthData: MonthData = {
      month,
      name: `${month}월`,
      events: {
        BIRTHDAY: 0,
        ANNIVERSARY: 0,
        MEMORIAL: 0,
        HOLIDAY: 0,
        OTHER: 0,
      },
    }

    // 해당 월의 이벤트 카운트
    for (const event of events) {
      const eventDate = new Date(event.solar_date)
      if (
        eventDate.getFullYear() === year &&
        eventDate.getMonth() + 1 === month
      ) {
        monthData.events[event.category]++
      }
    }

    months.push(monthData)
  }

  return months
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const params = await searchParams
  const currentYear = params.year
    ? Number.parseInt(params.year, 10)
    : new Date().getFullYear()

  const supabase = await createSupabaseServer()

  // 해당 년도의 이벤트 조회
  const startDate = `${currentYear}-01-01`
  const endDate = `${currentYear}-12-31`

  const { data: eventsData } = await supabase
    .from('events')
    .select('*')
    .gte('solar_date', startDate)
    .lte('solar_date', endDate)

  const events = eventsData || []
  const monthsData = getMonthData(events, currentYear)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* 헤더 */}
      <header
        style={{
          backgroundColor: 'white',
          padding: '16px',
          borderBottom: '1px solid #e9ecef',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: '14px',
              color: '#6c757d',
              textDecoration: 'none',
            }}
          >
            ← 홈
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              href={`/calendar?year=${currentYear - 1}`}
              style={{
                padding: '6px 12px',
                backgroundColor: '#e9ecef',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#495057',
                fontSize: '14px',
              }}
            >
              ◀
            </Link>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {currentYear}년
            </h1>
            <Link
              href={`/calendar?year=${currentYear + 1}`}
              style={{
                padding: '6px 12px',
                backgroundColor: '#e9ecef',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#495057',
                fontSize: '14px',
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
            gap: '16px',
          }}
        >
          {monthsData.map((monthData) => {
            const totalEvents = Object.values(monthData.events).reduce(
              (a, b) => a + b,
              0,
            )
            const hasEvents = totalEvents > 0

            return (
              <div
                key={monthData.month}
                style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #e9ecef',
                  minHeight: '160px',
                }}
              >
                {/* 월 이름 */}
                <div style={{ marginBottom: '16px' }}>
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#212529',
                    }}
                  >
                    {monthData.name}
                  </h3>
                </div>

                {/* 이벤트 요약 */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {hasEvents ? (
                    <>
                      {monthData.events.BIRTHDAY > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#ff6b9d',
                            }}
                          />
                          <span style={{ fontSize: '14px', color: '#495057' }}>
                            생일 {monthData.events.BIRTHDAY}개
                          </span>
                        </div>
                      )}
                      {monthData.events.ANNIVERSARY > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#ff6347',
                            }}
                          />
                          <span style={{ fontSize: '14px', color: '#495057' }}>
                            기념일 {monthData.events.ANNIVERSARY}개
                          </span>
                        </div>
                      )}
                      {monthData.events.MEMORIAL > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#6c757d',
                            }}
                          />
                          <span style={{ fontSize: '14px', color: '#495057' }}>
                            기일 {monthData.events.MEMORIAL}개
                          </span>
                        </div>
                      )}
                      {monthData.events.HOLIDAY > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#ffd700',
                            }}
                          />
                          <span style={{ fontSize: '14px', color: '#495057' }}>
                            공휴일 {monthData.events.HOLIDAY}개
                          </span>
                        </div>
                      )}
                      {monthData.events.OTHER > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#4f46e5',
                            }}
                          />
                          <span style={{ fontSize: '14px', color: '#495057' }}>
                            기타 {monthData.events.OTHER}개
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: '14px', color: '#adb5bd' }}>
                      이벤트 없음
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 범례 */}
      <div
        style={{
          backgroundColor: 'white',
          borderTop: '1px solid #e9ecef',
          padding: '16px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p
            style={{
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#495057',
            }}
          >
            카테고리
          </p>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#ff6b9d',
                }}
              />
              <span style={{ fontSize: '14px', color: '#495057' }}>생일</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#ff6347',
                }}
              />
              <span style={{ fontSize: '14px', color: '#495057' }}>기념일</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#6c757d',
                }}
              />
              <span style={{ fontSize: '14px', color: '#495057' }}>기일</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#ffd700',
                }}
              />
              <span style={{ fontSize: '14px', color: '#495057' }}>공휴일</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#4f46e5',
                }}
              />
              <span style={{ fontSize: '14px', color: '#495057' }}>기타</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
