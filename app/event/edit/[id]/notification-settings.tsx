'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/libs/supabase/browser'
import {
  entryToMinutesBefore,
  minutesBeforeToEntry,
  type NotificationEntry,
} from '@/libs/utils/notification'
import { css, cx } from '@/styled-system/css'
import { flex } from '@/styled-system/patterns'
import { button } from '@/styled-system/recipes'

interface NotificationSettingsProps {
  eventId: string
}

const numberInputStyle = css({
  width: '52px',
  padding: '6px 4px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
  textAlign: 'center',
})

const unitLabelStyle = css({
  fontSize: '14px',
  color: '#333',
  flexShrink: 0,
})

export function NotificationSettings({ eventId }: NotificationSettingsProps) {
  const [entries, setEntries] = useState<NotificationEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadSettings() {
      const supabase = createSupabaseBrowser()
      const { data, error } = await supabase
        .from('event_notification_settings')
        .select('minutes_before')
        .eq('event_id', eventId)

      if (error) {
        console.error('Failed to load notification settings:', error)
        return
      }

      if (data && data.length > 0) {
        setEntries(data.map((d) => minutesBeforeToEntry(d.minutes_before)))
      }
    }

    loadSettings()
  }, [eventId])

  const addEntry = () => {
    setEntries([...entries, { days: 1, hours: 0, minutes: 0 }])
  }

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index))
  }

  const updateEntry = (
    index: number,
    field: keyof NotificationEntry,
    value: number,
  ) => {
    const next = [...entries]
    next[index] = { ...next[index], [field]: value }
    setEntries(next)
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage('')

    try {
      const supabase = createSupabaseBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setMessage('로그인이 필요합니다.')
        return
      }

      const { error: deleteError } = await supabase
        .from('event_notification_settings')
        .delete()
        .eq('event_id', eventId)

      if (deleteError) {
        console.error('Failed to delete old settings:', deleteError)
        setMessage('설정 저장 실패')
        return
      }

      if (entries.length > 0) {
        const { error: insertError } = await supabase
          .from('event_notification_settings')
          .insert(
            entries.map((entry) => ({
              event_id: eventId,
              user_id: user.id,
              minutes_before: entryToMinutesBefore(entry),
            })),
          )

        if (insertError) {
          console.error('Failed to save settings:', insertError)
          setMessage('설정 저장 실패')
          return
        }
      }

      setMessage('알림 설정이 저장되었습니다.')
    } catch (error) {
      console.error('Save error:', error)
      setMessage('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={css({
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        marginTop: '20px',
      })}
    >
      <h3
        className={css({
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '16px',
        })}
      >
        알림 설정
      </h3>

      {message && (
        <div
          className={css({
            padding: '12px',
            marginBottom: '16px',
            backgroundColor: '#d1ecf1',
            color: '#0c5460',
            borderRadius: '4px',
            fontSize: '14px',
          })}
        >
          {message}
        </div>
      )}

      <div
        className={css({
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '16px',
        })}
      >
        {entries.length === 0 ? (
          <div
            className={css({
              padding: '24px',
              textAlign: 'center',
              color: '#666',
              fontSize: '14px',
              backgroundColor: 'white',
              borderRadius: '4px',
            })}
          >
            설정된 알림이 없습니다.
          </div>
        ) : (
          entries.map((entry, index) => (
            <div
              key={`${index}-${entry.days}-${entry.hours}-${entry.minutes}`}
              className={flex({
                align: 'center',
                gap: '6px',
                padding: '10px 12px',
                backgroundColor: 'white',
                borderRadius: '4px',
                flexWrap: 'wrap',
              })}
            >
              <input
                type="number"
                min={0}
                max={14}
                value={entry.days}
                onChange={(e) =>
                  updateEntry(
                    index,
                    'days',
                    Math.max(0, Number(e.target.value)),
                  )
                }
                className={numberInputStyle}
              />
              <span className={unitLabelStyle}>일</span>
              <input
                type="number"
                min={0}
                max={23}
                value={entry.hours}
                onChange={(e) =>
                  updateEntry(
                    index,
                    'hours',
                    Math.max(0, Number(e.target.value)),
                  )
                }
                className={numberInputStyle}
              />
              <span className={unitLabelStyle}>시간</span>
              <input
                type="number"
                min={0}
                max={59}
                value={entry.minutes}
                onChange={(e) =>
                  updateEntry(
                    index,
                    'minutes',
                    Math.max(0, Number(e.target.value)),
                  )
                }
                className={numberInputStyle}
              />
              <span className={unitLabelStyle}>분 전</span>
              <button
                type="button"
                onClick={() => removeEntry(index)}
                className={css({
                  marginLeft: 'auto',
                  padding: '4px 10px',
                  fontSize: '13px',
                  color: '#dc3545',
                  backgroundColor: 'white',
                  border: '1px solid #dc3545',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#dc3545',
                    color: 'white',
                  },
                })}
              >
                삭제
              </button>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={addEntry}
        className={cx(
          button({ variant: 'secondary' }),
          css({
            width: '100%',
            marginBottom: '12px',
          }),
        )}
      >
        + 알림 추가
      </button>

      <button
        type="button"
        onClick={handleSave}
        disabled={loading}
        className={cx(
          button({ variant: 'primary' }),
          css({
            width: '100%',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }),
        )}
      >
        {loading ? '저장 중...' : '알림 설정 저장'}
      </button>

      <p
        className={css({
          marginTop: '12px',
          fontSize: '12px',
          color: '#666',
        })}
      >
        ※ 이벤트 날짜 기준으로 설정한 시간 전에 알림이 발송됩니다.
      </p>
    </div>
  )
}
