import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  /**
   * Server-side Environment Variables
   * 절대 브라우저에 노출되지 않음
   */
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    RESEND_FROM_EMAIL: z.string().email(),
    KASI_SERVICE_KEY: z.string().min(1),

    // Naver OAuth (선택사항)
    NAVER_CLIENT_SECRET: z.string().optional(),

    // IAP (In-App Purchases) - 선택사항
    APPLE_SHARED_SECRET: z.string().optional(),
    GOOGLE_PACKAGE_NAME: z.string().optional(),
    GOOGLE_SERVICE_ACCOUNT_TOKEN: z.string().optional(),

    // Firebase (Push Notifications) - 선택사항
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),
  },

  /**
   * Client-side Environment Variables
   * NEXT_PUBLIC_ 접두사 필수
   */
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_WEB_BASE_URL: z.string().url(),

    // Naver OAuth (선택사항)
    NEXT_PUBLIC_NAVER_CLIENT_ID: z.string().optional(),
  },

  /**
   * Runtime Environment Variables
   * Next.js의 process.env를 매핑
   */
  runtimeEnv: {
    // Server
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    KASI_SERVICE_KEY: process.env.KASI_SERVICE_KEY,
    NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET,
    APPLE_SHARED_SECRET: process.env.APPLE_SHARED_SECRET,
    GOOGLE_PACKAGE_NAME: process.env.GOOGLE_PACKAGE_NAME,
    GOOGLE_SERVICE_ACCOUNT_TOKEN: process.env.GOOGLE_SERVICE_ACCOUNT_TOKEN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,

    // Client
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_WEB_BASE_URL: process.env.NEXT_PUBLIC_WEB_BASE_URL,
    NEXT_PUBLIC_NAVER_CLIENT_ID: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID,
  },

  /**
   * 빌드 시 검증 스킵 옵션 (개발 환경에서만 사용)
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * 빈 문자열을 undefined로 처리
   */
  emptyStringAsUndefined: true,
})
