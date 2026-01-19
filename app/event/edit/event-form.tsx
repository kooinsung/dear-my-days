'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useCreateEvent, useEvent, useUpdateEvent } from '@/hooks/use-events'
import type { CalendarType, CategoryType } from '@/libs/supabase/database.types'
import { useUIStore } from '@/stores/ui-store'

interface EventFormProps {
  eventId?: string
}

export default function EventForm({ eventId }: EventFormProps) {
  const router = useRouter()
  const showToast = useUIStore((state) => state.showToast)

  const { data: existingEvent, isLoading: isLoadingEvent } = useEvent(
    eventId || null,
  )

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<CategoryType>('BIRTHDAY')
  const [solarDate, setSolarDate] = useState('')
  const [lunarDate, setLunarDate] = useState('')
  const [calendarType, setCalendarType] = useState<CalendarType>('SOLAR')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (existingEvent) {
      setTitle(existingEvent.title)
      setCategory(existingEvent.category)
      setSolarDate(existingEvent.solar_date)
      setLunarDate(existingEvent.lunar_date || '')
      setCalendarType(existingEvent.calendar_type)
      setNote(existingEvent.note || '')
    }
  }, [existingEvent])

  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()

  const categories: { value: CategoryType; label: string; icon: string }[] = [
    { value: 'BIRTHDAY', label: '생일', icon: '🎂' },
    { value: 'ANNIVERSARY', label: '기념일', icon: '💝' },
    { value: 'MEMORIAL', label: '기일', icon: '🕯️' },
    { value: 'HOLIDAY', label: '공휴일', icon: '🎉' },
    { value: 'OTHER', label: '기타', icon: '📅' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (eventId) {
        await updateEvent.mutateAsync({
          id: eventId,
          updates: {
            title,
            category,
            solar_date: solarDate,
            lunar_date: lunarDate || null,
            calendar_type: calendarType,
            note: note || null,
          },
        })
        showToast('이벤트가 수정되었습니다', 'success')
      } else {
        await createEvent.mutateAsync({
          title,
          category,
          solar_date: solarDate,
          lunar_date: lunarDate || null,
          calendar_type: calendarType,
          note: note || null,
        })
        showToast('이벤트가 생성되었습니다', 'success')
      }

      router.push('/')
      router.refresh()
    } catch (_error) {
      showToast('저장에 실패했습니다', 'error')
    }
  }

  const isSubmitting = createEvent.isPending || updateEvent.isPending

  if (eventId && isLoadingEvent) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}
    >
      {/* 카테고리 */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '12px',
            color: '#333',
          }}
        >
          카테고리
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '12px',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              style={{
                padding: '12px',
                border:
                  category === cat.value
                    ? '2px solid #007bff'
                    : '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: category === cat.value ? '#e7f3ff' : 'white',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '24px' }}>{cat.icon}</span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: category === cat.value ? '600' : '400',
                }}
              >
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 제목 */}
      <div style={{ marginBottom: '24px' }}>
        <label
          htmlFor="title"
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#333',
          }}
        >
          제목 <span style={{ color: '#dc3545' }}>*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 엄마 생일"
          required
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '16px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* 달력 유형 */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '12px',
            color: '#333',
          }}
        >
          달력 유형
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name="calendarType"
              checked={calendarType === 'SOLAR'}
              onChange={() => setCalendarType('SOLAR')}
              style={{ width: '16px', height: '16px' }}
            />
            양력
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name="calendarType"
              checked={calendarType === 'LUNAR'}
              onChange={() => setCalendarType('LUNAR')}
              style={{ width: '16px', height: '16px' }}
            />
            음력
          </label>
        </div>
      </div>

      {/* 양력 날짜 */}
      <div style={{ marginBottom: '24px' }}>
        <label
          htmlFor="solarDate"
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#333',
          }}
        >
          양력 날짜 <span style={{ color: '#dc3545' }}>*</span>
        </label>
        <input
          id="solarDate"
          type="date"
          value={solarDate}
          onChange={(e) => setSolarDate(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '16px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* 음력 날짜 */}
      {calendarType === 'LUNAR' && (
        <div style={{ marginBottom: '24px' }}>
          <label
            htmlFor="lunarDate"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#333',
            }}
          >
            음력 날짜 (선택)
          </label>
          <input
            id="lunarDate"
            type="date"
            value={lunarDate}
            onChange={(e) => setLunarDate(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* 메모 */}
      <div style={{ marginBottom: '24px' }}>
        <label
          htmlFor="note"
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#333',
          }}
        >
          메모 (선택)
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="메모를 입력하세요..."
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '16px',
            minHeight: '100px',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          width: '100%',
          padding: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          opacity: isSubmitting ? 0.6 : 1,
        }}
      >
        {isSubmitting ? '저장 중...' : eventId ? '수정하기' : '저장하기'}
      </button>
    </form>
  )
}
