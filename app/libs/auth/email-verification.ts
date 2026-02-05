import crypto from 'node:crypto'
import { createResendClient } from '@/libs/resend/client'

export function generateEmailVerificationToken(): string {
  // URL-safe 토큰
  return crypto.randomBytes(32).toString('base64url')
}

export async function sendEmailVerificationMail(params: {
  to: string
  verificationUrl: string
}): Promise<
  { success: true; id?: string } | { success: false; error: string }
> {
  const resend = createResendClient()

  const from = process.env.RESEND_FROM_EMAIL
  if (!from) {
    return { success: false, error: 'RESEND_FROM_EMAIL is not set' }
  }

  const result = await resend.emails.send({
    from,
    to: params.to,
    subject: 'Dear Days 이메일 인증',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5;">
        <h2>이메일 인증</h2>
        <p>아래 버튼을 눌러 이메일 인증을 완료해 주세요.</p>
        <p style="margin: 24px 0;">
          <a href="${params.verificationUrl}" style="display: inline-block; padding: 10px 16px; background: #111827; color: white; text-decoration: none; border-radius: 6px;">이메일 인증하기</a>
        </p>
        <p style="color:#6b7280; font-size: 13px;">요청하지 않았다면 이 메일은 무시해도 됩니다.</p>
      </div>
    `,
  })

  // Resend SDK는 { data, error } 형태로 돌려줌
  const anyResult = result as unknown as {
    data?: { id?: string }
    error?: { message?: string }
  }

  if (anyResult.error) {
    return {
      success: false,
      error: anyResult.error.message ?? 'Resend send failed',
    }
  }

  return { success: true, id: anyResult.data?.id }
}
