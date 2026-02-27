import { Skeleton } from '@/components/ui/Skeleton'
import { css } from '@/styled-system/css'
import { flex } from '@/styled-system/patterns'

export function EventDetailSkeleton() {
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
          <Skeleton width="48px" height="16px" />
          <Skeleton width="48px" height="32px" borderRadius="4px" />
        </div>
      </header>

      <div
        className={css({
          maxWidth: '800px',
          margin: '0 auto',
          padding: '24px',
        })}
      >
        {/* D-day card */}
        <div
          className={css({
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '40px',
            marginBottom: '24px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          })}
        >
          <Skeleton width="120px" height="14px" />
          <Skeleton width="100px" height="48px" />
          <Skeleton width="100px" height="14px" />
          <Skeleton width="180px" height="28px" />
        </div>

        {/* Detail card */}
        <div
          className={css({
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          })}
        >
          <Skeleton width="60px" height="14px" />
          <div className={css({ marginTop: '8px', marginBottom: '24px' })}>
            <Skeleton width="100px" height="32px" borderRadius="20px" />
          </div>
          <Skeleton width="60px" height="14px" />
          <div className={css({ marginTop: '12px' })}>
            <Skeleton width="140px" height="18px" />
            <div className={css({ marginTop: '12px' })}>
              <Skeleton width="140px" height="18px" />
            </div>
          </div>
        </div>

        {/* Delete button */}
        <Skeleton width="100%" height="48px" borderRadius="4px" />
      </div>
    </div>
  )
}
