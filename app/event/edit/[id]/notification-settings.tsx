'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/libs/supabase/browser'
import { css, cx } from '@/styled-system/css'
import { vstack } from '@/styled-system/patterns'
import { button } from '@/styled-system/recipes'

interface NotificationSchedule {
  days_before: number // 이벤트 며칠 전 (0 = 당일)
  hour: number // 0-23
  minute: number // 0-59
}

interface NotificationSettingsProps {
  eventId: string
}

export function NotificationSettings({ eventId }: NotificationSettingsProps) {
  const [schedules, setSchedules] = useState<NotificationSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // 기존 설정 불러오기
  useEffect(() => {
    async function loadSettings() {
      const supabase = createSupabaseBrowser()
      const { data, error } = await supabase
        .from('event_notification_settings')
        .select('days_before, notification_hour, notification_minute')
        .eq('event_id', eventId)

      if (error) {
        console.error('Failed to load notification settings:', error)
        return
      }

      if (data && data.length > 0) {
        const loaded = data.map((d) => ({
          days_before: d.days_before,
          hour: d.notification_hour,
          minute: d.notification_minute,
        }))
        setSchedules(loaded)
      }
    }

    loadSettings()
  }, [eventId])

  const addSchedule = () => {
    setSchedules([...schedules, { days_before: 1, hour: 9, minute: 0 }])
  }

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index))
  }

  const updateSchedule = (
    index: number,
    field: keyof NotificationSchedule,
    value: number,
  ) => {
    const newSchedules = [...schedules]
    newSchedules[index] = {
      ...newSchedules[index],
      [field]: value,
    }
    setSchedules(newSchedules)
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

      // 기존 알림 스케줄 삭제
      const { error: deleteError } = await supabase
        .from('event_notification_settings')
        .delete()
        .eq('event_id', eventId)

      if (deleteError) {
        console.error('Failed to delete old settings:', deleteError)
        setMessage('설정 저장 실패')
        return
      }

      // 모든 알림 스케줄 저장
      if (schedules.length > 0) {
        const { error: insertError } = await supabase
          .from('event_notification_settings')
          .insert(
            schedules.map((schedule) => ({
              event_id: eventId,
              user_id: user.id,
              days_before: schedule.days_before,
              notification_hour: schedule.hour,
              notification_minute: schedule.minute,
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

      <div className={vstack({ gap: '12px', marginBottom: '16px' })}>
        {schedules.length === 0 ? (
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
            설정된 알림이 없습니다. 알림을 추가해주세요.
          </div>
        ) : (
          schedules.map((schedule, index) => (
            <div
              key={`${index}-${schedule.days_before}-${schedule.hour}-${schedule.minute}`}
              className={css({
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                backgroundColor: 'white',
                borderRadius: '4px',
              })}
            >
              <span className={css({ fontSize: '14px', minWidth: '30px' })}>
                D-
              </span>
              <input
                type="number"
                min={0}
                max={365}
                value={schedule.days_before}
                onChange={(e) =>
                  updateSchedule(index, 'days_before', Number(e.target.value))
                }
                className={css({
                  width: '70px',
                  padding: '4px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                })}
              />
              <span className={css({ fontSize: '14px' })}>일</span>
              <input
                type="number"
                min={0}
                max={23}
                value={schedule.hour}
                onChange={(e) =>
                  updateSchedule(index, 'hour', Number(e.target.value))
                }
                className={css({
                  width: '60px',
                  padding: '4px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                })}
              />
              <span className={css({ fontSize: '14px' })}>시</span>
              <input
                type="number"
                min={0}
                max={59}
                value={schedule.minute}
                onChange={(e) =>
                  updateSchedule(index, 'minute', Number(e.target.value))
                }
                className={css({
                  width: '60px',
                  padding: '4px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                })}
              />
              <span className={css({ fontSize: '14px' })}>분</span>
              <button
                type="button"
                onClick={() => removeSchedule(index)}
                className={css({
                  marginLeft: 'auto',
                  padding: '4px 12px',
                  fontSize: '14px',
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
        onClick={addSchedule}
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
        ※ 알림은 매년 해당 날짜에 자동으로 발송됩니다.
      </p>
    </div>
  )
}
