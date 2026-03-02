import * as Sentry from '@sentry/nextjs'
import { env } from '@/libs/config/env'

export type PurchaseType = 'SUBSCRIPTION' | 'EVENT_SLOT'

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
 * 구독과 소모품(INAPP) 모두 지원
 */
export async function verifyAppleReceipt(
  receipt: string,
  purchaseType: PurchaseType = 'SUBSCRIPTION',
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

    // 소모품(INAPP): EVENT_SLOT이면 in_app 분기를 먼저 처리
    // (구독 이력이 있는 사용자의 경우 latest_receipt_info가 존재하여 구독 정보를 반환하므로)
    if (purchaseType === 'EVENT_SLOT') {
      const inAppReceipts = data.receipt?.in_app
      if (inAppReceipts && inAppReceipts.length > 0) {
        const latestInApp = inAppReceipts[inAppReceipts.length - 1]
        return {
          isValid: true,
          expiresAt: null,
          productId: latestInApp.product_id,
        }
      }
    }

    // 구독: latest_receipt_info에서 추출
    const latestReceipt = data.latest_receipt_info?.[0]
    if (latestReceipt) {
      const expiresMs = latestReceipt.expires_date_ms
      const productId = latestReceipt.product_id

      return {
        isValid: true,
        expiresAt: expiresMs ? new Date(Number(expiresMs)) : null,
        productId,
      }
    }

    return {
      isValid: false,
      expiresAt: null,
      error: 'No receipt info found',
    }
  } catch (error) {
    Sentry.captureException(error, {
      extra: { context: 'verifyAppleReceipt', purchaseType },
    })
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
 * 구독과 소모품(INAPP) 모두 지원
 */
export async function verifyGoogleReceipt(
  receipt: string,
  productId: string,
  purchaseType: PurchaseType = 'SUBSCRIPTION',
): Promise<VerificationResult> {
  try {
    const baseUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${env.GOOGLE_PACKAGE_NAME}`
    const headers = {
      Authorization: `Bearer ${env.GOOGLE_SERVICE_ACCOUNT_TOKEN}`,
    }

    // 소모품(INAPP): products API 사용
    if (purchaseType === 'EVENT_SLOT') {
      const url = `${baseUrl}/purchases/products/${productId}/tokens/${receipt}`
      const response = await fetch(url, { headers })

      if (!response.ok) {
        const errorText = await response.text()
        Sentry.captureMessage('[IAP] Google INAPP verification API failed', {
          level: 'error',
          extra: { productId, status: response.status, errorText },
        })
        return {
          isValid: false,
          expiresAt: null,
          error: `Google API error: ${response.status} - ${errorText}`,
        }
      }

      const data = await response.json()

      // purchaseState: 0 = Purchased, 1 = Canceled, 2 = Pending
      if (data.purchaseState !== 0) {
        Sentry.captureMessage('[IAP] Google INAPP purchase not completed', {
          level: 'error',
          extra: { productId, purchaseState: data.purchaseState, data },
        })
        return {
          isValid: false,
          expiresAt: null,
          error: `Purchase not completed: state ${data.purchaseState}`,
        }
      }

      return {
        isValid: true,
        expiresAt: null,
        productId,
      }
    }

    // 구독: subscriptionsv2 API 사용 (기존 로직)
    const url = `${baseUrl}/purchases/subscriptionsv2/tokens/${receipt}`
    const response = await fetch(url, { headers })

    if (!response.ok) {
      const errorText = await response.text()
      Sentry.captureMessage(
        '[IAP] Google subscription verification API failed',
        {
          level: 'error',
          extra: { productId, status: response.status, errorText },
        },
      )
      return {
        isValid: false,
        expiresAt: null,
        error: `Google API error: ${response.status} - ${errorText}`,
      }
    }

    const data = await response.json()

    // 구독 상태 확인
    if (data.subscriptionState !== 'SUBSCRIPTION_STATE_ACTIVE') {
      Sentry.captureMessage('[IAP] Google subscription not active', {
        level: 'error',
        extra: { productId, subscriptionState: data.subscriptionState, data },
      })
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
    Sentry.captureException(error, {
      extra: { context: 'verifyGoogleReceipt', productId, purchaseType },
    })
    return {
      isValid: false,
      expiresAt: null,
      error: String(error),
    }
  }
}
