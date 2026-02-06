import { Resend } from 'resend'
import { env } from '@/libs/config/env'

export function createResendClient(): Resend {
  return new Resend(env.RESEND_API_KEY)
}
