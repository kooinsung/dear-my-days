'use client'

import type { WebToNativeMessage } from './types'

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void
    }
  }
}

export function isNativeApp(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return !!window.ReactNativeWebView
}

export function sendToNative(message: WebToNativeMessage): boolean {
  if (!isNativeApp()) {
    console.warn(
      '[NativeBridge] Not in native app, message ignored:',
      message.type,
    )
    return false
  }

  try {
    // biome-ignore lint/style/noNonNullAssertion: isNativeApp() already checked
    window.ReactNativeWebView!.postMessage(JSON.stringify(message))
    return true
  } catch (error) {
    console.error('[NativeBridge] Failed to send message:', error)
    return false
  }
}
