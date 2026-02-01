import Link from 'next/link'
import { css, cx } from '@/styled-system/css'
import { flex, vstack } from '@/styled-system/patterns'
import { button, card } from '@/styled-system/recipes'
import { LogoutButton } from './logout-button'

export default async function SettingsAccountPage() {
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
          <h1
            className={css({ fontSize: '20px', fontWeight: 'bold', margin: 0 })}
          >
            계정
          </h1>
          <Link href="/settings" className={button({ variant: 'secondary' })}>
            설정으로
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
          <h2 className={css({ fontSize: '18px', marginTop: 0 })}>계정 작업</h2>
          <LogoutButton />
        </section>

        <section
          className={cx(card(), vstack({ gap: '8px', alignItems: 'stretch' }))}
        >
          <p className={css({ margin: 0, color: '#666' })}>
            이 메뉴는 추후 아래 기능들을 제공할 예정이에요.
          </p>
          <ul
            className={css({ margin: 0, paddingLeft: '18px', color: '#666' })}
          >
            <li>로그아웃/모든 기기 로그아웃</li>
            <li>비밀번호 변경(Email 로그인 사용 시)</li>
            <li>계정 삭제</li>
          </ul>
        </section>
      </main>
    </div>
  )
}
