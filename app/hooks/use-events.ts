import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createSupabaseBrowser } from '@/libs/supabase/browser'
import type {
  CalendarType,
  CategoryType,
  Event,
} from '@/libs/supabase/database.types'
import { getApiUrl, getUpcomingEventsThisYear } from '@/libs/utils'

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
export function useUpcomingEvents(options?: { initialEvents?: Event[] }) {
  const supabase = createSupabaseBrowser()

  return useQuery({
    queryKey: eventKeys.upcoming(),
    initialData: options?.initialEvents,
    queryFn: async () => {
      // (fallback) 클라이언트에서 다시 조회해야 하는 경우만 fetch
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('solar_date', { ascending: true })

      if (error) {
        throw error
      }

      return getUpcomingEventsThisYear((data || []) as Event[])
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

type ApiSuccess<T> = { success: true; data: T }
type ApiError = { error: string }

export type CreateEventInput = {
  title: string
  category: CategoryType
  calendar_type: CalendarType
  note: string | null
} & (
  | {
      calendar_type: 'SOLAR'
      solar_date: string
      lunar_date?: null
    }
  | {
      calendar_type: 'LUNAR'
      lunar_date: string | null
      solar_date?: string
    }
)

export type UpdateEventInput = {
  id: string
  updates: {
    title?: string
    category?: CategoryType
    note?: string | null
    calendar_type?: CalendarType
    solar_date?: string
    lunar_date?: string | null
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

  const json = (await res.json().catch(() => ({}))) as unknown

  if (!res.ok) {
    const msg =
      json && typeof json === 'object' && 'error' in json
        ? String((json as ApiError).error)
        : `Request failed: ${res.status}`
    throw new Error(msg)
  }

  return json as T
}

// 이벤트 생성
export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newEvent: CreateEventInput) => {
      const res = await postJson<ApiSuccess<Event>>(
        getApiUrl('/api/events/create'),
        newEvent,
      )
      if (!res.data) {
        throw new Error('Failed to create event')
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all })
    },
  })
}

// 이벤트 수정
export function useUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateEventInput) => {
      const res = await postJson<ApiSuccess<Event>>(
        getApiUrl('/api/events/update'),
        { id, ...updates },
      )
      if (!res.data) {
        throw new Error('Failed to update event')
      }
      return res.data
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
