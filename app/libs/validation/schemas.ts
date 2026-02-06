import { z } from 'zod'

// 인증 스키마
export const emailSchema = z.string().email('올바른 이메일을 입력하세요')
export const passwordSchema = z
  .string()
  .min(8, '비밀번호는 8자 이상이어야 합니다')

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = signupSchema

export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
})

export const resetPasswordConfirmSchema = z.object({
  uid: z.string().uuid('잘못된 요청입니다'),
  token: z.string().min(1, '토큰이 필요합니다'),
  password: passwordSchema,
})

// 이벤트 스키마
export const calendarTypeSchema = z.enum(['SOLAR', 'LUNAR'])
export const categoryTypeSchema = z.enum([
  'BIRTHDAY',
  'ANNIVERSARY',
  'MEMORIAL',
  'HOLIDAY',
  'OTHER',
])

export const ymdDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다')

export const createEventSchema = z
  .object({
    title: z
      .string()
      .min(1, '제목을 입력하세요')
      .max(100, '제목이 너무 깁니다'),
    category: categoryTypeSchema,
    calendar_type: calendarTypeSchema,
    solar_date: ymdDateSchema.optional(),
    lunar_date: ymdDateSchema.optional(),
    is_leap_month: z.boolean().optional(),
    note: z.string().max(500, '메모가 너무 깁니다').nullable().optional(),
  })
  .refine(
    (data) =>
      data.calendar_type === 'SOLAR' ? !!data.solar_date : !!data.lunar_date,
    {
      message: '날짜를 입력하세요',
    },
  )

// Update 스키마 (id 필수, 나머지는 optional)
export const updateEventSchema = z.object({
  id: z.string().uuid('잘못된 이벤트 ID입니다'),
  title: z
    .string()
    .min(1, '제목을 입력하세요')
    .max(100, '제목이 너무 깁니다')
    .optional(),
  category: categoryTypeSchema.optional(),
  calendar_type: calendarTypeSchema.optional(),
  solar_date: ymdDateSchema.optional(),
  lunar_date: ymdDateSchema.optional(),
  is_leap_month: z.boolean().optional(),
  note: z.string().max(500, '메모가 너무 깁니다').nullable().optional(),
})

// Lunar API 쿼리 파라미터 스키마
export const lunarQuerySchema = z.object({
  year: z.coerce.number().int().min(1000).max(3000),
  month: z.coerce.number().int().min(1).max(12),
  day: z.coerce.number().int().min(1).max(31),
})
