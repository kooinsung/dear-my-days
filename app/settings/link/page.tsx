import type { User } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/libs/supabase/server'
import { SettingsPageWrapper } from '../settings-page-wrapper'
import { LinkedProvidersClient } from './linked-providers-client'

export default async function LinkedProvidersPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <SettingsPageWrapper pageId="/settings/link">
      <LinkedProvidersClient initialUser={user as User} />
    </SettingsPageWrapper>
  )
}
