import { Platform } from 'react-native'

// 개발 환경 감지
const isDev = __DEV__

// 개발 URL
const getDevUrl = () => {
  if (Platform.OS === 'ios') {
    // iOS 시뮬레이터는 localhost 사용 가능
    return 'http://localhost:3000'
  } else {
    // Android 에뮬레이터는 10.0.2.2 또는 로컬 IP
    // TODO: Android 실제 디바이스 테스트 시 로컬 IP로 변경 (예: '192.168.1.100')
    return 'http://10.0.2.2:3000'
  }
}

export const Config = {
  webUrl: isDev ? getDevUrl() : 'https://dearmydays.com',
  appName: 'Dear My Days',
  version: '1.0.0',
}
