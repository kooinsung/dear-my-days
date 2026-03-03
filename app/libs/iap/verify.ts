import * as Sentry from '@sentry/nextjs'
import { env } from '@/libs/config/env'
import { getGooglePlayAccessToken } from '@/libs/iap/google-auth'
import type { PurchaseType } from '@/libs/supabase/database.types'

export type { PurchaseType }

/**
 * 영수증 검증 결과
 */
export interface VerificationResult {
  isValid: boolean
  expiresAt: Date | null
  productId?: string
  orderId?: string
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

    if (data.status !== 0) {
      Sentry.captureMessage('[IAP] Apple verification failed', {
        level: 'error',
        extra: { status: data.status, purchaseType },
      })
      return {
        isValid: false,
        expiresAt: null,
        error: `Apple verification failed with status ${data.status}`,
      }
    }

    // 소모품(INAPP): EVENT_SLOT이면 in_app 분기를 먼저 처리
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

    Sentry.captureMessage('[IAP] Apple receipt has no info', {
      level: 'warning',
      extra: { purchaseType, hasInApp: !!data.receipt?.in_app },
    })
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
    const accessToken = await getGooglePlayAccessToken()
    const baseUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${env.GOOGLE_PACKAGE_NAME}`
    const headers = {
      Authorization: `Bearer ${accessToken}`,
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
          extra: { productId, purchaseState: data.purchaseState },
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
        orderId: data.orderId,
      }
    }

    // 구독: subscriptionsv2 API 사용
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

    if (data.subscriptionState !== 'SUBSCRIPTION_STATE_ACTIVE') {
      Sentry.captureMessage('[IAP] Google subscription not active', {
        level: 'error',
        extra: { productId, subscriptionState: data.subscriptionState },
      })
      return {
        isValid: false,
        expiresAt: null,
        error: `Subscription not active: ${data.subscriptionState}`,
      }
    }

    const expiryTime = data.lineItems?.[0]?.expiryTime

    return {
      isValid: true,
      expiresAt: expiryTime ? new Date(expiryTime) : null,
      productId: data.lineItems?.[0]?.productId || productId,
      orderId: data.latestOrderId,
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

/**
 * Google Play 구매 확인(acknowledge)
 * 확인하지 않으면 Google이 자동으로 환불 처리함 (테스트: 3분, 프로덕션: 3일)
 */
export async function acknowledgeGooglePurchase(
  purchaseToken: string,
  productId: string,
  purchaseType: PurchaseType = 'SUBSCRIPTION',
): Promise<boolean> {
  try {
    const accessToken = await getGooglePlayAccessToken()
    const baseUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${env.GOOGLE_PACKAGE_NAME}`

    const endpoint =
      purchaseType === 'EVENT_SLOT'
        ? `${baseUrl}/purchases/products/${productId}/tokens/${purchaseToken}:acknowledge`
        : `${baseUrl}/purchases/subscriptions/${productId}/tokens/${purchaseToken}:acknowledge`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      Sentry.captureMessage('[IAP] Google acknowledge failed', {
        level: 'error',
        extra: {
          productId,
          purchaseType,
          status: response.status,
          errorText,
        },
      })
      return false
    }

    return true
  } catch (error) {
    Sentry.captureException(error, {
      extra: { context: 'acknowledgeGooglePurchase', productId, purchaseType },
    })
    return false
  }
}
