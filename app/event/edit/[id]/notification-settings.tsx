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
  enabled: boolean
}

interface NotificationSettingsProps {
  eventId: string
}

export function NotificationSettings({ eventId }: NotificationSettingsProps) {
  const supabase = createSupabaseBrowser()
  const [schedules, setSchedules] = useState<NotificationSchedule[]>([
    { days_before: 7, hour: 9, minute: 0, enabled: true }, // D-7일 오전 9:00
    { days_before: 3, hour: 9, minute: 0, enabled: true }, // D-3일 오전 9:00
    { days_before: 1, hour: 9, minute: 0, enabled: true }, // D-1일 오전 9:00
    { days_before: 0, hour: 9, minute: 0, enabled: true }, // 당일 오전 9:00
  ])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // 기존 설정 불러오기
  useEffect(() => {
    async function loadSettings() {
      const { data, error } = await supabase
        .from('event_notification_settings')
        .select('days_before, notification_hour, notification_minute')
        .eq('event_id', eventId)

      if (error) {
        console.error('Failed to load notification settings:', error)
        return
      }

      if (data && data.length > 0) {
        // 기존 설정이 있으면 활성화
        const loaded = schedules.map((schedule) => {
          const found = data.find((d) => d.days_before === schedule.days_before)
          if (found) {
            return {
              days_before: schedule.days_before,
              hour: found.notification_hour,
              minute: found.notification_minute,
              enabled: true,
            }
          }
          return { ...schedule, enabled: false }
        })
        setSchedules(loaded)
      }
    }

    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, schedules.map, supabase.from])

  const handleSave = async () => {
    setLoading(true)
    setMessage('')

    try {
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

      // 활성화된 알림만 저장
      const activeSchedules = schedules.filter((s) => s.enabled)
      if (activeSchedules.length > 0) {
        const { error: insertError } = await supabase
          .from('event_notification_settings')
          .insert(
            activeSchedules.map((schedule) => ({
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

  const updateSchedule = (
    index: number,
    field: keyof NotificationSchedule,
    value: number | boolean,
  ) => {
    const newSchedules = [...schedules]
    newSchedules[index] = {
      ...newSchedules[index],
      [field]: value,
    }
    setSchedules(newSchedules)
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
        {schedules.map((schedule, index) => (
          <div
            key={`${schedule.days_before}-${schedule.hour}-${schedule.minute}`}
            className={css({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              backgroundColor: 'white',
              borderRadius: '4px',
            })}
          >
            <input
              type="checkbox"
              checked={schedule.enabled}
              onChange={(e) =>
                updateSchedule(index, 'enabled', e.target.checked)
              }
              className={css({
                width: '20px',
                height: '20px',
                cursor: 'pointer',
              })}
            />
            <span
              className={css({
                minWidth: '60px',
                fontSize: '14px',
              })}
            >
              {schedule.days_before === 0
                ? '당일'
                : `D-${schedule.days_before}일`}
            </span>
            <input
              type="number"
              min={0}
              max={23}
              value={schedule.hour}
              onChange={(e) =>
                updateSchedule(index, 'hour', Number(e.target.value))
              }
              disabled={!schedule.enabled}
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
              disabled={!schedule.enabled}
              className={css({
                width: '60px',
                padding: '4px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              })}
            />
            <span className={css({ fontSize: '14px' })}>분</span>
          </div>
        ))}
      </div>

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
