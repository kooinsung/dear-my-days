'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createSupabaseBrowser } from '@/lips/supabase/browser'

export default function Home() {
  const supabase = useMemo(() => createSupabaseBrowser(), [])

  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login')
      } else {
        setLoading(false)
      }
    })
  }, [router.push, supabase.auth.getUser])

  if (loading) {
    return null
  }

  return <div>홈 (로그인 성공)</div>
}
