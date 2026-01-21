import { createSupabaseServer } from '@/libs/supabase/server'
import ProviderTestForm from './provider-form'

export default async function ProviderTestPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <ProviderTestForm initialUser={user} />
}
