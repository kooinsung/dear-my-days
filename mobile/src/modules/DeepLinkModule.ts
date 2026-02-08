import { Linking } from 'react-native'

export const DeepLinkModule = {
  setupListener: (callback: (url: string) => void) => {
    const subscription = Linking.addEventListener('url', (event) => {
      callback(event.url)
    })

    // 앱이 닫힌 상태에서 딥링크로 열린 경우
    Linking.getInitialURL().then((url) => {
      if (url) {
        callback(url)
      }
    })

    return () => subscription.remove()
  },

  parseUrl: (url: string) => {
    try {
      const urlObj = new URL(url)
      return {
        path: urlObj.pathname,
        params: Object.fromEntries(urlObj.searchParams),
      }
    } catch {
      return {
        path: '',
        params: {},
      }
    }
  },
}
