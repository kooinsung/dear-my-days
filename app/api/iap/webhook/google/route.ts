import { type NextRequest, NextResponse } from 'next/server'
import { env } from '@/libs/config/env'
import { processRefund } from '@/libs/iap/refund'
import { handleApiError } from '@/libs/utils/errors'

// Google RTDN subscription notification types
const SUBSCRIPTION_REVOKED = 12

// Google RTDN one-time product notification types
const ONE_TIME_CANCELED = 2

function verifyAuth(req: NextRequest): boolean {
  const token = env.GOOGLE_RTDN_AUTH_TOKEN
  if (!token) {
    return true // 토큰 미설정 시 검증 스킵
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return false
  }

  const bearerToken = authHeader.replace('Bearer ', '')
  return bearerToken === token
}

export async function POST(req: NextRequest) {
  try {
    // Bearer 토큰 인증
    if (!verifyAuth(req)) {
      // 인증 실패해도 200 반환 (재시도 방지)
      return NextResponse.json({ status: 'unauthorized' }, { status: 200 })
    }

    const body = await req.json()

    // Pub/Sub 메시지 디코딩
    const messageData = body.message?.data
    if (!messageData) {
      return NextResponse.json({ status: 'missing_data' }, { status: 200 })
    }

    let decodedData: Record<string, unknown>
    try {
      const decoded = Buffer.from(messageData, 'base64').toString('utf-8')
      decodedData = JSON.parse(decoded)
    } catch {
      return NextResponse.json({ status: 'invalid_data' }, { status: 200 })
    }

    const packageName = decodedData.packageName as string | undefined

    // 패키지명 검증
    const expectedPackage = env.GOOGLE_PACKAGE_NAME
    if (expectedPackage && packageName !== expectedPackage) {
      return NextResponse.json({ status: 'package_mismatch' }, { status: 200 })
    }

    // voidedPurchaseNotification 처리 (환불/취소)
    const voidedPurchase = decodedData.voidedPurchaseNotification as
      | Record<string, unknown>
      | undefined

    if (voidedPurchase) {
      const orderId = voidedPurchase.orderId as string
      if (orderId) {
        await processRefund({
          transactionId: orderId,
          provider: 'GOOGLE',
          reason: `Google voidedPurchaseNotification (productType: ${voidedPurchase.productType})`,
        })
      }
      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    // subscriptionNotification 처리 (REVOKED = 환불)
    const subscriptionNotification = decodedData.subscriptionNotification as
      | Record<string, unknown>
      | undefined

    if (subscriptionNotification) {
      const notificationType =
        subscriptionNotification.notificationType as number
      if (notificationType === SUBSCRIPTION_REVOKED) {
        const purchaseToken = subscriptionNotification.purchaseToken as string
        if (purchaseToken) {
          await processRefund({
            transactionId: purchaseToken,
            provider: 'GOOGLE',
            reason: 'Google subscriptionNotification REVOKED (type 12)',
          })
        }
      }
      return NextResponse.json(
        { status: 'ok', notificationType },
        { status: 200 },
      )
    }

    // oneTimeProductNotification 처리 (CANCELED = 환불)
    const oneTimeNotification = decodedData.oneTimeProductNotification as
      | Record<string, unknown>
      | undefined

    if (oneTimeNotification) {
      const notificationType = oneTimeNotification.notificationType as number
      if (notificationType === ONE_TIME_CANCELED) {
        const purchaseToken = oneTimeNotification.purchaseToken as string
        if (purchaseToken) {
          await processRefund({
            transactionId: purchaseToken,
            provider: 'GOOGLE',
            reason: 'Google oneTimeProductNotification CANCELED (type 2)',
          })
        }
      }
      return NextResponse.json(
        { status: 'ok', notificationType },
        { status: 200 },
      )
    }

    return NextResponse.json({ status: 'ignored' }, { status: 200 })
  } catch (error) {
    // 에러가 발생해도 200 반환 (Google 무한 재시도 방지)
    await handleApiError(error)
    return NextResponse.json({ status: 'error' }, { status: 200 })
  }
}
