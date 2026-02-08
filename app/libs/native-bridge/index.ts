'use client'

// Re-export core functions
export { isNativeApp, sendToNative } from './core'

// 편의 함수들
import { isNativeApp, sendToNative } from './core'

export const NativeBridge = {
  isNative: isNativeApp,
  send: sendToNative,
  openWebView: (url: string, title?: string) =>
    sendToNative({ type: 'OPEN_WEBVIEW', url, title }),
  closeWebView: () => sendToNative({ type: 'CLOSE_WEBVIEW' }),
  clearWebViewStack: () => sendToNative({ type: 'CLEAR_WEBVIEW_STACK' }),
  getPlatformInfo: () => sendToNative({ type: 'PLATFORM_INFO' }),
  openExternalUrl: (url: string) =>
    sendToNative({ type: 'OPEN_EXTERNAL_URL', url }),
  registerPushToken: (userId: string) =>
    sendToNative({ type: 'REGISTER_PUSH_TOKEN', userId }),
  requestIAPProducts: () => sendToNative({ type: 'REQUEST_IAP_PRODUCTS' }),
  purchaseProduct: (productId: string) =>
    sendToNative({ type: 'PURCHASE_PRODUCT', productId }),
  restorePurchases: () => sendToNative({ type: 'RESTORE_PURCHASES' }),
}

// Re-export hooks
export { useIsNativeApp, useNativeMessage, usePlatformInfo } from './hooks'
// Re-export navigation
export { SmartLink, useRouter } from './navigation'
// Re-export types
export type {
  MessageHandler,
  NativeToWebMessage,
  WebToNativeMessage,
} from './types'
