import crypto from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { env } from '@/libs/config/env'
import { createResendClient } from '@/libs/resend/client'
import { supabaseAdmin } from '@/libs/supabase/admin'

function generateResetToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string }
    const email = body.email?.trim()

    if (!email) {
      return NextResponse.json(
        { error: '이메일을 입력하세요' },
        { status: 400 },
      )
    }

    const admin = supabaseAdmin()

    // ✅ 유저 열거 방지: 존재 여부와 무관하게 항상 success: true를 반환

    // 1) listUsers 페이지네이션으로 유저 찾기
    const perPage = 200
    const maxPages = 50

    type ListedUser = {
      id: string
      email?: string
      user_metadata?: Record<string, unknown>
    }

    let user: ListedUser | undefined

    // 1-a) SDK 버전별 메서드에 의존하지 않고
    // listUsers(page/perPage)만 사용해 페이지네이션 스캔으로 유저를 찾는다.

    for (let page = 1; page <= maxPages && !user; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage,
      })

      if (error) {
        return NextResponse.json({ success: true })
      }

      user = (data.users as ListedUser[]).find((u) => u.email === email)

      if (!user && data.users.length < perPage) {
        break
      }
    }

    if (!user) {
      return NextResponse.json({ success: true })
    }

    // 2) 토큰 저장 (기존 토큰이 유효하면 재사용)
    const now = Date.now()
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>

    const existingToken = meta.password_reset_token
    const existingExpiresAt = meta.password_reset_expires_at

    const shouldReuse =
      typeof existingToken === 'string' &&
      typeof existingExpiresAt === 'number' &&
      existingExpiresAt > now + 1000 * 30 // 최소 30초 이상 남아있으면 재사용

    const token = shouldReuse ? existingToken : generateResetToken()
    const expiresAt = shouldReuse
      ? (existingExpiresAt as number)
      : now + 1000 * 60 * 30

    if (!shouldReuse) {
      const { error: updateErr } = await admin.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...meta,
            password_reset_token: token,
            password_reset_expires_at: expiresAt,
          },
        },
      )

      if (updateErr) {
        return NextResponse.json({ success: true })
      }
    }

    // 3) Resend 발송
    const baseUrl = env.NEXT_PUBLIC_WEB_BASE_URL

    const resetUrl = new URL(`${baseUrl}/auth/reset-password`)
    resetUrl.searchParams.set('uid', user.id)
    resetUrl.searchParams.set('token', token)

    const resend = createResendClient()
    const from = env.RESEND_FROM_EMAIL

    await resend.emails.send({
      from,
      to: email,
      subject: 'Dear Days 비밀번호 재설정',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5;">
          <h2>비밀번호 재설정</h2>
          <p>아래 버튼을 눌러 비밀번호를 재설정해 주세요.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl.toString()}" style="display: inline-block; padding: 10px 16px; background: #111827; color: white; text-decoration: none; border-radius: 6px;">비밀번호 재설정</a>
          </p>
          <p style="color:#6b7280; font-size: 13px;">요청하지 않았다면 이 메일은 무시해도 됩니다.</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: '요청 처리에 실패했습니다.' },
      { status: 500 },
    )
  }
}
