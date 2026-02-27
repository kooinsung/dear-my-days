import { css, cx } from '@/styled-system/css'

const pulseAnimation = css({
  animation: 'pulse 1.5s ease-in-out infinite',
})

const skeletonBase = css({
  backgroundColor: '#e5e5e5',
  borderRadius: '4px',
})

export function Skeleton({
  width,
  height,
  borderRadius,
  className,
}: {
  width?: string
  height?: string
  borderRadius?: string
  className?: string
}) {
  return (
    <div
      className={cx(skeletonBase, pulseAnimation, className)}
      style={{ width: width ?? '100%', height: height ?? '16px', borderRadius }}
    />
  )
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div
      className={cx(
        css({ display: 'flex', flexDirection: 'column', gap: '8px' }),
        className,
      )}
    >
      {Array.from({ length: lines }, (_, idx) => idx).map((idx) => (
        <Skeleton
          key={`line-${idx}`}
          width={idx === lines - 1 ? '60%' : '100%'}
          height="14px"
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        css({
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid',
          borderColor: 'border',
        }),
        className,
      )}
    >
      <div
        className={css({ display: 'flex', gap: '16px', alignItems: 'center' })}
      >
        <Skeleton width="48px" height="48px" borderRadius="8px" />
        <div className={css({ flex: 1 })}>
          <Skeleton width="60%" height="18px" />
          <div className={css({ marginTop: '8px' })}>
            <Skeleton width="40%" height="14px" />
          </div>
        </div>
      </div>
    </div>
  )
}
