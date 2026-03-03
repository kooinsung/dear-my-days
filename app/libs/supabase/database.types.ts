/**
 * Database Type Definitions
 * Supabase 데이터베이스 스키마에 대한 TypeScript 타입 정의
 *
 * 이 파일은 supabase/migrations/ SQL 마이그레이션을 기반으로 작성됨.
 * DB 스키마 변경 시 이 파일도 함께 업데이트할 것.
 */

// --- Enum Types ---

export type CategoryType =
  | 'BIRTHDAY'
  | 'ANNIVERSARY'
  | 'MEMORIAL'
  | 'HOLIDAY'
  | 'OTHER'

export type CalendarType = 'SOLAR' | 'LUNAR'

export type PlanType = 'FREE' | 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY'

export type PurchaseType = 'SUBSCRIPTION' | 'EVENT_SLOT'

export type PaymentProvider = 'APPLE' | 'GOOGLE'

export type PurchaseStatus = 'COMPLETED' | 'REFUNDED'

export type NotificationLogStatus = 'SUCCESS' | 'FAILED'

export type AuthProvider = 'email' | 'google' | 'kakao' | 'naver' | 'apple'

// --- Table Row Types ---

export interface Event {
  id: string
  user_id: string
  category: CategoryType
  title: string
  note: string | null
  calendar_type: CalendarType
  solar_date: string
  lunar_date: string | null
  is_leap_month: boolean
  created_at: string
  updated_at: string
}

export interface UserPlan {
  user_id: string
  plan_type: PlanType
  started_at: string | null
  expired_at: string | null
  extra_event_slots: number
}

export interface EventPurchase {
  id: string
  user_id: string
  provider: PaymentProvider
  transaction_id: string | null
  product_id: string | null
  purchase_type: PurchaseType
  amount: number
  currency: string
  purchase_token: string | null
  status: PurchaseStatus
  refunded_at: string | null
  created_at: string
}

export interface EventNotificationSetting {
  id: string
  event_id: string
  user_id: string
  minutes_before: number
  created_at: string | null
  updated_at: string | null
}

export interface DeviceToken {
  id: string
  user_id: string
  token: string
  platform: string
  created_at: string | null
}

export interface NotificationLog {
  id: string
  user_id: string | null
  event_id: string | null
  device_token: string
  minutes_before: number | null
  sent_at: string
  status: NotificationLogStatus
  error_message: string | null
  created_at: string | null
}

export interface UserProvider {
  id: string
  user_id: string
  provider: AuthProvider
  provider_user_id: string
  created_at: string | null
}

export interface KvStore {
  key: string
  value: string
  updated_at: string
}

// --- Insert Types (optional fields = DB defaults) ---

export type EventInsert = Omit<Event, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type EventPurchaseInsert = Omit<
  EventPurchase,
  'id' | 'status' | 'refunded_at' | 'created_at'
> & {
  id?: string
  status?: PurchaseStatus
  refunded_at?: string | null
  created_at?: string
}

export type EventNotificationSettingInsert = Omit<
  EventNotificationSetting,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type DeviceTokenInsert = Omit<DeviceToken, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type NotificationLogInsert = Omit<
  NotificationLog,
  'id' | 'created_at'
> & {
  id?: string
  created_at?: string
}
