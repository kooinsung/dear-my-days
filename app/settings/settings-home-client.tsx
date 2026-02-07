'use client'

import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { css, cx } from '@/styled-system/css'
import { flex, vstack } from '@/styled-system/patterns'
import { button, card } from '@/styled-system/recipes'

interface SettingsHomeClientProps {
  user: User
}

function SettingsMenuItem({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className={cx(
        card(),
        css({
          display: 'block',
          padding: '16px',
          textDecoration: 'none',
          color: 'inherit',
        }),
      )}
    >
      <div className={css({ fontSize: '16px', fontWeight: 700 })}>{title}</div>
      <div
        className={css({ fontSize: '13px', color: '#666', marginTop: '6px' })}
      >
        {description}
      </div>
    </Link>
  )
}

export function SettingsHomeClient({ user }: SettingsHomeClientProps) {
  return (
    <div
      className={css({
        minHeight: '100vh',
        backgroundColor: 'background',
      })}
    >
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
              fontSize: '20px',
              fontWeight: 'bold',
              margin: 0,
            })}
          >
            설정
          </h1>
          <Link href="/" className={button({ variant: 'secondary' })}>
            홈으로
          </Link>
        </div>
      </header>

      <main
        className={css({
          maxWidth: '800px',
          margin: '0 auto',
          padding: '24px',
        })}
      >
        <section className={cx(card(), css({ marginBottom: '16px' }))}>
          <h2 className={css({ fontSize: '18px', marginTop: 0 })}>계정</h2>
          <p className={css({ margin: 0, color: '#666' })}>
            {user ? (user.email ?? user.id) : '불러오는 중...'}
          </p>
        </section>

        <section className={vstack({ gap: '12px', alignItems: 'stretch' })}>
          <SettingsMenuItem
            title="구독 관리"
            description="프리미엄 구독을 관리하거나 추가 이벤트 슬롯을 구매할 수 있어요."
            href="/settings/subscription"
          />
          <SettingsMenuItem
            title="연결된 로그인 수단"
            description="Google/Kakao/Naver/Email 연결 상태를 확인하고 연결을 해제할 수 있어요."
            href="/settings/link"
          />
          <SettingsMenuItem
            title="데이터 관리"
            description="내 이벤트 데이터를 내보내거나(추후), 계정 데이터를 정리할 수 있어요."
            href="/settings/data"
          />
          <SettingsMenuItem
            title="알림 설정"
            description="푸시 알림 설정(추후) 및 알림 규칙을 관리할 수 있어요."
            href="/settings/notifications"
          />
          <SettingsMenuItem
            title="계정"
            description="로그아웃/계정 삭제(추후) 등 보안 관련 작업을 할 수 있어요."
            href="/settings/account"
          />
        </section>

        <div
          className={css({
            marginTop: '16px',
            color: '#666',
            fontSize: '12px',
          })}
        >
          * 일부 메뉴는 추후 기능을 추가하면서 활성화할 예정입니다.
        </div>
      </main>
    </div>
  )
}
