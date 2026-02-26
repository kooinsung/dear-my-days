'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useCreateEvent, useEvent, useUpdateEvent } from '@/hooks/use-events'
import { createSupabaseBrowser } from '@/libs/supabase/browser'
import type { CalendarType, CategoryType } from '@/libs/supabase/database.types'
import {
  entryToMinutesBefore,
  type NotificationEntry,
} from '@/libs/utils/notification'
import { useUIStore } from '@/stores/ui-store'
import { css, cx } from '@/styled-system/css'
import { flex, grid, hstack } from '@/styled-system/patterns'
import {
  button,
  categoryButton,
  formField,
  input,
  label,
  textarea,
} from '@/styled-system/recipes'

interface EventFormProps {
  eventId?: string
  showNotifications?: boolean
}

type LunarToSolarCandidateDto = {
  solarYear: number
  solarMonth: number
  solarDay: number
  isLeapMonth: boolean
}

type LunarToSolarCandidatesResponse = {
  candidates: LunarToSolarCandidateDto[]
}

type ApiErrorShape = { error?: string }

function fmtYmdLocal(parts: {
  year: number
  month: number
  day: number
}): string {
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

export default function EventForm({
  eventId,
  showNotifications = false,
}: EventFormProps) {
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
  const [notifEntries, setNotifEntries] = useState<NotificationEntry[]>([])

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

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [convertCandidates, setConvertCandidates] = useState<
    LunarToSolarCandidateDto[]
  >([])
  const [pickedLeap, setPickedLeap] = useState<boolean>(false)

  const pickedSolarDate = useMemo(() => {
    const picked =
      convertCandidates.find((c) => c.isLeapMonth === pickedLeap) ??
      convertCandidates[0]
    if (!picked) {
      return ''
    }
    return fmtYmdLocal({
      year: picked.solarYear,
      month: picked.solarMonth,
      day: picked.solarDay,
    })
  }, [convertCandidates, pickedLeap])

  async function fetchLunarToSolarCandidates(dateYmd: string) {
    const [y, m, d] = dateYmd.split('-').map((v) => Number(v))
    if (!y || !m || !d) {
      throw new Error('음력 날짜 형식이 올바르지 않습니다')
    }

    const res = await fetch(
      `/api/lunar/lunar-to-solar?year=${y}&month=${m}&day=${d}`,
      { method: 'GET' },
    )

    const json = (await res.json().catch(() => ({}))) as unknown
    if (!res.ok) {
      const errorMsg =
        json && typeof json === 'object' && 'error' in json
          ? String((json as ApiErrorShape).error ?? '변환에 실패했습니다')
          : '변환에 실패했습니다'
      throw new Error(errorMsg)
    }

    const data = json as LunarToSolarCandidatesResponse
    return data.candidates ?? []
  }

  async function saveNotifications(createdEventId: string) {
    if (notifEntries.length === 0) {
      return
    }

    const supabase = createSupabaseBrowser()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return
    }

    const { error } = await supabase.from('event_notification_settings').insert(
      notifEntries.map((entry) => ({
        event_id: createdEventId,
        user_id: user.id,
        minutes_before: entryToMinutesBefore(entry),
      })),
    )

    if (error) {
      console.error('Failed to save notifications:', error)
      showToast('알림 설정 저장에 실패했습니다', 'error')
    }
  }

  async function saveWithChoice(choiceIsLeapMonth: boolean) {
    const basePayload = {
      title,
      category,
      note: note || null,
    }

    let createdEventId: string | undefined

    if (eventId) {
      if (calendarType === 'LUNAR') {
        await updateEvent.mutateAsync({
          id: eventId,
          updates: {
            ...basePayload,
            calendar_type: 'LUNAR',
            lunar_date: lunarDate || null,
            is_leap_month: choiceIsLeapMonth,
          },
        })
      } else {
        await updateEvent.mutateAsync({
          id: eventId,
          updates: {
            ...basePayload,
            calendar_type: 'SOLAR',
            solar_date: solarDate,
          },
        })
      }
      showToast('이벤트가 수정되었습니다', 'success')
    } else {
      let result: { id: string }
      if (calendarType === 'LUNAR') {
        result = await createEvent.mutateAsync({
          ...basePayload,
          calendar_type: 'LUNAR',
          lunar_date: lunarDate || null,
          is_leap_month: choiceIsLeapMonth,
        })
      } else {
        result = await createEvent.mutateAsync({
          ...basePayload,
          calendar_type: 'SOLAR',
          solar_date: solarDate,
        })
      }
      createdEventId = result.id

      // 새 이벤트 생성 시 알림 설정 저장
      if (createdEventId && showNotifications) {
        await saveNotifications(createdEventId)
      }

      showToast('이벤트가 생성되었습니다', 'success')
    }

    router.push('/')
    router.refresh()
  }

  const addNotifEntry = () => {
    setNotifEntries([...notifEntries, { days: 1, hours: 0, minutes: 0 }])
  }

  const removeNotifEntry = (index: number) => {
    setNotifEntries(notifEntries.filter((_, i) => i !== index))
  }

  const updateNotifEntry = (
    index: number,
    field: keyof NotificationEntry,
    value: number,
  ) => {
    const next = [...notifEntries]
    next[index] = { ...next[index], [field]: value }
    setNotifEntries(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (calendarType === 'LUNAR') {
        // 1) 후보 조회
        const candidates = await fetchLunarToSolarCandidates(lunarDate)

        if (!candidates.length) {
          throw new Error('변환 결과가 없습니다')
        }

        // 2) 후보가 1개면 바로 저장 (윤달 정보가 있으면 그 값을 사용)
        if (candidates.length === 1) {
          await saveWithChoice(candidates[0].isLeapMonth)
          return
        }

        // 3) 후보가 여러개면 팝업으로 확인/선택
        setConvertCandidates(candidates)
        // 기본 선택: 윤달 후보가 있으면 윤달을 기본으로(요구사항 3), 없으면 첫 후보
        const hasLeap = candidates.some((c) => c.isLeapMonth)
        setPickedLeap(hasLeap)
        setIsConfirmOpen(true)
        return
      }

      // SOLAR는 기존처럼 바로 저장
      await saveWithChoice(false)
    } catch (error) {
      console.error(error)
      showToast(
        error instanceof Error ? error.message : '저장에 실패했습니다',
        'error',
      )
    }
  }

  const isSubmitting = createEvent.isPending || updateEvent.isPending

  if (eventId && isLoadingEvent) {
    return (
      <div className={css({ padding: '40px', textAlign: 'center' })}>
        로딩 중...
      </div>
    )
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={css({
          maxWidth: '600px',
          margin: '0 auto',
          padding: '24px',
        })}
      >
        {/* 카테고리 */}
        <div className={formField()}>
          <div className={label()}>카테고리</div>
          <div
            className={grid({
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '12px',
            })}
          >
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={categoryButton({ selected: category === cat.value })}
              >
                <span className={css({ fontSize: '24px' })}>{cat.icon}</span>
                <span
                  className={css({
                    fontSize: '12px',
                    fontWeight: category === cat.value ? '600' : '400',
                  })}
                >
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div className={formField()}>
          <label htmlFor="title" className={label()}>
            제목 <span className={css({ color: 'danger' })}>*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 엄마 생일"
            required
            className={input()}
          />
        </div>

        {/* 달력 유형 */}
        <div className={formField()}>
          <div className={label()}>달력 유형</div>
          <div className={hstack({ gap: '16px' })}>
            <label
              className={flex({
                align: 'center',
                gap: '8px',
                cursor: 'pointer',
              })}
            >
              <input
                type="radio"
                name="calendarType"
                checked={calendarType === 'SOLAR'}
                onChange={() => setCalendarType('SOLAR')}
                className={css({ width: '16px', height: '16px' })}
              />
              양력
            </label>
            <label
              className={flex({
                align: 'center',
                gap: '8px',
                cursor: 'pointer',
              })}
            >
              <input
                type="radio"
                name="calendarType"
                checked={calendarType === 'LUNAR'}
                onChange={() => setCalendarType('LUNAR')}
                className={css({ width: '16px', height: '16px' })}
              />
              음력
            </label>
          </div>
        </div>

        {/* 양력 날짜 */}
        {calendarType === 'SOLAR' && (
          <div className={formField()}>
            <label htmlFor="solarDate" className={label()}>
              양력 날짜 <span className={css({ color: 'danger' })}>*</span>
            </label>
            <input
              id="solarDate"
              type="date"
              value={solarDate}
              onChange={(e) => setSolarDate(e.target.value)}
              required
              className={input()}
            />
          </div>
        )}

        {/* 음력 날짜 */}
        {calendarType === 'LUNAR' && (
          <>
            <div className={formField()}>
              <label htmlFor="lunarDate" className={label()}>
                음력 날짜 <span className={css({ color: 'danger' })}>*</span>
              </label>
              <input
                id="lunarDate"
                type="date"
                value={lunarDate}
                onChange={(e) => setLunarDate(e.target.value)}
                required
                className={input()}
              />
            </div>

            {/* 윤달 체크 UI는 후보 기반 선택으로 대체되어 기본적으로 숨깁니다.
                (필요하면 '고급' 옵션으로 다시 노출 가능) */}
          </>
        )}

        {/* 메모 */}
        <div className={formField()}>
          <label htmlFor="note" className={label()}>
            메모 (선택)
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="메모를 입력하세요..."
            className={textarea()}
          />
        </div>

        {/* 알림 설정 (새 이벤트 생성 시에만 표시) */}
        {showNotifications && (
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
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '12px',
              })}
            >
              알림 설정 (선택)
            </h3>

            {/* 알림 목록 */}
            <div
              className={css({
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '16px',
              })}
            >
              {notifEntries.length === 0 ? (
                <div
                  className={css({
                    padding: '16px',
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                  })}
                >
                  알림을 추가하면 이벤트 전에 자동으로 알려드려요
                </div>
              ) : (
                notifEntries.map((entry, index) => (
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
                        updateNotifEntry(
                          index,
                          'days',
                          Math.max(0, Number(e.target.value)),
                        )
                      }
                      className={css({
                        width: '52px',
                        padding: '6px 4px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        textAlign: 'center',
                      })}
                    />
                    <span className={css({ fontSize: '14px' })}>일</span>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={entry.hours}
                      onChange={(e) =>
                        updateNotifEntry(
                          index,
                          'hours',
                          Math.max(0, Number(e.target.value)),
                        )
                      }
                      className={css({
                        width: '52px',
                        padding: '6px 4px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        textAlign: 'center',
                      })}
                    />
                    <span className={css({ fontSize: '14px' })}>시간</span>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={entry.minutes}
                      onChange={(e) =>
                        updateNotifEntry(
                          index,
                          'minutes',
                          Math.max(0, Number(e.target.value)),
                        )
                      }
                      className={css({
                        width: '52px',
                        padding: '6px 4px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        textAlign: 'center',
                      })}
                    />
                    <span className={css({ fontSize: '14px' })}>분 전</span>
                    <button
                      type="button"
                      onClick={() => removeNotifEntry(index)}
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
              onClick={addNotifEntry}
              className={cx(
                button({ variant: 'secondary' }),
                css({
                  width: '100%',
                  marginBottom: '8px',
                }),
              )}
            >
              + 알림 추가
            </button>

            <p
              className={css({
                marginTop: '8px',
                fontSize: '12px',
                color: '#666',
              })}
            >
              ※ 이벤트 날짜 기준으로 선택한 시간 전에 알림이 발송됩니다.
            </p>
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={cx(
            button({ variant: 'primary', size: 'lg' }),
            css({
              width: '100%',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1,
            }),
          )}
        >
          {isSubmitting ? '저장 중...' : eventId ? '수정하기' : '저장하기'}
        </button>
      </form>

      {/* 변환 결과 확인 팝업 */}
      {isConfirmOpen && (
        <div
          className={css({
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          })}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={css({
              width: '100%',
              maxWidth: '420px',
              background: 'white',
              borderRadius: '12px',
              padding: '16px',
            })}
          >
            <div className={css({ fontSize: '16px', fontWeight: 600 })}>
              양력 변환 결과 확인
            </div>

            <div
              className={css({
                marginTop: '8px',
                fontSize: '13px',
                color: 'gray.700',
              })}
            >
              음력: {lunarDate}
            </div>

            <div
              className={css({
                marginTop: '12px',
                display: 'grid',
                gap: '8px',
              })}
            >
              {convertCandidates.map((c) => {
                const labelText = `${fmtYmdLocal({ year: c.solarYear, month: c.solarMonth, day: c.solarDay })} ${c.isLeapMonth ? '(윤달)' : '(평달)'}`
                return (
                  <label
                    key={`${c.solarYear}-${c.solarMonth}-${c.solarDay}-${String(c.isLeapMonth)}`}
                    className={flex({
                      align: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    })}
                  >
                    <input
                      type="radio"
                      name="lunarCandidate"
                      checked={pickedLeap === c.isLeapMonth}
                      onChange={() => setPickedLeap(c.isLeapMonth)}
                      className={css({ width: '16px', height: '16px' })}
                    />
                    <span className={css({ fontSize: '14px' })}>
                      {labelText}
                    </span>
                  </label>
                )
              })}
            </div>

            <div
              className={css({
                marginTop: '12px',
                fontSize: '12px',
                color: 'gray.600',
              })}
            >
              선택한 양력 날짜: {pickedSolarDate}
            </div>

            <div
              className={css({
                marginTop: '16px',
                display: 'flex',
                gap: '8px',
              })}
            >
              <button
                type="button"
                className={cx(
                  button({ variant: 'secondary', size: 'md' }),
                  css({ flex: 1 }),
                )}
                onClick={() => {
                  setIsConfirmOpen(false)
                }}
              >
                취소
              </button>
              <button
                type="button"
                className={cx(
                  button({ variant: 'primary', size: 'md' }),
                  css({ flex: 1 }),
                )}
                disabled={isSubmitting}
                onClick={async () => {
                  try {
                    // 모달 닫기 → 저장
                    setIsConfirmOpen(false)
                    await saveWithChoice(pickedLeap)
                  } catch (error) {
                    console.error(error)
                    showToast('저장에 실패했습니다', 'error')
                  }
                }}
              >
                이대로 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
