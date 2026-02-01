/**
 * Database Type Definitions
 * Supabase 데이터베이스 스키마에 대한 TypeScript 타입 정의
 */

export type CategoryType =
  | 'BIRTHDAY'
  | 'ANNIVERSARY'
  | 'MEMORIAL'
  | 'HOLIDAY'
  | 'OTHER'

export type CalendarType = 'SOLAR' | 'LUNAR'

export type PaymentProvider = 'DEFAULT' | 'APPLE' | 'GOOGLE' | 'STRIPE'

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED'

export type PlanType = 'FREE' | 'PREMIUM' | 'ENTERPRISE'

export type AuthProvider = 'email' | 'google' | 'kakao' | 'naver'

export interface Event {
  id: string
  user_id: string
  category: CategoryType
  title: string
  note: string | null
  calendar_type: CalendarType
  created_at: string | null
  updated_at: string | null
  solar_date: string
  lunar_date: string | null
  is_leap_month: boolean
}
