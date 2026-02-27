'use client'

import Link from 'next/link'
import { HomeSkeleton } from '@/components/skeletons/HomeSkeleton'
import { useUpcomingEvents } from '@/hooks/use-events'
import { usePushSetup } from '@/hooks/use-push-setup'
import { css, cx } from '@/styled-system/css'
import { HStack } from '@/styled-system/jsx'
import { flex } from '@/styled-system/patterns'
import { button, pageContainer } from '@/styled-system/recipes'
import { HomeContent } from './home-content'

export function HomePageClient() {
  usePushSetup()
  const { data: upcomingEvents, isLoading } = useUpcomingEvents()

  if (isLoading) {
    return <HomeSkeleton />
  }

  return (
    <div
      className={css({
        minHeight: '100vh',
        backgroundColor: 'background',
      })}
    >
      {/* 헤더 */}
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
          <h1
            className={css({
              fontSize: '24px',
              fontWeight: 'bold',
              margin: 0,
            })}
          >
            Dear Days
          </h1>
          <HStack gap={12}>
            <Link href="/event/new" className={button({ variant: 'primary' })}>
              + 새 이벤트
            </Link>
            <Link
              href="/calendar"
              className={cx(
                button({ variant: 'secondary' }),
                css({ backgroundColor: '#6c757d', color: 'white' }),
              )}
            >
              📅 캘린더
            </Link>
            <Link href="/settings" className={button({ variant: 'secondary' })}>
              설정
            </Link>
          </HStack>
        </div>
      </header>

      {/* 콘텐츠 영역 */}
      <div className={cx(pageContainer(), css({ paddingTop: '24px' }))}>
        <HomeContent upcomingEvents={upcomingEvents ?? []} />
      </div>
    </div>
  )
}
