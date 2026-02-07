'use client'

import type { PlanType } from '@/libs/supabase/database.types'
import { isNative } from './platform'

/**
 * 인앱결제 상품 ID 매핑
 */
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'com.dearmydays.premium.monthly',
  PREMIUM_YEARLY: 'com.dearmydays.premium.yearly',
  EVENT_SLOT: 'com.dearmydays.event.slot',
} as const

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS]

/**
 * 상품 정보
 */
export interface Product {
  id: ProductId
  title: string
  description: string
  price: string
  priceValue: number
  currency: string
  platform: 'ios' | 'android' | 'web'
}

/**
 * 구매 결과
 */
export interface PurchaseResult {
  success: boolean
  error?: string
  transactionId?: string
}

/**
 * IAP 가능 여부 확인
 */
export async function isIAPAvailable(): Promise<boolean> {
  return await isNative()
}

/**
 * 상품 목록 조회 (Mock 구현)
 * 실제 구현 시 네이티브 코드와 통신하여 스토어에서 가격 정보 가져옴
 */
export async function getProducts(): Promise<Product[]> {
  if (!(await isNative())) {
    // 웹에서는 Mock 데이터 반환
    return [
      {
        id: PRODUCT_IDS.PREMIUM_MONTHLY,
        title: '프리미엄 월간',
        description: '무제한 이벤트 + 모든 기능',
        price: '₩4,900',
        priceValue: 4900,
        currency: 'KRW',
        platform: 'web',
      },
      {
        id: PRODUCT_IDS.PREMIUM_YEARLY,
        title: '프리미엄 연간',
        description: '무제한 이벤트 + 모든 기능 (2개월 무료)',
        price: '₩49,000',
        priceValue: 49000,
        currency: 'KRW',
        platform: 'web',
      },
      {
        id: PRODUCT_IDS.EVENT_SLOT,
        title: '이벤트 슬롯 1개',
        description: '추가 이벤트 등록 슬롯 (영구)',
        price: '₩990',
        priceValue: 990,
        currency: 'KRW',
        platform: 'web',
      },
    ]
  }

  // TODO: 네이티브 구현
  // 실제로는 네이티브 코드를 호출하여 스토어에서 상품 정보 가져옴
  // iOS: StoreKit 2
  // Android: Google Play Billing Library
  throw new Error('Native IAP not implemented yet')
}

/**
 * 구독 구매
 */
export async function purchaseSubscription(
  _productId: ProductId,
  _userId: string,
): Promise<PurchaseResult> {
  try {
    if (!(await isNative())) {
      return {
        success: false,
        error: 'IAP is only available in native app',
      }
    }

    // TODO: 네이티브 구현
    // 1. 네이티브 IAP 시작
    // 2. 영수증 받기
    // 3. 서버로 검증 요청

    throw new Error('Native IAP not implemented yet')
  } catch (error) {
    console.error('Purchase failed:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * 구독 복원
 */
export async function restorePurchases(
  _userId: string,
): Promise<PurchaseResult> {
  try {
    if (!(await isNative())) {
      return {
        success: false,
        error: 'IAP is only available in native app',
      }
    }

    // TODO: 네이티브 구현
    // 1. 네이티브 복원 API 호출
    // 2. 복원된 구매 목록 가져오기
    // 3. 서버에 동기화

    throw new Error('Native IAP not implemented yet')
  } catch (error) {
    console.error('Restore failed:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * 현재 구독 상태 조회
 */
export async function getCurrentSubscription(_userId: string): Promise<{
  planType: PlanType | null
  expiresAt: string | null
}> {
  try {
    const response = await fetch('/api/iap/subscription', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch subscription')
    }

    const data = await response.json()
    return data.data || { planType: null, expiresAt: null }
  } catch (error) {
    console.error('Failed to get subscription:', error)
    return { planType: null, expiresAt: null }
  }
}
