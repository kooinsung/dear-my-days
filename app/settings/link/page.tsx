import type { User } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/libs/supabase/server'
import { LinkedProvidersClient } from './linked-providers-client'

export default async function LinkedProvidersPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <LinkedProvidersClient initialUser={user as User} />
}
