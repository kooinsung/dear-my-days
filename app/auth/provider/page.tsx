import { createSupabaseServer } from '@/libs/supabase/server'
import { SettingsPageWrapper } from '../../settings/settings-page-wrapper'
import ProviderTestForm from './provider-form'

export default async function ProviderTestPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <SettingsPageWrapper pageId="/auth/provider">
      <ProviderTestForm initialUser={user} />
    </SettingsPageWrapper>
  )
}
