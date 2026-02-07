import { env } from '@/libs/config/env'

/**
 * 영수증 검증 결과
 */
export interface VerificationResult {
  isValid: boolean
  expiresAt: Date | null
  productId?: string
  error?: string
}

/**
 * Apple 영수증 검증
 * App Store Server API 사용
 */
export async function verifyAppleReceipt(
  receipt: string,
): Promise<VerificationResult> {
  try {
    // Apple의 verifyReceipt API 사용
    // 프로덕션 환경 시도 후 실패하면 샌드박스 시도
    let response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': receipt,
        password: env.APPLE_SHARED_SECRET,
        'exclude-old-transactions': true,
      }),
    })

    let data = await response.json()

    // Sandbox 환경인 경우 (status 21007)
    if (data.status === 21007) {
      response = await fetch('https://sandbox.itunes.apple.com/verifyReceipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'receipt-data': receipt,
          password: env.APPLE_SHARED_SECRET,
          'exclude-old-transactions': true,
        }),
      })
      data = await response.json()
    }

    // 검증 실패
    if (data.status !== 0) {
      return {
        isValid: false,
        expiresAt: null,
        error: `Apple verification failed with status ${data.status}`,
      }
    }

    // 최신 구독 정보 추출
    const latestReceipt = data.latest_receipt_info?.[0]
    if (!latestReceipt) {
      return {
        isValid: false,
        expiresAt: null,
        error: 'No receipt info found',
      }
    }

    const expiresMs = latestReceipt.expires_date_ms
    const productId = latestReceipt.product_id

    return {
      isValid: true,
      expiresAt: expiresMs ? new Date(Number(expiresMs)) : null,
      productId,
    }
  } catch (error) {
    console.error('Apple verification error:', error)
    return {
      isValid: false,
      expiresAt: null,
      error: String(error),
    }
  }
}

/**
 * Google 영수증 검증
 * Google Play Developer API 사용
 */
export async function verifyGoogleReceipt(
  receipt: string,
  productId: string,
): Promise<VerificationResult> {
  try {
    // Google Play Developer API 사용
    const response = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${env.GOOGLE_PACKAGE_NAME}/purchases/subscriptionsv2/tokens/${receipt}`,
      {
        headers: {
          Authorization: `Bearer ${env.GOOGLE_SERVICE_ACCOUNT_TOKEN}`,
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      return {
        isValid: false,
        expiresAt: null,
        error: `Google API error: ${response.status} - ${errorText}`,
      }
    }

    const data = await response.json()

    // 구독 상태 확인
    if (data.subscriptionState !== 'SUBSCRIPTION_STATE_ACTIVE') {
      return {
        isValid: false,
        expiresAt: null,
        error: `Subscription not active: ${data.subscriptionState}`,
      }
    }

    // 만료 시간 추출
    const expiryTime = data.lineItems?.[0]?.expiryTime

    return {
      isValid: true,
      expiresAt: expiryTime ? new Date(expiryTime) : null,
      productId: data.lineItems?.[0]?.productId || productId,
    }
  } catch (error) {
    console.error('Google verification error:', error)
    return {
      isValid: false,
      expiresAt: null,
      error: String(error),
    }
  }
}
