import { requireAuth } from '@/libs/auth/require-auth'
import { SubscriptionClient } from './subscription-client'

export default async function SubscriptionPage() {
  const { user } = await requireAuth()

  return <SubscriptionClient userId={user.id} />
}
