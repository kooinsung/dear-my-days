'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/libs/supabase/browser'
import {
  formatMinutesBefore,
  minutesToUnit,
  NOTIFICATION_PRESETS,
  type NotificationUnit,
  UNIT_OPTIONS,
  unitToMinutes,
} from '@/libs/utils/notification'
import { css, cx } from '@/styled-system/css'
import { flex, wrap } from '@/styled-system/patterns'
import { button } from '@/styled-system/recipes'

interface NotificationEntry {
  value: number
  unit: NotificationUnit
}

interface NotificationSettingsProps {
  eventId: string
}

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
        setEntries(data.map((d) => minutesToUnit(d.minutes_before)))
      }
    }

    loadSettings()
  }, [eventId])

  const addEntry = () => {
    setEntries([...entries, { value: 1, unit: 'days' }])
  }

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index))
  }

  const updateEntry = (
    index: number,
    field: 'value' | 'unit',
    newValue: number | NotificationUnit,
  ) => {
    const next = [...entries]
    if (field === 'value') {
      next[index] = { ...next[index], value: newValue as number }
    } else {
      next[index] = { ...next[index], unit: newValue as NotificationUnit }
    }
    setEntries(next)
  }

  const addPreset = (presetMinutes: number) => {
    const alreadyExists = entries.some(
      (e) => unitToMinutes(e.value, e.unit) === presetMinutes,
    )
    if (alreadyExists) {
      return
    }
    setEntries([...entries, minutesToUnit(presetMinutes)])
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
              minutes_before: unitToMinutes(entry.value, entry.unit),
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

      {/* 프리셋 바로가기 */}
      <div className={css({ marginBottom: '16px' })}>
        <p
          className={css({
            fontSize: '13px',
            color: '#666',
            marginBottom: '8px',
          })}
        >
          빠른 추가
        </p>
        <div className={wrap({ gap: '8px' })}>
          {NOTIFICATION_PRESETS.map((preset) => {
            const isActive = entries.some(
              (e) => unitToMinutes(e.value, e.unit) === preset.minutes,
            )
            return (
              <button
                key={preset.minutes}
                type="button"
                onClick={() => addPreset(preset.minutes)}
                disabled={isActive}
                className={css({
                  padding: '6px 12px',
                  fontSize: '13px',
                  borderRadius: '16px',
                  border: '1px solid',
                  cursor: isActive ? 'default' : 'pointer',
                  borderColor: isActive ? 'primary' : '#ddd',
                  backgroundColor: isActive ? 'primary' : 'white',
                  color: isActive ? 'white' : '#333',
                  opacity: isActive ? 0.7 : 1,
                  '&:hover': {
                    borderColor: isActive ? 'primary' : '#bbb',
                  },
                })}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 알림 목록 */}
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
              key={`${index}-${entry.value}-${entry.unit}`}
              className={flex({
                align: 'center',
                gap: '8px',
                padding: '10px 12px',
                backgroundColor: 'white',
                borderRadius: '4px',
              })}
            >
              <input
                type="number"
                min={1}
                max={
                  entry.unit === 'days'
                    ? 14
                    : entry.unit === 'hours'
                      ? 336
                      : 20160
                }
                value={entry.value}
                onChange={(e) =>
                  updateEntry(
                    index,
                    'value',
                    Math.max(1, Number(e.target.value)),
                  )
                }
                className={css({
                  width: '70px',
                  padding: '4px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  textAlign: 'center',
                })}
              />
              <select
                value={entry.unit}
                onChange={(e) =>
                  updateEntry(index, 'unit', e.target.value as NotificationUnit)
                }
                className={css({
                  padding: '4px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                })}
              >
                {UNIT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span
                className={css({ fontSize: '13px', color: '#999', flex: 1 })}
              >
                ({formatMinutesBefore(unitToMinutes(entry.value, entry.unit))})
              </span>
              <button
                type="button"
                onClick={() => removeEntry(index)}
                className={css({
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
        + 직접 추가
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
        ※ 이벤트 날짜 기준으로 선택한 시간 전에 알림이 발송됩니다.
      </p>
    </div>
  )
}
