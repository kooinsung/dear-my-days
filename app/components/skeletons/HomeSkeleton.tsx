import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'
import { css } from '@/styled-system/css'
import { flex } from '@/styled-system/patterns'

export function HomeSkeleton() {
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
            maxWidth: 'container',
            margin: '0 auto',
            padding: '0 24px',
            justify: 'space-between',
            align: 'center',
          })}
        >
          <Skeleton width="120px" height="28px" />
          <div className={css({ display: 'flex', gap: '12px' })}>
            <Skeleton width="80px" height="36px" borderRadius="4px" />
            <Skeleton width="80px" height="36px" borderRadius="4px" />
            <Skeleton width="60px" height="36px" borderRadius="4px" />
          </div>
        </div>
      </header>

      <div
        className={css({
          maxWidth: 'container',
          margin: '0 auto',
          padding: '24px',
        })}
      >
        <div
          className={flex({
            justify: 'space-between',
            align: 'center',
            marginBottom: '24px',
          })}
        >
          <Skeleton width="160px" height="24px" />
          <Skeleton width="120px" height="16px" />
        </div>

        <div
          className={css({
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          })}
        >
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  )
}
