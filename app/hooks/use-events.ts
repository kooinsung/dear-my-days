import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createSupabaseBrowser } from '@/libs/supabase/browser'
import type { CategoryType, Event } from '@/libs/supabase/database.types'
import { getUpcomingEventsThisYear } from '@/libs/utils'

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
