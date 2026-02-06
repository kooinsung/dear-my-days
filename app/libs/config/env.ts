// 런타임 환경 변수 검증 및 타입 안전성 제공

// 앱 시작 시 검증 (빠른 실패)
export function validateEnv() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
    'KASI_SERVICE_KEY',
    'NEXT_PUBLIC_WEB_BASE_URL',
  ] as const

  const missing: string[] = []
  for (const key of requiredVars) {
    const value = process.env[key]
    if (!value || value === '') {
      missing.push(key)
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    )
  }
}

// 타입 안전 환경 변수 export
// validateEnv() 호출 후에는 모든 값이 존재함이 보장됨
export const env = {
  // biome-ignore lint/style/noNonNullAssertion: validateEnv() guarantees these values exist
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    // biome-ignore lint/style/noNonNullAssertion: validateEnv() guarantees these values exist
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  // biome-ignore lint/style/noNonNullAssertion: validateEnv() guarantees these values exist
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  // biome-ignore lint/style/noNonNullAssertion: validateEnv() guarantees these values exist
  RESEND_API_KEY: process.env.RESEND_API_KEY!,
  // biome-ignore lint/style/noNonNullAssertion: validateEnv() guarantees these values exist
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL!,
  // biome-ignore lint/style/noNonNullAssertion: validateEnv() guarantees these values exist
  KASI_SERVICE_KEY: process.env.KASI_SERVICE_KEY!,
  // biome-ignore lint/style/noNonNullAssertion: validateEnv() guarantees these values exist
  NEXT_PUBLIC_WEB_BASE_URL: process.env.NEXT_PUBLIC_WEB_BASE_URL!,
}
