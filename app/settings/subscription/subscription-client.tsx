'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { SettingsSkeleton } from '@/components/skeletons/SettingsSkeleton'
import { Button } from '@/components/ui/Button'
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

interface PurchaseRecord {
  id: string
  purchase_type: string
  product_id: string
  amount: number
  currency: string
  created_at: string
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
      const [available, subscription, products, purchasesRes] =
        await Promise.all([
          isIAPAvailable(),
          getCurrentSubscription(userId),
          getProducts(),
          fetch('/api/iap/purchases').then((r) =>
            r.ok ? r.json() : { data: [] },
          ),
        ])

      setNativeAvailable(available)
      setPlanType(subscription.planType)
      setExpiresAt(subscription.expiresAt)
      setExtraEventSlots(subscription.extraEventSlots)
      setEventLimit(subscription.eventLimit)
      setSubsProducts(products.filter((p) => p.type === 'SUBS'))
      setInappProducts(products.filter((p) => p.type === 'INAPP'))
      setPurchases(purchasesRes.data ?? [])
    } catch {
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

  if (authLoading) {
    return <SettingsSkeleton />
  }

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
        {loading ? (
          <div
            className={css({
              textAlign: 'center',
              padding: '40px 0',
              color: '#666',
            })}
          >
            불러오는 중...
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
                  만료일: {new Date(expiresAt).toLocaleDateString('ko-KR')}
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
                이벤트 등록 제한: {isPremium ? '무제한' : `${eventLimit}개`}
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
                  {purchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className={css({
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '8px',
                      })}
                    >
                      <div>
                        <div
                          className={css({
                            fontWeight: 600,
                            fontSize: '14px',
                          })}
                        >
                          {PRODUCT_LABELS[purchase.product_id] ||
                            purchase.product_id}
                        </div>
                        <div
                          className={css({
                            color: '#666',
                            fontSize: '12px',
                            marginTop: '2px',
                          })}
                        >
                          {new Date(purchase.created_at).toLocaleDateString(
                            'ko-KR',
                          )}
                        </div>
                      </div>
                      <div
                        className={css({
                          fontWeight: 600,
                          fontSize: '14px',
                          color: '#333',
                        })}
                      >
                        {purchase.amount.toLocaleString('ko-KR')}원
                      </div>
                    </div>
                  ))}
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
