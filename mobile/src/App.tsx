import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { BackHandler, Linking, Platform } from 'react-native'
import type WebView from 'react-native-webview'
import AppWebView from './components/AppWebView'
import WebViewStack from './components/WebViewStack'
import { Config } from './constants/Config'
import { DeepLinkModule } from './modules/DeepLinkModule'

export interface WebViewStackItem {
  id: string
  url: string
  title?: string
}

function App(): React.JSX.Element {
  const [stack, setStack] = useState<WebViewStackItem[]>([])
  const mainWebViewRef = useRef<WebView>(null)

  // 새 웹뷰 추가
  const handlePushWebView = useCallback((url: string, title?: string) => {
    const newItem: WebViewStackItem = {
      id: Date.now().toString(),
      url,
      title: title || url,
    }
    setStack((prev) => [...prev, newItem])
  }, [])

  // 웹뷰 제거 (뒤로가기)
  const handlePopWebView = useCallback(() => {
    setStack((prev) => (prev.length > 0 ? prev.slice(0, -1) : []))
  }, [])

  // 모든 웹뷰 제거
  const handleClearStack = useCallback(() => {
    setStack([])
  }, [])

  // 메인 WebView에서 메시지 받기
  const handleMessage = useCallback(
    (data: string) => {
      try {
        const message = JSON.parse(data)

        switch (message.type) {
          case 'OPEN_WEBVIEW':
            handlePushWebView(message.url, message.title)
            break
          case 'CLOSE_WEBVIEW':
            handlePopWebView()
            break
          case 'CLEAR_WEBVIEW_STACK':
            handleClearStack()
            break
          case 'PLATFORM_INFO':
            // 플랫폼 정보 응답
            mainWebViewRef.current?.injectJavaScript(`
              window.postMessage(${JSON.stringify({
                type: 'PLATFORM_INFO_RESPONSE',
                platform: Platform.OS,
                isNative: true,
              })}, '*');
              true;
            `)
            break
          case 'OPEN_EXTERNAL_URL':
            // 외부 URL 열기 (브라우저, 전화, 이메일 등)
            Linking.openURL(message.url).catch((err) =>
              console.error('Failed to open URL:', err),
            )
            break
          default:
            console.log('Unknown message type:', message.type)
        }
      } catch (error) {
        console.error('Failed to parse message:', error)
      }
    },
    [handlePushWebView, handlePopWebView, handleClearStack],
  )

  // Android 하드웨어 백 버튼 처리
  useEffect(() => {
    const backAction = () => {
      if (stack.length > 0) {
        handlePopWebView()
        return true // 이벤트 소비
      }
      return false // 기본 동작 (앱 종료)
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    )

    return () => backHandler.remove()
  }, [stack.length, handlePopWebView])

  // 딥링크 처리
  useEffect(() => {
    const cleanup = DeepLinkModule.setupListener((url) => {
      console.log('[DeepLink] Received:', url)
      const { path, params } = DeepLinkModule.parseUrl(url)

      // OAuth 콜백 처리
      if (path.includes('/auth/callback')) {
        const queryString = new URLSearchParams(params).toString()
        const fullUrl = `${Config.webUrl}${path}${
          queryString ? `?${queryString}` : ''
        }`

        // 메인 웹뷰로 OAuth 콜백 URL 로드
        mainWebViewRef.current?.injectJavaScript(`
          window.location.href = '${fullUrl}';
          true;
        `)
      }
    })
    return cleanup
  }, [])

  return (
    <>
      {/* 메인 WebView */}
      <AppWebView ref={mainWebViewRef} onMessage={handleMessage} />

      {/* WebView Stack */}
      {stack.length > 0 && (
        <WebViewStack
          stack={stack}
          onPop={handlePopWebView}
          onClear={handleClearStack}
          onMessage={handleMessage}
        />
      )}
    </>
  )
}

export default App
