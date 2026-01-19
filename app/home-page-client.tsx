'use client'

import Link from 'next/link'
import { HomeContent } from './home-content'

export function HomePageClient() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* 헤더 */}
      <header
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e0e0e0',
          padding: '16px 0',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            Dear Days
          </h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link
              href="/event/edit"
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                borderRadius: '4px',
                textDecoration: 'none',
              }}
            >
              + 새 이벤트
            </Link>
            <Link
              href="/calendar"
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                borderRadius: '4px',
                textDecoration: 'none',
              }}
            >
              📅 캘린더
            </Link>
          </div>
        </div>
      </header>

      {/* 콘텐츠 영역 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <HomeContent />
      </div>
    </div>
  )
}
