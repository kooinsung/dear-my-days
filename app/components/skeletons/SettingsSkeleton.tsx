import { Skeleton } from '@/components/ui/Skeleton'
import { css } from '@/styled-system/css'
import { flex } from '@/styled-system/patterns'

export function SettingsSkeleton() {
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
          <Skeleton width="48px" height="22px" />
          <Skeleton width="64px" height="36px" borderRadius="4px" />
        </div>
      </header>

      <main
        className={css({
          maxWidth: '800px',
          margin: '0 auto',
          padding: '24px',
        })}
      >
        {/* Account section */}
        <div
          className={css({
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          })}
        >
          <Skeleton width="48px" height="20px" />
          <div className={css({ marginTop: '12px' })}>
            <Skeleton width="200px" height="16px" />
          </div>
        </div>

        {/* Menu items */}
        <div
          className={css({
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          })}
        >
          {Array.from({ length: 5 }, (_, idx) => `menu-${idx}`).map((key) => (
            <div
              key={key}
              className={css({
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              })}
            >
              <Skeleton width="100px" height="18px" />
              <div className={css({ marginTop: '6px' })}>
                <Skeleton width="80%" height="14px" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
