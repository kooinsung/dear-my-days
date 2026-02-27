import { Skeleton } from '@/components/ui/Skeleton'
import { css } from '@/styled-system/css'

export function CalendarSkeleton() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
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
          <Skeleton width="40px" height="20px" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Skeleton width="32px" height="32px" borderRadius="6px" />
            <Skeleton width="80px" height="24px" />
            <Skeleton width="32px" height="32px" borderRadius="6px" />
          </div>
          <div style={{ width: '60px' }} />
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div
          className={css({
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          })}
        >
          {Array.from({ length: 12 }, (_, idx) => `month-${idx}`).map((key) => (
            <div
              key={key}
              style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #e9ecef',
                minHeight: '160px',
              }}
            >
              <Skeleton width="40px" height="20px" />
              <div
                style={{
                  marginTop: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <Skeleton width="80%" height="14px" />
                <Skeleton width="60%" height="14px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
