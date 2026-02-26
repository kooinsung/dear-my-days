import { requireAuth } from '@/libs/auth/require-auth'
import { NotificationsClient } from './notifications-client'

export default async function SettingsNotificationsPage() {
  await requireAuth()

  return <NotificationsClient />
}
