'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  getCurrentSubscription,
  getProducts,
  isIAPAvailable,
  type Product,
  purchaseSubscription,
  restorePurchases,
} from '@/libs/capacitor/iap'
import { createSupabaseBrowser } from '@/libs/supabase/browser'
import type { PlanType } from '@/libs/supabase/database.types'
import { css, cx } from '@/styled-system/css'
import { vstack } from '@/styled-system/patterns'
import { button, card } from '@/styled-system/recipes'

export default function SubscriptionPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowser()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [iapEnabled, setIapEnabled] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<PlanType | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function initialize() {
      try {
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
        const subscription = await getCurrentSubscription(user.id)
        setCurrentPlan(subscription.planType)
        setExpiresAt(subscription.expiresAt)

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
  }, [supabase, router])

  const handlePurchase = async (productId: string) => {
    setPurchasing(true)
    setMessage('')

    try {
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
        setMessage('구독이 완료되었습니다!')
        // 구독 상태 다시 조회
        const subscription = await getCurrentSubscription(user.id)
        setCurrentPlan(subscription.planType)
        setExpiresAt(subscription.expiresAt)
      } else {
        setMessage(`구독 실패: ${result.error}`)
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
        const subscription = await getCurrentSubscription(user.id)
        setCurrentPlan(subscription.planType)
        setExpiresAt(subscription.expiresAt)
      } else {
        setMessage(`복원 실패: ${result.error}`)
      }
    } catch (error) {
      setMessage(`오류: ${String(error)}`)
    } finally {
      setRestoring(false)
    }
  }

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

      {currentPlan && (
        <div
          className={cx(
            card(),
            css({
              marginBottom: '20px',
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
            현재 구독
          </h2>
          <p>플랜: {currentPlan}</p>
          {expiresAt && (
            <p className={css({ color: '#666', fontSize: '14px' })}>
              만료일: {new Date(expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      <div className={vstack({ gap: '16px', marginBottom: '20px' })}>
        {products.map((product) => (
          <div key={product.id} className={card()}>
            <h3
              className={css({
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '8px',
              })}
            >
              {product.title}
            </h3>
            <p
              className={css({
                color: '#666',
                marginBottom: '12px',
                fontSize: '14px',
              })}
            >
              {product.description}
            </p>
            <p
              className={css({
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'primary',
                marginBottom: '12px',
              })}
            >
              {product.price}
            </p>
            <button
              type="button"
              onClick={() => handlePurchase(product.id)}
              disabled={purchasing || !iapEnabled}
              className={cx(
                button({ variant: 'primary' }),
                css({
                  width: '100%',
                  cursor: purchasing || !iapEnabled ? 'not-allowed' : 'pointer',
                  opacity: purchasing || !iapEnabled ? 0.6 : 1,
                }),
              )}
            >
              {purchasing ? '처리 중...' : '구독하기'}
            </button>
          </div>
        ))}
      </div>

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
            }),
          )}
        >
          {restoring ? '복원 중...' : '구독 복원하기'}
        </button>
      )}

      <div
        className={css({
          marginTop: '20px',
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
          • 구독 취소는 iOS 설정 또는 Google Play에서 가능합니다.
        </p>
        <p>• 구독 복원은 이전에 구매한 내역이 있을 때만 가능합니다.</p>
      </div>
    </div>
  )
}
