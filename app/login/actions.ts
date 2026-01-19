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
