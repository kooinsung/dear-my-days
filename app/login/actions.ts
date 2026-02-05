'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/libs/supabase/server'

export async function login(email: string, password: string) {
  const supabase = await createSupabaseServer()

  if (!email || !password) {
    return { error: '이메일과 비밀번호를 입력하세요' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  console.log('error', error)

  if (error) {
    return { error: '이메일 또는 비밀번호가 올바르지 않습니다' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function logout() {
  const supabase = await createSupabaseServer()
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
}

export async function signup(email: string, password: string) {
  if (!email || !password) {
    return { error: '이메일과 비밀번호를 입력하세요' }
  }

  const baseUrl = process.env.NEXT_PUBLIC_WEB_BASE_URL
  if (!baseUrl) {
    return { error: '서버 설정 오류(NEXT_PUBLIC_WEB_BASE_URL)' }
  }
  if (!baseUrl) {
    return { error: '서버 설정 오류(NEXT_PUBLIC_WEB_BASE_URL)' }
  }

  const res = await fetch(new URL('/api/auth/signup', baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  const data = await res.json()

  if (!res.ok || data?.error) {
    return {
      error:
        data?.error ?? '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.',
    }
  }

  return { success: true }
}
