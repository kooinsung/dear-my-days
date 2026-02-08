import React, { useRef } from 'react'
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import WebView, { type WebViewMessageEvent } from 'react-native-webview'
import type { WebViewStackItem } from '../App'

interface WebViewStackProps {
  stack: WebViewStackItem[]
  onPop: () => void
  onClear: () => void
  onMessage: (data: string) => void
}

export default function WebViewStack({
  stack,
  onPop,
  onClear,
  onMessage,
}: WebViewStackProps) {
  return (
    <>
      {stack.map((item, index) => (
        <WebViewStackLayer
          key={item.id}
          item={item}
          index={index}
          totalCount={stack.length}
          onPop={onPop}
          onClear={onClear}
          onMessage={onMessage}
        />
      ))}
    </>
  )
}

interface WebViewStackLayerProps {
  item: WebViewStackItem
  index: number
  totalCount: number
  onPop: () => void
  onClear: () => void
  onMessage: (data: string) => void
}

function WebViewStackLayer({
  item,
  index,
  totalCount,
  onPop,
  onClear,
  onMessage,
}: WebViewStackLayerProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get('window').width),
  ).current

  // 슬라이드 인 애니메이션
  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [slideAnim])

  const _isTopLayer = index === totalCount - 1

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          zIndex: 100 + index,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onPop} style={styles.backButton}>
            <Text style={styles.backButtonText}>← 뒤로</Text>
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.headerUrl} numberOfLines={1}>
              {item.url}
            </Text>
          </View>

          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Level {index + 1}</Text>
          </View>

          <TouchableOpacity onPress={onClear} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>모두 닫기</Text>
          </TouchableOpacity>
        </View>

        {/* WebView */}
        <WebView
          source={{ uri: item.url }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          allowsBackForwardNavigationGestures={true}
          mixedContentMode="compatibility"
          originWhitelist={['https://*', 'http://*']}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={(syntheticEvent) => {
            console.error('WebView error:', syntheticEvent.nativeEvent)
            setIsLoading(false)
          }}
          onMessage={(event: WebViewMessageEvent) => {
            onMessage(event.nativeEvent.data)
          }}
        />

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        )}
      </SafeAreaView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  backButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  headerContent: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  headerUrl: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  levelBadge: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 12,
    color: '#666',
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ff5252',
    borderRadius: 6,
  },
  closeButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
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
