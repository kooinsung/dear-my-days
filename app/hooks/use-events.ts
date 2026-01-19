import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createSupabaseBrowser } from '@/libs/supabase/browser'
import type {
  CalendarType,
  CategoryType,
  Event,
} from '@/libs/supabase/database.types'

// Query Keys
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters?: { category?: CategoryType | 'ALL' }) =>
    [...eventKeys.lists(), filters] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
  past: (filters?: { category?: CategoryType | 'ALL' }) =>
    [...eventKeys.all, 'past', filters] as const,
  upcoming: () => [...eventKeys.all, 'upcoming'] as const,
  calendar: (year: number) => [...eventKeys.all, 'calendar', year] as const,
}

// 이벤트 목록 조회
export function useEvents(filters?: { category?: CategoryType | 'ALL' }) {
  const supabase = createSupabaseBrowser()

  return useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select('*')
        .order('solar_date', { ascending: true })

      if (filters?.category && filters.category !== 'ALL') {
        query = query.eq('category', filters.category)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data as Event[]
    },
  })
}

// 다가오는 이벤트 조회 (올해만 표시)
export function useUpcomingEvents() {
  const supabase = createSupabaseBrowser()

  return useQuery({
    queryKey: eventKeys.upcoming(),
    queryFn: async () => {
      // 모든 이벤트를 가져옴
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('solar_date', { ascending: true })

      if (error) {
        throw error
      }

      const events = data as Event[]
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const thisYear = today.getFullYear()

      // 올해 발생일이 오늘 이후인 이벤트만 필터링
      const upcomingEvents = events
        .map((event) => {
          const eventDate = new Date(event.solar_date)

          // 올해의 해당 월/일로 날짜 생성
          const eventThisYear = new Date(
            thisYear,
            eventDate.getMonth(),
            eventDate.getDate(),
          )
          eventThisYear.setHours(0, 0, 0, 0)

          return {
            ...event,
            this_year_occurrence: eventThisYear,
          }
        })
        .filter((event) => {
          // 올해 발생일이 오늘 이후인 것만 (오늘 포함)
          return event.this_year_occurrence >= today
        })
        .map((event) => {
          // solar_date를 올해 발생일로 변경 (D-day 계산용)
          const year = event.this_year_occurrence.getFullYear()
          const month = String(
            event.this_year_occurrence.getMonth() + 1,
          ).padStart(2, '0')
          const day = String(event.this_year_occurrence.getDate()).padStart(
            2,
            '0',
          )
          const thisYearDate = `${year}-${month}-${day}`

          return {
            ...event,
            solar_date: thisYearDate,
          }
        })
        .sort((a, b) => {
          // 날짜 기준으로 정렬
          return a.solar_date.localeCompare(b.solar_date)
        })

      return upcomingEvents
    },
  })
}

// 지난 이벤트 조회
export function usePastEvents(filters?: { category?: CategoryType | 'ALL' }) {
  const supabase = createSupabaseBrowser()

  return useQuery({
    queryKey: eventKeys.past(filters),
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]

      let query = supabase
        .from('events')
        .select('*')
        .lt('solar_date', today)
        .order('solar_date', { ascending: false })

      if (filters?.category && filters.category !== 'ALL') {
        query = query.eq('category', filters.category)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data as Event[]
    },
  })
}

// 특정 이벤트 조회
export function useEvent(id: string | null) {
  const supabase = createSupabaseBrowser()

  return useQuery({
    queryKey: eventKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) {
        throw new Error('Event ID is required')
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw error
      }

      return data as Event
    },
    enabled: !!id,
  })
}

// 캘린더 데이터 조회 (특정 년도)
export function useCalendarEvents(year: number) {
  const supabase = createSupabaseBrowser()

  return useQuery({
    queryKey: eventKeys.calendar(year),
    queryFn: async () => {
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('solar_date', startDate)
        .lte('solar_date', endDate)

      if (error) {
        throw error
      }

      return data as Event[]
    },
  })
}

// 이벤트 생성
export function useCreateEvent() {
  const queryClient = useQueryClient()
  const supabase = createSupabaseBrowser()

  return useMutation({
    mutationFn: async (
      newEvent: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    ) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Unauthorized')
      }

      const { data, error } = await supabase
        .from('events')
        .insert({
          ...newEvent,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return data as Event
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all })
    },
  })
}

// 이벤트 수정
export function useUpdateEvent() {
  const queryClient = useQueryClient()
  const supabase = createSupabaseBrowser()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Event>
    }) => {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data as Event
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all })
      queryClient.setQueryData(eventKeys.detail(data.id), data)
    },
  })
}

// 이벤트 삭제
export function useDeleteEvent() {
  const queryClient = useQueryClient()
  const supabase = createSupabaseBrowser()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id)

      if (error) {
        throw error
      }

      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all })
    },
  })
}
