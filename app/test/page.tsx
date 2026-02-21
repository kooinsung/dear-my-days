'use client'

import Link from 'next/link'
import { css } from '@/styled-system/css'
import { flex } from '@/styled-system/patterns'
import { button, card } from '@/styled-system/recipes'

export default function TestPage() {
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
              fontSize: '24px',
              fontWeight: 'bold',
              margin: 0,
            })}
          >
            테스트 페이지
          </h1>
          <Link href="/login" className={button({ variant: 'secondary' })}>
            로그인으로
          </Link>
        </div>
      </header>

      <div
        className={css({
          maxWidth: '800px',
          margin: '0 auto',
          padding: '24px',
        })}
      >
        <div className={card()}>
          <h2
            className={css({
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '16px',
            })}
          >
            페이지 전환 테스트
          </h2>
          <p
            className={css({
              color: '#666',
              marginBottom: '24px',
              lineHeight: 1.6,
            })}
          >
            이 페이지는 인증이 필요하지 않은 테스트 페이지입니다. SSGOI drill
            애니메이션을 테스트할 수 있습니다.
          </p>

          <div
            className={flex({
              direction: 'column',
              gap: '12px',
            })}
          >
            <Link
              href="/login"
              className={button({ variant: 'primary', size: 'lg' })}
            >
              로그인 페이지로 이동
            </Link>
            <Link
              href="/"
              className={button({ variant: 'secondary', size: 'lg' })}
            >
              홈으로 이동 (로그인 필요)
            </Link>
          </div>
        </div>

        <div
          className={css({
            marginTop: '24px',
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid',
            borderColor: 'border',
          })}
        >
          <h3
            className={css({
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '12px',
            })}
          >
            테스트 정보
          </h3>
          <ul
            className={css({
              color: '#666',
              fontSize: '14px',
              lineHeight: 1.8,
              paddingLeft: '20px',
            })}
          >
            <li>이 페이지는 인증이 필요하지 않습니다</li>
            <li>SSGOI drill 애니메이션이 적용되어 있습니다</li>
            <li>로그인 페이지와의 전환을 테스트할 수 있습니다</li>
            <li>브라우저 뒤로가기 버튼도 테스트해보세요</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
