import { type NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)

  const uid = searchParams.get('uid')
  const token = searchParams.get('token')

  if (!uid || !token) {
    return NextResponse.redirect(
      `${origin}/auth/verify-email?error=missing_params`,
    )
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.redirect(
      `${origin}/auth/verify-email?error=server_config`,
    )
  }

  const { createClient } = await import('@supabase/supabase-js')
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    serviceRoleKey,
    { auth: { persistSession: false } },
  )

  const { data, error } = await admin.auth.admin.getUserById(uid)
  if (error || !data.user) {
    return NextResponse.redirect(
      `${origin}/auth/verify-email?error=user_not_found`,
    )
  }

  const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>
  const savedToken = meta.email_verify_token
  const expiresAt = meta.email_verify_expires_at

  if (typeof savedToken !== 'string' || typeof expiresAt !== 'number') {
    return NextResponse.redirect(
      `${origin}/auth/verify-email?error=invalid_token_state`,
    )
  }

  if (savedToken !== token) {
    return NextResponse.redirect(
      `${origin}/auth/verify-email?error=token_mismatch`,
    )
  }

  if (Date.now() > expiresAt) {
    return NextResponse.redirect(
      `${origin}/auth/verify-email?error=token_expired`,
    )
  }

  const { error: confirmErr } = await admin.auth.admin.updateUserById(uid, {
    email_confirm: true,
    user_metadata: {
      ...meta,
      email_verify_token: null,
      email_verify_expires_at: null,
    },
  })

  if (confirmErr) {
    return NextResponse.redirect(
      `${origin}/auth/verify-email?error=confirm_failed`,
    )
  }

  return NextResponse.redirect(`${origin}/login?verified=1`)
}
