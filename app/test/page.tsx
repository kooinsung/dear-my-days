'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createSupabaseBrowser } from '@/lips/supabase/browser'

type Event = {
  id: string
  title: string
  event_date: string
  category: string
}

type UserPlan = {
  plan_type: 'FREE' | 'PRO'
  started_at: string
  expired_at: string | null
}

type UserInfo = {
  id: string
  email?: string
}

export default function DbTestPage() {
  const supabase = useMemo(() => createSupabaseBrowser(), [])

  const [events, setEvents] = useState<Event[]>([])
  const [plan, setPlan] = useState<UserPlan | null>(null)
  const [message, setMessage] = useState<string>('')
  const [user, setUser] = useState<UserInfo | null>(null)

  const fetchUser = useCallback(async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      setUser(null)
      return
    }

    setUser({ id: user.id, email: user.email })
  }, [supabase])

  /* -----------------------------
   * events SELECT
   * ----------------------------*/
  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, event_date, category')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(`❌ events 조회 실패: ${error.message}`)
      return
    }

    setEvents(data)
    setMessage('✅ events 조회 성공')
  }, [supabase])
  /* -----------------------------
   * events INSERT
   * ----------------------------*/
  const insertEvent = useCallback(async () => {
    const { error } = await supabase.from('events').insert({
      title: 'DB 테스트 이벤트',
      category: 'BIRTHDAY',
      event_date: '1993-03-15',
      calendar_type: 'SOLAR',
    })

    if (error) {
      setMessage(`❌ events insert 실패: ${error.message}`)
      return
    }

    setMessage('✅ events insert 성공')
    fetchEvents()
  }, [supabase, fetchEvents])

  /* -----------------------------
   * user_plans SELECT
   * ----------------------------*/
  const fetchUserPlan = useCallback(async () => {
    const { data, error } = await supabase
      .from('user_plans')
      .select('plan_type, started_at, expired_at')
      .single()

    if (error) {
      setMessage(`❌ user_plans 조회 실패: ${error.message}`)
      return
    }

    setPlan(data)
    setMessage('✅ user_plans 조회 성공')
  }, [supabase])

  /* -----------------------------
   * 최초 로드 시 자동 조회
   * ----------------------------*/
  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  useEffect(() => {
    if (user) {
      fetchUserPlan()
      fetchEvents()
    }
  }, [fetchEvents, fetchUserPlan, user])

  return (
    <div style={{ padding: 24 }}>
      <h1>DB 테스트 페이지</h1>

      <section>
        <h2>1. 현재 로그인 유저</h2>
        {user ? (
          <ul>
            <li>
              <strong>ID:</strong> {user.id}
            </li>
            <li>
              <strong>Email:</strong> {user.email}
            </li>
          </ul>
        ) : (
          <p>로그인되어 있지 않음</p>
        )}
      </section>

      <hr />

      <section style={{ marginBottom: 24 }}>
        <h2>1. events INSERT 테스트</h2>
        <button type="button" onClick={insertEvent}>
          이벤트 생성
        </button>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>2. events SELECT 테스트</h2>
        <ul>
          {events.map((event) => (
            <li key={event.id}>
              {event.title} ({event.category}) - {event.event_date}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>3. user_plans SELECT 테스트</h2>
        {plan ? (
          <ul>
            <li>플랜: {plan.plan_type}</li>
            <li>시작일: {plan.started_at}</li>
            <li>만료일: {plan.expired_at ?? '없음'}</li>
          </ul>
        ) : (
          <p>플랜 정보 없음</p>
        )}
      </section>

      {message && (
        <p style={{ marginTop: 16, fontWeight: 'bold' }}>{message}</p>
      )}
    </div>
  )
}
