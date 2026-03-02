'use client'

import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/hooks/use-auth'
import {
  getCurrentSubscription,
  getProducts,
  isIAPAvailable,
  manageSubscriptions,
  type Product,
  purchaseProduct,
  restorePurchases,
} from '@/libs/capacitor/iap'
import type { PlanType } from '@/libs/supabase/database.types'
import { useUIStore } from '@/stores/ui-store'
import { css, cx } from '@/styled-system/css'
import { flex, vstack } from '@/styled-system/patterns'
import { button, card } from '@/styled-system/recipes'

const PLAN_LABELS: Record<string, string> = {
  FREE: '무료',
  PREMIUM_MONTHLY: '월간 프리미엄',
  PREMIUM_YEARLY: '연간 프리미엄',
}

const PRODUCT_LABELS: Record<string, string> = {
  'com.dearmydays.premium.monthly': '월간 프리미엄 구독',
  'com.dearmydays.premium.yearly': '연간 프리미엄 구독',
  'com.dearmydays.event.slot': '이벤트 슬롯 추가',
}

function formatKST(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface PurchaseRecord {
  id: string
  purchase_type: string
  product_id: string
  amount: number
  currency: string
  created_at: string
  status?: 'COMPLETED' | 'REFUNDED'
  refunded_at?: string | null
}

export function SubscriptionClient() {
  const { user, isLoading: authLoading } = useAuth()
  const showToast = useUIStore((s) => s.showToast)

  const [nativeAvailable, setNativeAvailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null)
  const [restoreLoading, setRestoreLoading] = useState(false)

  const [planType, setPlanType] = useState<PlanType | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [extraEventSlots, setExtraEventSlots] = useState(0)
  const [eventLimit, setEventLimit] = useState(3)
  const [eventCount, setEventCount] = useState(0)
  const [monthlyAllowance, setMonthlyAllowance] = useState(0)

  const [subsProducts, setSubsProducts] = useState<Product[]>([])
  const [inappProducts, setInappProducts] = useState<Product[]>([])
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])

  const userId = user?.id ?? ''

  const loadData = useCallback(async () => {
    if (!userId) {
      return
    }
    setLoading(true)
    try {
      const [
        availableResult,
        subscriptionResult,
        productsResult,
        purchasesResult,
      ] = await Promise.allSettled([
        isIAPAvailable(),
        getCurrentSubscription(userId),
        getProducts(),
        fetch('/api/iap/purchases').then((r) =>
          r.ok ? r.json() : { data: [] },
        ),
      ])

      const available =
        availableResult.status === 'fulfilled' ? availableResult.value : false
      const subscription =
        subscriptionResult.status === 'fulfilled'
          ? subscriptionResult.value
          : {
              planType: null as PlanType | null,
              expiresAt: null,
              extraEventSlots: 0,
              eventLimit: 3,
              eventCount: 0,
              monthlyAllowance: 0,
            }
      const products =
        productsResult.status === 'fulfilled' ? productsResult.value : []
      const purchasesRes =
        purchasesResult.status === 'fulfilled'
          ? purchasesResult.value
          : { data: [] }

      setNativeAvailable(available)

      const subsFiltered = products.filter((p) => p.type === 'SUBS')
      const inappFiltered = products.filter((p) => p.type === 'INAPP')

      // Promise.allSettled에서 실패한 항목이 있으면 Sentry에 기록
      const failures: Record<string, string> = {}
      if (availableResult.status === 'rejected') {
        failures.available = String(availableResult.reason)
      }
      if (subscriptionResult.status === 'rejected') {
        failures.subscription = String(subscriptionResult.reason)
      }
      if (productsResult.status === 'rejected') {
        failures.products = String(productsResult.reason)
      }
      if (purchasesResult.status === 'rejected') {
        failures.purchases = String(purchasesResult.reason)
      }
      if (Object.keys(failures).length > 0) {
        Sentry.captureMessage('[Subscription] loadData partial failure', {
          level: 'error',
          extra: failures,
        })
      }

      // 버튼 노출 조건 디버깅: 어떤 조건이 실패하는지 추적
      const subsPlan = subscription.planType
      const subsPremium =
        subsPlan === 'PREMIUM_MONTHLY' || subsPlan === 'PREMIUM_YEARLY'
      if (subsFiltered.length === 0 || subsPremium) {
        Sentry.captureMessage('[Subscription] purchase buttons hidden', {
          level: 'error',
          extra: {
            planType: subsPlan,
            isPremium: subsPremium,
            subsCount: subsFiltered.length,
            inappCount: inappFiltered.length,
            totalProducts: products.length,
          },
        })
      }

      setPlanType(subscription.planType)
      setExpiresAt(subscription.expiresAt)
      setExtraEventSlots(subscription.extraEventSlots)
      setEventLimit(subscription.eventLimit)
      setEventCount(subscription.eventCount ?? 0)
      setMonthlyAllowance(subscription.monthlyAllowance ?? 0)
      setSubsProducts(subsFiltered)
      setInappProducts(inappFiltered)
      setPurchases(purchasesRes.data ?? [])
    } catch (error) {
      Sentry.captureException(error, {
        extra: { context: 'subscription-loadData' },
      })
      showToast('데이터를 불러오는데 실패했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }, [userId, showToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handlePurchase = async (productId: string) => {
    setPurchaseLoading(productId)
    try {
      const result = await purchaseProduct(
        productId as Parameters<typeof purchaseProduct>[0],
        userId,
      )
      if (result.success) {
        showToast('구매가 완료되었습니다!', 'success')
        await loadData()
      } else {
        showToast(result.error || '구매에 실패했습니다.', 'error')
      }
    } catch {
      showToast('구매 중 오류가 발생했습니다.', 'error')
    } finally {
      setPurchaseLoading(null)
    }
  }

  const handleRestore = async () => {
    setRestoreLoading(true)
    try {
      const result = await restorePurchases(userId)
      if (result.success) {
        showToast('구매 내역이 복원되었습니다.', 'success')
        await loadData()
      } else {
        showToast(result.error || '복원에 실패했습니다.', 'error')
      }
    } catch {
      showToast('복원 중 오류가 발생했습니다.', 'error')
    } finally {
      setRestoreLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    await manageSubscriptions()
  }

  const isPremium =
    planType === 'PREMIUM_MONTHLY' || planType === 'PREMIUM_YEARLY'

  const isLoading = authLoading || !user || loading

  return (
    <div className={css({ minHeight: '100vh', backgroundColor: 'background' })}>
      <header
        className={css({
          backgroundColor: 'white',
          borderBottom: '1px solid',
          borderColor: 'border',
          padding: '16px 0',
        })}
      >
        <div
          className={flex({
            maxWidth: 'container',
            margin: '0 auto',
            padding: '0 24px',
            justify: 'space-between',
            align: 'center',
          })}
        >
          <h1
            className={css({
              fontSize: '20px',
              fontWeight: 'bold',
              margin: 0,
            })}
          >
            구독 관리
          </h1>
          <Link href="/settings" className={button({ variant: 'secondary' })}>
            설정으로
          </Link>
        </div>
      </header>

      <main
        className={css({
          maxWidth: '800px',
          margin: '0 auto',
          padding: '24px',
        })}
      >
        {isLoading ? (
          <div className={vstack({ gap: '16px', alignItems: 'stretch' })}>
            {/* 현재 플랜 스켈레톤 */}
            <div className={card()}>
              <Skeleton width="80px" height="18px" />
              <div className={css({ marginTop: '12px' })}>
                <Skeleton width="160px" height="28px" />
              </div>
              <div className={css({ marginTop: '8px' })}>
                <Skeleton width="200px" height="14px" />
              </div>
            </div>
            {/* 상품 카드 스켈레톤 */}
            <div className={card()}>
              <Skeleton width="120px" height="18px" />
              <div className={css({ marginTop: '16px' })}>
                <Skeleton width="100%" height="14px" />
              </div>
              <div className={css({ marginTop: '12px' })}>
                <Skeleton width="100%" height="48px" borderRadius="8px" />
              </div>
              <div className={css({ marginTop: '12px' })}>
                <Skeleton width="100%" height="48px" borderRadius="8px" />
              </div>
            </div>
          </div>
        ) : (
          <div className={vstack({ gap: '16px', alignItems: 'stretch' })}>
            {/* 현재 플랜 */}
            <section className={card()}>
              <h2
                className={css({
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginTop: 0,
                  marginBottom: '12px',
                })}
              >
                현재 플랜
              </h2>
              <p
                className={css({
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: 0,
                  color: isPremium ? '#4F46E5' : '#666',
                })}
              >
                {PLAN_LABELS[planType || 'FREE'] || '무료'}
              </p>
              {isPremium && expiresAt && (
                <p
                  className={css({
                    color: '#666',
                    fontSize: '14px',
                    marginTop: '8px',
                    marginBottom: 0,
                  })}
                >
                  만료일: {formatKST(expiresAt)}
                </p>
              )}
              <p
                className={css({
                  color: '#666',
                  fontSize: '14px',
                  marginTop: '8px',
                  marginBottom: 0,
                })}
              >
                이벤트 등록:{' '}
                {isPremium ? (
                  <span>
                    월 {monthlyAllowance}개 (이월 포함 잔여:{' '}
                    {eventLimit - eventCount}개)
                  </span>
                ) : (
                  <span>{eventLimit}개</span>
                )}
                {!isPremium && extraEventSlots > 0 && (
                  <span className={css({ color: '#4F46E5' })}>
                    {' '}
                    (기본 3개 + 추가 {extraEventSlots}개)
                  </span>
                )}
              </p>

              {isPremium && nativeAvailable && (
                <div className={css({ marginTop: '16px' })}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManageSubscription}
                  >
                    스토어에서 구독 관리
                  </Button>
                  <p
                    className={css({
                      color: '#666',
                      fontSize: '12px',
                      marginTop: '8px',
                      marginBottom: 0,
                    })}
                  >
                    구독 취소는 App Store 또는 Google Play 스토어에서
                    가능합니다. 위 버튼을 누르면 스토어의 구독 관리 페이지로
                    이동합니다.
                  </p>
                </div>
              )}
            </section>

            {/* 웹 안내 */}
            {!nativeAvailable && (
              <section
                className={cx(
                  card(),
                  css({
                    backgroundColor: '#FFF7ED',
                    borderColor: '#FED7AA',
                  }),
                )}
              >
                <p
                  className={css({
                    margin: 0,
                    color: '#9A3412',
                    fontSize: '14px',
                  })}
                >
                  구독 및 추가 슬롯 구매는 모바일 앱에서만 가능합니다. iOS 또는
                  Android 앱을 이용해 주세요.
                </p>
              </section>
            )}

            {/* 구독 상품 */}
            {nativeAvailable && !isPremium && subsProducts.length > 0 && (
              <section className={card()}>
                <h2
                  className={css({
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginTop: 0,
                    marginBottom: '16px',
                  })}
                >
                  프리미엄 구독
                </h2>
                <p
                  className={css({
                    color: '#666',
                    fontSize: '14px',
                    marginTop: 0,
                    marginBottom: '16px',
                  })}
                >
                  프리미엄 구독 시 이벤트 등록 무제한 이용이 가능합니다.
                </p>
                <div className={vstack({ gap: '12px', alignItems: 'stretch' })}>
                  {subsProducts.map((product) => (
                    <div
                      key={product.id}
                      className={css({
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        border: '1px solid',
                        borderColor: 'border',
                        borderRadius: '8px',
                      })}
                    >
                      <div>
                        <div
                          className={css({
                            fontWeight: 700,
                            fontSize: '15px',
                          })}
                        >
                          {product.title}
                        </div>
                        <div
                          className={css({
                            color: '#666',
                            fontSize: '13px',
                            marginTop: '4px',
                          })}
                        >
                          {product.description}
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        loading={purchaseLoading === product.id}
                        disabled={purchaseLoading !== null}
                        onClick={() => handlePurchase(product.id)}
                      >
                        {product.price}
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 단건 상품 (이벤트 슬롯) */}
            {nativeAvailable && !isPremium && inappProducts.length > 0 && (
              <section className={card()}>
                <h2
                  className={css({
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginTop: 0,
                    marginBottom: '16px',
                  })}
                >
                  추가 이벤트 슬롯
                </h2>
                <p
                  className={css({
                    color: '#666',
                    fontSize: '14px',
                    marginTop: 0,
                    marginBottom: '16px',
                  })}
                >
                  구독 없이 이벤트 등록 슬롯을 추가로 구매할 수 있습니다.
                </p>
                <div className={vstack({ gap: '12px', alignItems: 'stretch' })}>
                  {inappProducts.map((product) => (
                    <div
                      key={product.id}
                      className={css({
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        border: '1px solid',
                        borderColor: 'border',
                        borderRadius: '8px',
                      })}
                    >
                      <div>
                        <div
                          className={css({
                            fontWeight: 700,
                            fontSize: '15px',
                          })}
                        >
                          {product.title}
                        </div>
                        <div
                          className={css({
                            color: '#666',
                            fontSize: '13px',
                            marginTop: '4px',
                          })}
                        >
                          {product.description}
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        loading={purchaseLoading === product.id}
                        disabled={purchaseLoading !== null}
                        onClick={() => handlePurchase(product.id)}
                      >
                        {product.price}
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 구매 기록 */}
            {purchases.length > 0 && (
              <section className={card()}>
                <h2
                  className={css({
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginTop: 0,
                    marginBottom: '16px',
                  })}
                >
                  구매 기록
                </h2>
                <div className={vstack({ gap: '8px', alignItems: 'stretch' })}>
                  {purchases.map((purchase) => {
                    const isRefunded = purchase.status === 'REFUNDED'
                    return (
                      <div
                        key={purchase.id}
                        className={css({
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          backgroundColor: isRefunded ? '#FEF2F2' : '#F9FAFB',
                          borderRadius: '8px',
                        })}
                      >
                        <div>
                          <div
                            className={css({
                              fontWeight: 600,
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            })}
                          >
                            {PRODUCT_LABELS[purchase.product_id] ||
                              purchase.product_id}
                            {isRefunded && (
                              <span
                                className={css({
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: '#DC2626',
                                  backgroundColor: '#FEE2E2',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                })}
                              >
                                환불됨
                              </span>
                            )}
                          </div>
                          <div
                            className={css({
                              color: '#666',
                              fontSize: '12px',
                              marginTop: '2px',
                            })}
                          >
                            {formatKST(purchase.created_at)}
                            {isRefunded && purchase.refunded_at && (
                              <span className={css({ color: '#DC2626' })}>
                                {' '}
                                · 환불 {formatKST(purchase.refunded_at)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          className={css({
                            fontWeight: 600,
                            fontSize: '14px',
                            color: isRefunded ? '#DC2626' : '#333',
                            textDecoration: isRefunded
                              ? 'line-through'
                              : 'none',
                          })}
                        >
                          {purchase.amount.toLocaleString('ko-KR')}원
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* 복원 */}
            {nativeAvailable && (
              <section className={card()}>
                <h2
                  className={css({
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginTop: 0,
                    marginBottom: '12px',
                  })}
                >
                  구매 복원
                </h2>
                <p
                  className={css({
                    color: '#666',
                    fontSize: '14px',
                    marginTop: 0,
                    marginBottom: '16px',
                  })}
                >
                  이전에 구매한 항목을 이 계정으로 복원합니다. 기기를 변경했거나
                  앱을 재설치한 경우 사용하세요.
                </p>
                <Button
                  variant="outline"
                  size="md"
                  loading={restoreLoading}
                  onClick={handleRestore}
                >
                  구매 내역 복원
                </Button>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
