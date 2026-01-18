import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/libs/supabase/server'

export default async function HomePage() {
  const supabase = await createSupabaseServer()
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    redirect('/login')
  }

  const { data: events } = await supabase.from('events').select('*')

  return (
    <div>
      <h1>메인 페이지</h1>
      <pre>{JSON.stringify(events, null, 2)}</pre>
    </div>
  )
}
