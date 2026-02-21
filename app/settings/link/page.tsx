import { requireAuth } from '@/libs/auth/require-auth'
import { SettingsPageWrapper } from '../settings-page-wrapper'
import { LinkedProvidersClient } from './linked-providers-client'

export default async function LinkedProvidersPage() {
  const { user } = await requireAuth()

  return (
    <SettingsPageWrapper pageId="/settings/link">
      <LinkedProvidersClient initialUser={user} />
    </SettingsPageWrapper>
  )
}
