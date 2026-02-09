'use client'

/**
 * Capacitor 네이티브 앱에서 실행 중인지 확인
 * 동적 import로 번들 사이즈 최소화
 */
export async function isNative(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core')
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

/**
 * 동기 버전 (useEffect 내부에서만 사용)
 */
export function isNativeSync(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  // Capacitor가 로드되었는지 확인
  // biome-ignore lint/suspicious/noExplicitAny: Capacitor global object check
  return !!(window as any).Capacitor?.isNativePlatform?.()
}

/**
 * 플랫폼 타입 반환 ('ios' | 'android' | 'web')
 */
export async function getPlatform(): Promise<'ios' | 'android' | 'web'> {
  try {
    const { Capacitor } = await import('@capacitor/core')
    return Capacitor.getPlatform() as 'ios' | 'android' | 'web'
  } catch {
    return 'web'
  }
}

/**
 * iOS 여부 확인
 */
export async function isIOS(): Promise<boolean> {
  const platform = await getPlatform()
  return platform === 'ios'
}

/**
 * Android 여부 확인
 */
export async function isAndroid(): Promise<boolean> {
  const platform = await getPlatform()
  return platform === 'android'
}
