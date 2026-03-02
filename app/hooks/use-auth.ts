'use client'

import type { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/libs/supabase/browser'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createSupabaseBrowser()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setIsLoading(false)
    })
  }, [])

  return { user, isLoading }
}
