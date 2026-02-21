import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/libs/supabase/server'

export async function requireAuth() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return { supabase, user }
}
