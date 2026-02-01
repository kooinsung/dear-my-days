import Link from 'next/link'
import { css, cx } from '@/styled-system/css'
import { flex, vstack } from '@/styled-system/patterns'
import { button, card } from '@/styled-system/recipes'

export default async function SettingsDataPage() {
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
            데이터 관리
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
        <section
          className={cx(card(), vstack({ gap: '8px', alignItems: 'stretch' }))}
        >
          <p className={css({ margin: 0, color: '#666' })}>
            이 메뉴는 추후 아래 기능들을 제공할 예정이에요.
          </p>
          <ul
            className={css({ margin: 0, paddingLeft: '18px', color: '#666' })}
          >
            <li>이벤트 데이터 내보내기</li>
            <li>데이터 초기화</li>
          </ul>
        </section>
      </main>
    </div>
  )
}
