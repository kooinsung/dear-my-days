import { requireAuth } from '@/libs/auth/require-auth'
import { SettingsHomeClient } from './settings-home-client'

export default async function SettingsPage() {
  const { user } = await requireAuth()

  return <SettingsHomeClient user={user} />
}
