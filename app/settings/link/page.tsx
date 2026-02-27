import { SettingsPageWrapper } from '../settings-page-wrapper'
import { LinkedProvidersClient } from './linked-providers-client'

export const dynamic = 'force-dynamic'

export default function LinkedProvidersPage() {
  return (
    <SettingsPageWrapper pageId="/settings/link">
      <LinkedProvidersClient />
    </SettingsPageWrapper>
  )
}
