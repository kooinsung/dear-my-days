import 'server-only'

function kstTimestamp(): string {
  return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
}

export function formatSignupMessage(email: string, provider?: string) {
  const providerLabel = provider ? ` (${provider})` : ''
  return {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `🎉 새 회원가입${providerLabel}` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*이메일:*\n${email}` },
          { type: 'mrkdwn', text: `*시간:*\n${kstTimestamp()}` },
        ],
      },
    ],
  }
}

export function formatIAPMessage(info: {
  type: 'subscription' | 'purchase' | 'restore'
  provider: string
  productId: string
  amount: number
  userId: string
  transactionId: string
}) {
  const icons: Record<string, string> = {
    subscription: '⭐',
    purchase: '💰',
    restore: '🔄',
  }
  const labels: Record<string, string> = {
    subscription: '구독',
    purchase: '구매',
    restore: '복원',
  }
  const icon = icons[info.type] ?? '💰'
  const label = labels[info.type] ?? info.type

  return {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${icon} IAP ${label}` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*상품:*\n${info.productId}` },
          {
            type: 'mrkdwn',
            text: `*금액:*\n${info.amount.toLocaleString()}원`,
          },
          { type: 'mrkdwn', text: `*제공자:*\n${info.provider}` },
          { type: 'mrkdwn', text: `*유저:*\n${info.userId.slice(0, 8)}...` },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `거래 ID: ${info.transactionId} | ${kstTimestamp()}`,
          },
        ],
      },
    ],
  }
}

export function formatReviewMessage(info: {
  store: string
  rating: number
  title?: string
  body?: string
  author?: string
}) {
  const stars = '⭐'.repeat(info.rating)
  const storeLabel = info.store === 'apple' ? '🍎 App Store' : '🤖 Google Play'
  const fields = [
    { type: 'mrkdwn' as const, text: `*스토어:*\n${storeLabel}` },
    { type: 'mrkdwn' as const, text: `*평점:*\n${stars} (${info.rating}/5)` },
  ]
  if (info.author) {
    fields.push({ type: 'mrkdwn', text: `*작성자:*\n${info.author}` })
  }

  const blocks: Record<string, unknown>[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '📝 새 리뷰' },
    },
    { type: 'section', fields },
  ]
  if (info.title || info.body) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [info.title ? `*${info.title}*` : '', info.body ?? '']
          .filter(Boolean)
          .join('\n'),
      },
    })
  }
  blocks.push({
    type: 'context',
    elements: [{ type: 'mrkdwn', text: kstTimestamp() }],
  })

  return { blocks }
}

export function formatServerErrorMessage(info: {
  error: string
  url?: string
  method?: string
  statusCode?: number
}) {
  return {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🚨 서버 에러' },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*에러:*\n${info.error.slice(0, 200)}`,
          },
          {
            type: 'mrkdwn',
            text: `*상태:*\n${info.statusCode ?? 500}`,
          },
          ...(info.method && info.url
            ? [
                {
                  type: 'mrkdwn' as const,
                  text: `*요청:*\n${info.method} ${info.url}`,
                },
              ]
            : []),
        ],
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: kstTimestamp() }],
      },
    ],
  }
}
