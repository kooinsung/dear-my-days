'use client'

import Link from 'next/link'
import { useRouter as useNextRouter } from 'next/navigation'
import type { ComponentProps } from 'react'
import { sendToNative } from './core'
import { useIsNativeApp } from './hooks'

/**
 * 상대 경로를 절대 URL로 변환
 */
function toAbsoluteUrl(path: string): string {
  // 이미 절대 URL인 경우 그대로 반환
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('tel:') ||
    path.startsWith('mailto:')
  ) {
    return path
  }

  // 상대 경로를 절대 URL로 변환
  if (typeof window !== 'undefined') {
    const origin = window.location.origin
    // / 로 시작하지 않으면 추가
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${origin}${normalizedPath}`
  }

  return path
}

/**
 * 커스텀 Link 컴포넌트
 * 웹에서는 Next.js Link, 앱에서는 WebView 스택 사용
 */
export function SmartLink({
  href,
  children,
  ...props
}: ComponentProps<typeof Link>) {
  const isNative = useIsNativeApp()

  // 외부 URL 체크
  const isExternal =
    typeof href === 'string' &&
    (href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('tel:') ||
      href.startsWith('mailto:'))

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isNative) {
      e.preventDefault()

      const path = typeof href === 'string' ? href : href.pathname || '/'
      const url = toAbsoluteUrl(path)
      const title =
        typeof children === 'string' ? children : props['aria-label'] || path

      console.log('[SmartLink] Click detected:', {
        href,
        path,
        url,
        title,
        isExternal,
      })

      if (isExternal) {
        // 외부 URL은 브라우저/앱에서 열기
        sendToNative({ type: 'OPEN_EXTERNAL_URL', url })
      } else {
        // 내부 URL은 WebView 스택에 추가 (절대 URL로 변환)
        console.log('[SmartLink] Sending OPEN_WEBVIEW:', { url, title })
        sendToNative({ type: 'OPEN_WEBVIEW', url, title })
      }
    }

    // 웹에서는 기본 Link 동작 (Next.js 라우팅)
  }

  return (
    <Link href={href} {...props} onClick={handleClick}>
      {children}
    </Link>
  )
}

/**
 * 커스텀 useRouter 훅
 * 웹에서는 Next.js router, 앱에서는 WebView 스택 사용
 */
export function useRouter() {
  const nextRouter = useNextRouter()
  const isNative = useIsNativeApp()

  return {
    push: (href: string, options?: { title?: string }) => {
      if (isNative) {
        const url = toAbsoluteUrl(href)
        sendToNative({ type: 'OPEN_WEBVIEW', url, title: options?.title })
      } else {
        nextRouter.push(href)
      }
    },
    replace: (href: string, options?: { title?: string }) => {
      if (isNative) {
        // 앱에서는 replace 대신 push 사용 (스택 특성상)
        const url = toAbsoluteUrl(href)
        sendToNative({ type: 'OPEN_WEBVIEW', url, title: options?.title })
      } else {
        nextRouter.replace(href)
      }
    },
    back: () => {
      if (isNative) {
        sendToNative({ type: 'CLOSE_WEBVIEW' })
      } else {
        nextRouter.back()
      }
    },
    forward: () => {
      // 앱에서는 forward 개념이 없음
      if (!isNative) {
        nextRouter.forward()
      }
    },
    refresh: () => {
      nextRouter.refresh()
    },
    prefetch: (href: string) => {
      if (!isNative) {
        nextRouter.prefetch(href)
      }
    },
  }
}
