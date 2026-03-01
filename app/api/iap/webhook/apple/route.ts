import { decodeProtectedHeader, importX509, jwtVerify } from 'jose'
import { type NextRequest, NextResponse } from 'next/server'
import { env } from '@/libs/config/env'
import { processRefund } from '@/libs/iap/refund'
import { handleApiError } from '@/libs/utils/errors'

async function verifyAndDecodeJWS(signedPayload: string) {
  // x5c 헤더에서 인증서 체인 추출
  const header = decodeProtectedHeader(signedPayload)
  const x5c = header.x5c
  if (!x5c || x5c.length === 0) {
    throw new Error('Missing x5c certificate chain')
  }

  // leaf 인증서에서 키 추출하여 서명 검증
  const leafCert = `-----BEGIN CERTIFICATE-----\n${x5c[0]}\n-----END CERTIFICATE-----`
  const leafKey = await importX509(leafCert, header.alg as string)

  const { payload } = await jwtVerify(signedPayload, leafKey, {
    algorithms: [header.alg as string],
  })

  return payload as Record<string, unknown>
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { signedPayload } = body

    if (!signedPayload) {
      // Apple 재시도 방지: 항상 200 반환
      return NextResponse.json({ status: 'missing_payload' }, { status: 200 })
    }

    let notification: Record<string, unknown>
    try {
      notification = await verifyAndDecodeJWS(signedPayload)
    } catch {
      return NextResponse.json({ status: 'invalid_signature' }, { status: 200 })
    }

    const notificationType = notification.notificationType as string

    // REFUND 타입만 처리
    if (notificationType !== 'REFUND') {
      return NextResponse.json(
        { status: 'ignored', notificationType },
        { status: 200 },
      )
    }

    // signedTransactionInfo 디코드
    const signedTransactionInfo = (notification.data as Record<string, unknown>)
      ?.signedTransactionInfo as string

    if (!signedTransactionInfo) {
      return NextResponse.json(
        { status: 'missing_transaction_info' },
        { status: 200 },
      )
    }

    let transactionInfo: Record<string, unknown>
    try {
      transactionInfo = await verifyAndDecodeJWS(signedTransactionInfo)
    } catch {
      return NextResponse.json(
        { status: 'invalid_transaction_signature' },
        { status: 200 },
      )
    }

    // 번들 ID 검증
    const bundleId = env.APPLE_BUNDLE_ID
    if (bundleId && transactionInfo.bundleId !== bundleId) {
      return NextResponse.json({ status: 'bundle_mismatch' }, { status: 200 })
    }

    const originalTransactionId = (transactionInfo.originalTransactionId ??
      transactionInfo.transactionId) as string

    if (!originalTransactionId) {
      return NextResponse.json(
        { status: 'missing_transaction_id' },
        { status: 200 },
      )
    }

    const result = await processRefund({
      transactionId: originalTransactionId,
      provider: 'APPLE',
      reason: `Apple REFUND notification (subtype: ${notification.subtype ?? 'N/A'})`,
    })

    return NextResponse.json({ status: 'ok', ...result }, { status: 200 })
  } catch (error) {
    // 에러가 발생해도 200 반환 (Apple 무한 재시도 방지)
    // 하지만 내부적으로 에러 로깅
    await handleApiError(error)
    return NextResponse.json({ status: 'error' }, { status: 200 })
  }
}
