import type { CapacitorConfig } from '@capacitor/cli'

// CAPACITOR_ENV 환경 변수로 명시적 환경 구분
// 기본값: 개발 환경 (production이 아닌 모든 경우)
const isDev = process.env.CAPACITOR_ENV !== 'production'

// 플랫폼별 개발 서버 URL
const getDevServerUrl = () => {
  const platform = process.env.CAPACITOR_PLATFORM || 'android'

  if (platform === 'ios') {
    // iOS 시뮬레이터는 localhost 사용 가능
    return 'http://localhost:3000'
  } else {
    // Android 에뮬레이터는 10.0.2.2 필수 (localhost = 에뮬레이터 자체)
    return 'http://10.0.2.2:3000'
  }
}

const config: CapacitorConfig = {
  appId: 'com.dearmydays.app',
  appName: 'Dear My Days',

  // webDir is required but not used (dummy directory)
  webDir: 'public',

  // Load web URL in WebView
  server: isDev
    ? {
        url: getDevServerUrl(),
        cleartext: true,
        // OAuth 플로우가 WebView 내에서 처리되도록 허용
        allowNavigation: [
          '*.supabase.co',
          '*.kakao.com',
          '*.google.com',
          '*.apple.com',
          '*.naver.com',
          'nid.naver.com',
          'accounts.google.com',
          'kauth.kakao.com',
          'appleid.apple.com',
        ],
      }
    : {
        // Production: Vercel deployed web app
        url: 'https://dearmydays.com',
        cleartext: false,
        allowNavigation: [
          '*.supabase.co',
          '*.kakao.com',
          '*.google.com',
          '*.apple.com',
          '*.naver.com',
          'nid.naver.com',
          'accounts.google.com',
          'kauth.kakao.com',
          'appleid.apple.com',
        ],
      },
  plugins: {
    SplashScreen: {
      launchShowDuration: 500,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    // CORS bypass (Capacitor native HTTP)
    CapacitorHttp: {
      enabled: true,
    },
  },
}

export default config
