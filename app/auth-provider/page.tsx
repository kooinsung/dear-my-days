import { createSupabaseServer } from '@/libs/supabase/server'
import ProviderTestForm from './provider-form'

export default async function ProviderTestPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return <ProviderTestForm initialUser={session?.user || null} />
}
