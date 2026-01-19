'use client'

import Link from 'next/link'
import EventForm from './event-form'

export function EventEditPageClient({ eventId }: { eventId?: string }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <header
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e5e5',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <Link
            href={eventId ? `/event/detail?id=${eventId}` : '/'}
            style={{
              color: '#007bff',
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            ← 뒤로
          </Link>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              margin: 0,
              flex: 1,
              textAlign: 'center',
            }}
          >
            {eventId ? '이벤트 수정' : '새 이벤트'}
          </h1>
          <div style={{ width: '48px' }} />
        </div>
      </header>

      <div
        style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 20px' }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <EventForm eventId={eventId} />
        </div>
      </div>
    </div>
  )
}
