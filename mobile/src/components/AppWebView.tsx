import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native'
import WebView, {
  type WebViewErrorEvent,
  type WebViewMessageEvent,
  type WebViewNavigation,
} from 'react-native-webview'
import { Config } from '../constants/Config'

interface AppWebViewProps {
  onMessage?: (data: string) => void
}

const AppWebView = React.forwardRef<WebView, AppWebViewProps>(
  ({ onMessage }, ref) => {
    const [isLoading, setIsLoading] = useState(true)

    const handleNavigationStateChange = (navState: WebViewNavigation) => {
      // 로딩 상태 업데이트
      setIsLoading(navState.loading)
    }

    const handleLoadStart = () => {
      setIsLoading(true)
    }

    const handleLoadEnd = () => {
      setIsLoading(false)
    }

    const handleError = (syntheticEvent: WebViewErrorEvent) => {
      const { nativeEvent } = syntheticEvent
      console.error('WebView error:', nativeEvent)
      Alert.alert(
        '연결 오류',
        '앱을 로드할 수 없습니다. 인터넷 연결을 확인해주세요.',
        [
          {
            text: '다시 시도',
            onPress: () => {
              if (ref && typeof ref === 'object' && 'current' in ref) {
                ref.current?.reload()
              }
            },
          },
        ],
      )
    }

    const handleMessage = (event: WebViewMessageEvent) => {
      if (onMessage) {
        onMessage(event.nativeEvent.data)
      }
    }

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        <WebView
          ref={ref}
          source={{ uri: Config.webUrl }}
          style={styles.webview}
          // Performance
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          // iOS
          allowsBackForwardNavigationGestures={true}
          decelerationRate="normal"
          sharedCookiesEnabled={true}
          // Android
          mixedContentMode="compatibility"
          setSupportMultipleWindows={false}
          // Handlers
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onHttpError={(syntheticEvent) => {
            console.warn('HTTP error:', syntheticEvent.nativeEvent)
          }}
          onMessage={handleMessage}
          // Security
          originWhitelist={['https://*', 'http://*']}
          // Allow same-origin navigation
          onShouldStartLoadWithRequest={(_request) => {
            // 같은 origin의 요청은 허용
            return true
          }}
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        )}
      </SafeAreaView>
    )
  },
)

AppWebView.displayName = 'AppWebView'

export default AppWebView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
