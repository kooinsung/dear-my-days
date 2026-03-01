'use client'

import type { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/libs/supabase/browser'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createSupabaseBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }
    fetchUser()
  }, [])

  return { user, isLoading }
}
