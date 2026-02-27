import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'
import { css } from '@/styled-system/css'
import { flex } from '@/styled-system/patterns'

export function PastEventsSkeleton() {
  return (
    <div className={css({ minHeight: '100vh', backgroundColor: 'background' })}>
      <header
        className={css({
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e5e5',
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
          <Skeleton width="48px" height="16px" />
          <div className={css({ flex: 1, textAlign: 'center' })}>
            <Skeleton
              width="100px"
              height="22px"
              className={css({ margin: '0 auto' })}
            />
          </div>
          <div className={css({ width: '48px' })} />
        </div>
      </header>

      {/* Filter */}
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
          <div className={css({ display: 'flex', gap: '8px' })}>
            {Array.from({ length: 4 }, (_, idx) => `filter-${idx}`).map(
              (key) => (
                <Skeleton
                  key={key}
                  width="64px"
                  height="36px"
                  borderRadius="20px"
                />
              ),
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className={css({
          maxWidth: 'container',
          margin: '0 auto',
          padding: '24px 20px',
        })}
      >
        <Skeleton width="100px" height="22px" />
        <div
          className={css({
            marginTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          })}
        >
          <SkeletonCard />
          <SkeletonCard />
        </div>

        <div className={css({ marginTop: '32px' })}>
          <Skeleton width="100px" height="22px" />
          <div
            className={css({
              marginTop: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            })}
          >
            <SkeletonCard />
          </div>
        </div>
      </div>
    </div>
  )
}
