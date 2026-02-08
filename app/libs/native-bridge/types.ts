// 웹 → 네이티브 메시지 타입
export type WebToNativeMessage =
  | { type: 'OPEN_WEBVIEW'; url: string; title?: string }
  | { type: 'CLOSE_WEBVIEW' }
  | { type: 'CLEAR_WEBVIEW_STACK' }
  | { type: 'PLATFORM_INFO' }
  | { type: 'OPEN_EXTERNAL_URL'; url: string }
  | { type: 'REGISTER_PUSH_TOKEN'; userId: string }
  | { type: 'REQUEST_IAP_PRODUCTS' }
  | { type: 'PURCHASE_PRODUCT'; productId: string }
  | { type: 'RESTORE_PURCHASES' }

// 네이티브 → 웹 메시지 타입
export type NativeToWebMessage =
  | {
      type: 'PLATFORM_INFO_RESPONSE'
      platform: 'ios' | 'android'
      isNative: true
    }
  | { type: 'PUSH_TOKEN_REGISTERED'; token: string }
  | { type: 'IAP_PRODUCTS_RESPONSE'; products: unknown[] }
  | { type: 'PURCHASE_SUCCESS'; receipt: string; productId: string }
  | { type: 'PURCHASE_ERROR'; error: string }

export type MessageHandler = (message: NativeToWebMessage) => void
