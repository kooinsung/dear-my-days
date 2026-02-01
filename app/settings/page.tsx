import type { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/libs/supabase/server'
import { SettingsHomeClient } from './settings-home-client'

export default async function SettingsPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <SettingsHomeClient user={user as User} />
}
