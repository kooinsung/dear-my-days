'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/libs/supabase/server'
import type { DeleteAccountResult } from './delete-account.types'

function okStep() {
  return { ok: true as const }
}

function failStep(error: string) {
  return { ok: false as const, error }
}

/**
 * 계정 삭제(탈퇴).
 *
 * 순서:
 * 1) (선택) Storage 파일 삭제
 * 2) (선택) public.users 등 사용자 테이블 데이터 삭제
 * 3) auth.users 삭제
 */
export async function deleteAccount(): Promise<
  DeleteAccountResult | { error: string }
> {
  const supabase = await createSupabaseServer()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    return { error: userError.message }
  }

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // 0) 현재 세션 로그아웃(토큰/쿠키 무효화)
  // Supabase는 세션 토큰을 쿠키로 저장하므로, signOut()으로 쿠키를 정리해
  // 탈퇴 직후에도 브라우저에 남아있는 세션이 재사용되지 않게 합니다.
  try {
    await supabase.auth.signOut()
  } catch {
    // signOut 실패해도 탈퇴는 진행 (최종적으로 auth.users 삭제되면 세션도 무효화됨)
  }

  const result: DeleteAccountResult = {
    ok: false,
    steps: {
      storage: okStep(),
      public_tables: okStep(),
      auth_users: okStep(),
    },
  }

  // 1) Storage 파일 삭제
  // NOTE: 현재 repo에 버킷/경로 규칙이 정의돼 있지 않아 기본은 스킵 처리합니다.
  // 필요해지면 아래 주석을 풀고,
  // - bucketName
  // - prefix (예: `users/${user.id}/`)
  // 를 확정해서 적용하세요.
  try {
    // const { supabaseAdmin } = await import('@/libs/supabase/admin')
    // const admin = supabaseAdmin()
    // const bucketName = 'YOUR_BUCKET'
    // const prefix = `users/${user.id}/`
    //
    // const { data: files, error: listError } = await admin.storage
    //   .from(bucketName)
    //   .list(prefix, { limit: 1000 })
    //
    // if (listError) {
    //   result.steps.storage = failStep(listError.message)
    // } else if (files && files.length > 0) {
    //   const paths = files.map((f) => `${prefix}${f.name}`)
    //   const { error: removeError } = await admin.storage
    //     .from(bucketName)
    //     .remove(paths)
    //   if (removeError) {
    //     result.steps.storage = failStep(removeError.message)
    //   }
    // }
    result.steps.storage = okStep()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    result.steps.storage = failStep(msg)
  }

  // 2) public users 테이블 데이터 삭제
  // NOTE: SCHEMA.md에 public.users 테이블 정의가 없어서 기본은 스킵 처리합니다.
  // 테이블이 존재한다면 아래처럼 삭제하세요.
  try {
    // const { supabaseAdmin } = await import('@/libs/supabase/admin')
    // const admin = supabaseAdmin()
    // const { error: dbError } = await admin.from('users').delete().eq('id', user.id)
    // if (dbError) {
    //   result.steps.public_tables = failStep(dbError.message)
    // }
    result.steps.public_tables = okStep()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    result.steps.public_tables = failStep(msg)
  }

  // 3) auth.users 삭제
  try {
    const { supabaseAdmin } = await import('@/libs/supabase/admin')
    const admin = supabaseAdmin()

    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) {
      result.steps.auth_users = failStep(error.message)
      result.ok = false
      return result
    }

    result.steps.auth_users = okStep()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    result.steps.auth_users = failStep(msg)
    result.ok = false
    return result
  }

  // auth.users가 삭제되면 FK(on delete cascade) 테이블들도 정리됩니다.
  result.ok =
    result.steps.storage.ok &&
    result.steps.public_tables.ok &&
    result.steps.auth_users.ok

  revalidatePath('/', 'layout')

  if (result.ok) {
    redirect('/login')
  }

  return result
}
