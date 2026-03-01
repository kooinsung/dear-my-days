import 'server-only'

function kstTimestamp(): string {
  return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
}

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  kakao: 'Kakao',
  naver: 'Naver',
  apple: 'Apple',
  email: 'Email',
}

function providerTag(provider?: string): string {
  if (!provider) {
    return ''
  }
  return `\`${PROVIDER_LABELS[provider] ?? provider}\``
}

function platformTag(platform?: 'web' | 'app'): string {
  if (!platform) {
    return ''
  }
  return platform === 'app' ? '`📱 App`' : '`🌐 Web`'
}

function tags(...items: string[]): string {
  return items.filter(Boolean).join('  ')
}

export function formatSignupMessage(
  email: string,
  provider?: string,
  platform?: 'web' | 'app',
) {
  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🎉  새 회원가입*\n${email}`,
        },
        ...(tags(providerTag(provider), platformTag(platform))
          ? {
              accessory: {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: tags(providerTag(provider), platformTag(platform))
                    .replace(/`/g, '')
                    .trim(),
                },
                style: 'primary',
              },
            }
          : {}),
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: [providerTag(provider), platformTag(platform), kstTimestamp()]
              .filter(Boolean)
              .join('  ·  '),
          },
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
  const config: Record<string, { icon: string; label: string }> = {
    subscription: { icon: '⭐', label: '구독' },
    purchase: { icon: '💳', label: '구매' },
    restore: { icon: '🔄', label: '복원' },
  }
  const { icon, label } = config[info.type] ?? { icon: '💳', label: info.type }

  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${icon}  IAP ${label}*\n\`${info.productId}\`  ·  *${info.amount.toLocaleString()}원*`,
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*제공자*\n${info.provider}` },
          {
            type: 'mrkdwn',
            text: `*유저*\n\`${info.userId.slice(0, 8)}...\``,
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `txn \`${info.transactionId}\`  ·  ${kstTimestamp()}`,
          },
        ],
      },
    ],
  }
}

export function formatIAPRefundMessage(info: {
  provider: string
  productId: string
  amount: number
  userId: string
  transactionId: string
  reason?: string
}) {
  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🔴  IAP 환불*\n\`${info.productId}\`  ·  *${info.amount.toLocaleString()}원*`,
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*제공자*\n${info.provider}` },
          {
            type: 'mrkdwn',
            text: `*유저*\n\`${info.userId.slice(0, 8)}...\``,
          },
        ],
      },
      ...(info.reason
        ? [
            {
              type: 'section',
              text: { type: 'mrkdwn', text: `*사유*\n${info.reason}` },
            },
          ]
        : []),
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `txn \`${info.transactionId}\`  ·  ${kstTimestamp()}`,
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
  const stars = '★'.repeat(info.rating) + '☆'.repeat(5 - info.rating)
  const storeLabel = info.store === 'apple' ? '🍎 App Store' : '🤖 Google Play'

  const blocks: Record<string, unknown>[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*📝  새 리뷰*  ${stars}  *(${info.rating}/5)*`,
      },
    },
  ]

  if (info.title || info.body) {
    const content = [
      info.title ? `> *${info.title}*` : '',
      info.body ? `> ${info.body}` : '',
    ]
      .filter(Boolean)
      .join('\n')
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: content },
    })
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: [storeLabel, info.author, kstTimestamp()]
          .filter(Boolean)
          .join('  ·  '),
      },
    ],
  })

  return { blocks }
}

export function formatServerErrorMessage(info: {
  error: string
  url?: string
  method?: string
  statusCode?: number
}) {
  const status = info.statusCode ?? 500
  const request =
    info.method && info.url ? `\`${info.method} ${info.url}\`` : undefined

  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🚨  서버 에러*  \`${status}\`${request ? `\n${request}` : ''}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`\`\`${info.error.slice(0, 500)}\`\`\``,
        },
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: kstTimestamp() }],
      },
    ],
  }
}
