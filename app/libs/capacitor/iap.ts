'use client'

import type { PlanType } from '@/libs/supabase/database.types'
import { getPlatform, isNative } from './platform'

export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'com.dearmydays.premium.monthly',
  PREMIUM_YEARLY: 'com.dearmydays.premium.yearly',
  EVENT_SLOT: 'com.dearmydays.event.slot',
} as const

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS]

const PLAN_IDENTIFIERS: Partial<Record<ProductId, string>> = {
  [PRODUCT_IDS.PREMIUM_MONTHLY]: 'monthly-plan',
  [PRODUCT_IDS.PREMIUM_YEARLY]: 'yearly-plan',
}

const INAPP_PRODUCT_IDS: ProductId[] = [PRODUCT_IDS.EVENT_SLOT]

function isInAppProduct(productId: ProductId): boolean {
  return INAPP_PRODUCT_IDS.includes(productId)
}

export interface Product {
  id: ProductId
  title: string
  description: string
  price: string
  priceValue: number
  currency: string
  platform: 'ios' | 'android' | 'web'
  type: 'SUBS' | 'INAPP'
}

export interface PurchaseResult {
  success: boolean
  error?: string
  transactionId?: string
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: PRODUCT_IDS.PREMIUM_MONTHLY,
    title: '월간 프리미엄',
    description: '월간 프리미엄 구독',
    price: '₩4,900',
    priceValue: 4900,
    currency: 'KRW',
    platform: 'web',
    type: 'SUBS',
  },
  {
    id: PRODUCT_IDS.PREMIUM_YEARLY,
    title: '연간 프리미엄',
    description: '연간 프리미엄 구독 (2개월 무료)',
    price: '₩49,000',
    priceValue: 49000,
    currency: 'KRW',
    platform: 'web',
    type: 'SUBS',
  },
  {
    id: PRODUCT_IDS.EVENT_SLOT,
    title: '이벤트 슬롯 추가',
    description: '이벤트 등록 슬롯 1개 추가',
    price: '₩1,900',
    priceValue: 1900,
    currency: 'KRW',
    platform: 'web',
    type: 'INAPP',
  },
]

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])
}

export async function isIAPAvailable(): Promise<boolean> {
  if (!(await isNative())) {
    return false
  }
  try {
    const { NativePurchases } = await import('@capgo/native-purchases')
    return await withTimeout(
      NativePurchases.isBillingSupported().then((r) => r.isBillingSupported),
      10000,
      false,
    )
  } catch {
    return false
  }
}

export async function getProducts(): Promise<Product[]> {
  if (!(await isNative())) {
    return MOCK_PRODUCTS
  }

  try {
    const { NativePurchases, PURCHASE_TYPE } = await import(
      '@capgo/native-purchases'
    )
    const platform = await getPlatform()

    const subsIds = [PRODUCT_IDS.PREMIUM_MONTHLY, PRODUCT_IDS.PREMIUM_YEARLY]
    const inappIds = [PRODUCT_IDS.EVENT_SLOT]

    const [subsResult, inappResult] = await withTimeout(
      Promise.all([
        NativePurchases.getProducts({
          productIdentifiers: [...subsIds],
          productType: PURCHASE_TYPE.SUBS,
        }),
        NativePurchases.getProducts({
          productIdentifiers: [...inappIds],
          productType: PURCHASE_TYPE.INAPP,
        }),
      ]),
      10000,
      [{ products: [] }, { products: [] }],
    )

    const products: Product[] = []

    for (const p of subsResult.products) {
      const productId = (p.planIdentifier || p.identifier) as ProductId
      products.push({
        id: productId,
        title: p.title || productId,
        description: p.description || '',
        price: p.priceString || `${p.price}`,
        priceValue: p.price,
        currency: p.currencyCode || 'KRW',
        platform: platform as 'ios' | 'android',
        type: 'SUBS',
      })
    }

    for (const p of inappResult.products) {
      products.push({
        id: p.identifier as ProductId,
        title: p.title || p.identifier,
        description: p.description || '',
        price: p.priceString || `${p.price}`,
        priceValue: p.price,
        currency: p.currencyCode || 'KRW',
        platform: platform as 'ios' | 'android',
        type: 'INAPP',
      })
    }

    return products
  } catch {
    return MOCK_PRODUCTS
  }
}

export async function purchaseProduct(
  productId: ProductId,
  userId: string,
): Promise<PurchaseResult> {
  if (!(await isNative())) {
    return { success: false, error: '모바일 앱에서만 구매할 수 있습니다.' }
  }

  try {
    const { NativePurchases, PURCHASE_TYPE } = await import(
      '@capgo/native-purchases'
    )
    const platform = await getPlatform()

    const productType = isInAppProduct(productId)
      ? PURCHASE_TYPE.INAPP
      : PURCHASE_TYPE.SUBS

    const purchaseOptions: Parameters<
      typeof NativePurchases.purchaseProduct
    >[0] = {
      productIdentifier: productId,
      productType,
    }

    const planId = PLAN_IDENTIFIERS[productId]
    if (planId && productType === PURCHASE_TYPE.SUBS) {
      purchaseOptions.planIdentifier = planId
    }

    const result = await NativePurchases.purchaseProduct(purchaseOptions)

    const transactionId = result.transactionId
    const receipt =
      platform === 'ios'
        ? result.receipt || result.jwsRepresentation
        : result.purchaseToken

    if (!receipt || !transactionId) {
      return { success: false, error: '구매 정보를 가져올 수 없습니다.' }
    }

    const provider = platform === 'ios' ? 'APPLE' : 'GOOGLE'

    const response = await fetch('/api/iap/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receipt,
        transactionId,
        provider,
        userId,
        productId,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || '서버 검증에 실패했습니다.',
        transactionId,
      }
    }

    return { success: true, transactionId }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '구매에 실패했습니다.'
    if (message.includes('cancel') || message.includes('Cancel')) {
      return { success: false, error: '구매가 취소되었습니다.' }
    }
    return { success: false, error: message }
  }
}

export async function restorePurchases(
  userId: string,
): Promise<PurchaseResult> {
  if (!(await isNative())) {
    return { success: false, error: '모바일 앱에서만 복원할 수 있습니다.' }
  }

  try {
    const { NativePurchases } = await import('@capgo/native-purchases')
    const platform = await getPlatform()
    const provider = platform === 'ios' ? 'APPLE' : 'GOOGLE'

    await NativePurchases.restorePurchases()
    const { purchases } = await NativePurchases.getPurchases()

    if (!purchases || purchases.length === 0) {
      return { success: false, error: '복원할 구매 내역이 없습니다.' }
    }

    let restoredCount = 0

    for (const purchase of purchases) {
      const transactionId = purchase.transactionId
      const receipt =
        platform === 'ios'
          ? purchase.receipt || purchase.jwsRepresentation
          : purchase.purchaseToken
      const productId = purchase.productIdentifier

      if (!receipt || !transactionId) {
        continue
      }

      try {
        const response = await fetch('/api/iap/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receipt,
            transactionId,
            provider,
            userId,
            productId,
          }),
        })

        if (response.ok) {
          restoredCount++
        }
      } catch {
        // 개별 복원 실패는 무시하고 계속
      }
    }

    if (restoredCount === 0) {
      return { success: false, error: '유효한 구매 내역을 찾을 수 없습니다.' }
    }

    return { success: true }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '복원에 실패했습니다.'
    return { success: false, error: message }
  }
}

export async function getCurrentSubscription(_userId: string): Promise<{
  planType: PlanType | null
  expiresAt: string | null
  extraEventSlots: number
  eventLimit: number
}> {
  try {
    const response = await fetch('/api/iap/subscription', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch subscription')
    }

    const data = await response.json()
    return (
      data.data || {
        planType: null,
        expiresAt: null,
        extraEventSlots: 0,
        eventLimit: 3,
      }
    )
  } catch {
    return {
      planType: null,
      expiresAt: null,
      extraEventSlots: 0,
      eventLimit: 3,
    }
  }
}

export async function manageSubscriptions(): Promise<void> {
  if (!(await isNative())) {
    return
  }
  try {
    const { NativePurchases } = await import('@capgo/native-purchases')
    await NativePurchases.manageSubscriptions()
  } catch {
    // 관리 페이지를 열 수 없는 경우 무시
  }
}
