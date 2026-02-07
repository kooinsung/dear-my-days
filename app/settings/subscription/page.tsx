'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  getCurrentSubscription,
  getProducts,
  isIAPAvailable,
  type Product,
  type ProductId,
  purchaseSubscription,
  restorePurchases,
} from '@/libs/capacitor/iap'
import { createSupabaseBrowser } from '@/libs/supabase/browser'
import type { PlanType } from '@/libs/supabase/database.types'
import { css, cx } from '@/styled-system/css'
import { vstack } from '@/styled-system/patterns'
import { button, card } from '@/styled-system/recipes'

// Force dynamic rendering (disable static generation)
export const dynamic = 'force-dynamic'

type SubscriptionInfo = {
  planType: PlanType | null
  expiresAt: string | null
  extraEventSlots: number
  eventLimit: number
}

export default function SubscriptionPage() {
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [iapEnabled, setIapEnabled] = useState(false)
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    planType: 'FREE',
    expiresAt: null,
    extraEventSlots: 0,
    eventLimit: 3,
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function initialize() {
      try {
        // Supabase 클라이언트 생성 (클라이언트에서만)
        const supabase = createSupabaseBrowser()

        // IAP 가능 여부 확인
        const available = await isIAPAvailable()
        setIapEnabled(available)

        // 현재 사용자 확인
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // 현재 구독 상태 조회
        const subscriptionInfo = await getCurrentSubscription(user.id)
        setSubscription(subscriptionInfo as SubscriptionInfo)

        // 상품 목록 조회
        if (available) {
          try {
            const productList = await getProducts()
            setProducts(productList)
          } catch (error) {
            console.error('Failed to load products:', error)
            setMessage('상품 목록을 불러오지 못했습니다.')
          }
        } else {
          // 웹에서는 Mock 데이터 표시
          const productList = await getProducts()
          setProducts(productList)
        }
      } catch (error) {
        console.error('Initialization error:', error)
        setMessage('초기화 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [router])

  const handlePurchase = async (productId: ProductId) => {
    setPurchasing(true)
    setMessage('')

    try {
      const supabase = createSupabaseBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setMessage('로그인이 필요합니다.')
        return
      }

      if (!iapEnabled) {
        setMessage('인앱결제는 모바일 앱에서만 가능합니다.')
        return
      }

      const result = await purchaseSubscription(productId, user.id)

      if (result.success) {
        const isEventSlot = productId.includes('event.slot')
        setMessage(
          isEventSlot
            ? '이벤트 슬롯 구매가 완료되었습니다!'
            : '구독이 완료되었습니다!',
        )
        // 구독 상태 다시 조회
        const subscriptionInfo = await getCurrentSubscription(user.id)
        setSubscription(subscriptionInfo as SubscriptionInfo)
      } else {
        setMessage(`구매 실패: ${result.error}`)
      }
    } catch (error) {
      setMessage(`오류: ${String(error)}`)
    } finally {
      setPurchasing(false)
    }
  }

  const handleRestore = async () => {
    setRestoring(true)
    setMessage('')

    try {
      const supabase = createSupabaseBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setMessage('로그인이 필요합니다.')
        return
      }

      if (!iapEnabled) {
        setMessage('구독 복원은 모바일 앱에서만 가능합니다.')
        return
      }

      const result = await restorePurchases(user.id)

      if (result.success) {
        setMessage('구독이 복원되었습니다!')
        // 구독 상태 다시 조회
        const subscriptionInfo = await getCurrentSubscription(user.id)
        setSubscription(subscriptionInfo as SubscriptionInfo)
      } else {
        setMessage(`복원 실패: ${result.error}`)
      }
    } catch (error) {
      setMessage(`오류: ${String(error)}`)
    } finally {
      setRestoring(false)
    }
  }

  const getPlanDisplayName = (planType: PlanType | null): string => {
    switch (planType) {
      case 'PREMIUM_MONTHLY':
        return '프리미엄 월간'
      case 'PREMIUM_YEARLY':
        return '프리미엄 연간'
      case 'FREE':
        return '무료'
      default:
        return '무료'
    }
  }

  const isPremium =
    subscription.planType === 'PREMIUM_MONTHLY' ||
    subscription.planType === 'PREMIUM_YEARLY'

  // 구독 상품과 이벤트 슬롯 상품 분리
  const subscriptionProducts = products.filter((p) => p.id.includes('premium'))
  const eventSlotProducts = products.filter((p) => p.id.includes('event.slot'))

  if (loading) {
    return (
      <div
        className={css({
          padding: '20px',
          textAlign: 'center',
        })}
      >
        로딩 중...
      </div>
    )
  }

  return (
    <div
      className={css({
        padding: '20px',
        maxWidth: '600px',
        margin: '0 auto',
      })}
    >
      <h1
        className={css({
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '20px',
        })}
      >
        구독 관리
      </h1>

      {!iapEnabled && (
        <div
          className={css({
            padding: '12px',
            marginBottom: '20px',
            backgroundColor: '#fff3cd',
            color: '#856404',
            borderRadius: '4px',
          })}
        >
          인앱결제는 모바일 앱에서만 가능합니다.
        </div>
      )}

      {message && (
        <div
          className={css({
            padding: '12px',
            marginBottom: '20px',
            backgroundColor: '#d1ecf1',
            color: '#0c5460',
            borderRadius: '4px',
          })}
        >
          {message}
        </div>
      )}

      {/* 현재 구독 정보 */}
      <div
        className={cx(
          card(),
          css({
            marginBottom: '24px',
          }),
        )}
      >
        <h2
          className={css({
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '12px',
          })}
        >
          현재 플랜
        </h2>
        <div
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          })}
        >
          <span
            className={css({
              fontSize: '20px',
              fontWeight: 'bold',
              color: isPremium ? '#4CAF50' : '#666',
            })}
          >
            {getPlanDisplayName(subscription.planType)}
          </span>
          {isPremium && (
            <span
              className={css({
                fontSize: '12px',
                padding: '2px 8px',
                backgroundColor: '#4CAF50',
                color: 'white',
                borderRadius: '12px',
              })}
            >
              활성
            </span>
          )}
        </div>

        {subscription.expiresAt && (
          <p
            className={css({
              color: '#666',
              fontSize: '14px',
              marginBottom: '8px',
            })}
          >
            만료일: {new Date(subscription.expiresAt).toLocaleDateString()}
          </p>
        )}

        <div
          className={css({
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
          })}
        >
          <p className={css({ fontSize: '14px', marginBottom: '4px' })}>
            <strong>이벤트 등록 제한:</strong>{' '}
            {isPremium ? '무제한' : `${subscription.eventLimit}개`}
          </p>
          {!isPremium && subscription.extraEventSlots > 0 && (
            <p className={css({ fontSize: '14px', color: '#666' })}>
              (기본 3개 + 추가 {subscription.extraEventSlots}개)
            </p>
          )}
        </div>
      </div>

      {/* 구독 상품 */}
      {subscriptionProducts.length > 0 && (
        <>
          <h2
            className={css({
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '12px',
            })}
          >
            프리미엄 구독
          </h2>
          <div className={vstack({ gap: '16px', marginBottom: '24px' })}>
            {subscriptionProducts.map((product) => (
              <div key={product.id} className={card()}>
                <div
                  className={css({
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  })}
                >
                  <h3
                    className={css({
                      fontSize: '18px',
                      fontWeight: 'bold',
                    })}
                  >
                    {product.title}
                  </h3>
                  <p
                    className={css({
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#4CAF50',
                    })}
                  >
                    {product.price}
                  </p>
                </div>
                <p
                  className={css({
                    color: '#666',
                    marginBottom: '12px',
                    fontSize: '14px',
                  })}
                >
                  {product.description}
                </p>
                <button
                  type="button"
                  onClick={() => handlePurchase(product.id)}
                  disabled={purchasing || !iapEnabled}
                  className={cx(
                    button({ variant: 'primary' }),
                    css({
                      width: '100%',
                      cursor:
                        purchasing || !iapEnabled ? 'not-allowed' : 'pointer',
                      opacity: purchasing || !iapEnabled ? 0.6 : 1,
                    }),
                  )}
                >
                  {purchasing ? '처리 중...' : '구독하기'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 이벤트 슬롯 상품 */}
      {eventSlotProducts.length > 0 && (
        <>
          <h2
            className={css({
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '12px',
            })}
          >
            추가 이벤트 슬롯
          </h2>
          <div className={vstack({ gap: '16px', marginBottom: '24px' })}>
            {eventSlotProducts.map((product) => (
              <div key={product.id} className={card()}>
                <div
                  className={css({
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  })}
                >
                  <h3
                    className={css({
                      fontSize: '18px',
                      fontWeight: 'bold',
                    })}
                  >
                    {product.title}
                  </h3>
                  <p
                    className={css({
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#FF9800',
                    })}
                  >
                    {product.price}
                  </p>
                </div>
                <p
                  className={css({
                    color: '#666',
                    marginBottom: '12px',
                    fontSize: '14px',
                  })}
                >
                  {product.description}
                </p>
                <button
                  type="button"
                  onClick={() => handlePurchase(product.id)}
                  disabled={purchasing || !iapEnabled || isPremium}
                  className={cx(
                    button({ variant: 'secondary' }),
                    css({
                      width: '100%',
                      cursor:
                        purchasing || !iapEnabled || isPremium
                          ? 'not-allowed'
                          : 'pointer',
                      opacity: purchasing || !iapEnabled || isPremium ? 0.6 : 1,
                    }),
                  )}
                >
                  {isPremium
                    ? '프리미엄 회원은 무제한'
                    : purchasing
                      ? '처리 중...'
                      : '구매하기'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {iapEnabled && (
        <button
          type="button"
          onClick={handleRestore}
          disabled={restoring}
          className={cx(
            button({ variant: 'secondary' }),
            css({
              width: '100%',
              cursor: restoring ? 'not-allowed' : 'pointer',
              opacity: restoring ? 0.6 : 1,
              marginBottom: '20px',
            }),
          )}
        >
          {restoring ? '복원 중...' : '구독 복원하기'}
        </button>
      )}

      <div
        className={css({
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#666',
        })}
      >
        <p className={css({ marginBottom: '8px' })}>
          • 구독은 자동 갱신됩니다.
        </p>
        <p className={css({ marginBottom: '8px' })}>
          • 이벤트 슬롯은 1회 구매 시 영구적으로 사용 가능합니다.
        </p>
        <p className={css({ marginBottom: '8px' })}>
          • 프리미엄 구독 시 이벤트를 무제한으로 등록할 수 있습니다.
        </p>
        <p className={css({ marginBottom: '8px' })}>
          • 구독 취소는 iOS 설정 또는 Google Play에서 가능합니다.
        </p>
        <p>• 구독 복원은 이전에 구매한 내역이 있을 때만 가능합니다.</p>
      </div>
    </div>
  )
}
