import { supabaseAdmin } from '@/libs/supabase/admin'

export async function findOrCreateNaverUser(naverUser: {
  id: string
  email?: string
  name?: string
  profile_image?: string
}) {
  const admin = supabaseAdmin()

  // provider 기준 조회
  const { data: providerRow } = await admin
    .from('user_providers')
    .select('user_id')
    .eq('provider', 'naver')
    .eq('provider_user_id', naverUser.id)
    .single()

  if (providerRow) {
    return { userId: providerRow.user_id }
  }

  // auth.users 생성
  const { data: created } = await admin.auth.admin.createUser({
    email: naverUser.email ?? `naver_${naverUser.id}@no-email.local`,
    email_confirm: true,
    user_metadata: {
      name: naverUser.name,
      avatar_url: naverUser.profile_image,
    },
  })

  if (!created.user) {
    throw new Error('User creation failed')
  }

  // provider 연결
  await admin.from('user_providers').insert({
    user_id: created.user.id,
    provider: 'naver',
    provider_user_id: naverUser.id,
  })

  return { userId: created.user.id }
}

export async function createNaverMagicLink(email: string) {
  const admin = supabaseAdmin()

  const { data } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  const token = new URL(data?.properties?.action_link ?? '').searchParams.get(
    'token',
  )
  if (!token) {
    throw new Error('Token missing')
  }

  return token
}
