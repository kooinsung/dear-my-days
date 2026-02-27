import { SettingsPageWrapper } from '../settings-page-wrapper'
import { LinkedProvidersClient } from './linked-providers-client'

export default function LinkedProvidersPage() {
  return (
    <SettingsPageWrapper pageId="/settings/link">
      <LinkedProvidersClient />
    </SettingsPageWrapper>
  )
}
