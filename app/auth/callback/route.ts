import { type NextRequest, NextResponse } from 'next/server'
import { withBasePath } from '@/libs/oauth/urls'
import { createSupabaseServer } from '@/libs/supabase/server'

function normalizeNext(next: string): string {
  // open redirect 방지: 내부 경로만 허용
  if (!next.startsWith('/')) {
    return '/'
  }
  if (next.startsWith('//')) {
    return '/'
  }
  return next
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = normalizeNext(searchParams.get('next') ?? '/')

  if (!code) {
    return NextResponse.redirect(
      `${origin}${withBasePath('/login')}?error=oauth_code_missing`,
    )
  }

  const supabase = await createSupabaseServer()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const params = new URLSearchParams({
      error: 'oauth_exchange_failed',
    })

    const anyErr = error as unknown as {
      code?: string
      name?: string
    }

    const errCode = anyErr.code ?? anyErr.name
    if (errCode) {
      params.set('error_code', String(errCode))
    }

    return NextResponse.redirect(
      `${origin}${withBasePath('/login')}?${params.toString()}`,
    )
  }

  return NextResponse.redirect(`${origin}${withBasePath(next)}`)
}
