import type { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/libs/supabase/server'
import { LinkedProvidersClient } from './linked-providers-client'

export default async function LinkedProvidersPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <LinkedProvidersClient initialUser={user as User} />
}
