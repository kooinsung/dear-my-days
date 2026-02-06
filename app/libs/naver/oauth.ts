export function generateNaverAuthUrl(state: string) {
  const params = new URLSearchParams({
    response_type: 'code',
    // biome-ignore lint/style/noNonNullAssertion: Naver client ID is required for OAuth flow
    client_id: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback/naver`,
    state,
  })

  return `https://nid.naver.com/oauth2.0/authorize?${params}`
}

export async function exchangeNaverToken(code: string, state: string) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    // biome-ignore lint/style/noNonNullAssertion: Naver client ID is required for OAuth flow
    client_id: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID!,
    // biome-ignore lint/style/noNonNullAssertion: Naver client secret is required for OAuth flow
    client_secret: process.env.NAVER_CLIENT_SECRET!,
    code,
    state,
  })

  const res = await fetch(`https://nid.naver.com/oauth2.0/token?${params}`, {
    method: 'POST',
  })

  if (!res.ok) {
    throw new Error('Naver token exchange failed')
  }
  return res.json()
}

export async function getNaverUser(accessToken: string) {
  const res = await fetch('https://openapi.naver.com/v1/nid/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const json = await res.json()
  return json.response
}
