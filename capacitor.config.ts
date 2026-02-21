import type { CapacitorConfig } from '@capacitor/cli'

// CAPACITOR_ENV: local(기본) | dev | production
const capEnv = (process.env.CAPACITOR_ENV || 'local') as
  | 'local'
  | 'dev'
  | 'production'

// 플랫폼별 로컬 개발 서버 URL
const getLocalServerUrl = () => {
  const platform = process.env.CAPACITOR_PLATFORM || 'android'

  if (platform === 'ios') {
    // iOS 시뮬레이터는 localhost 사용 가능
    return 'http://localhost:3000'
  } else {
    // Android 에뮬레이터는 10.0.2.2 필수 (localhost = 에뮬레이터 자체)
    return 'http://10.0.2.2:3000'
  }
}

const serverUrlMap = {
  local: getLocalServerUrl(),
  dev: 'https://dear-my-days-dev.vercel.app',
  production: 'https://dear-my-days.vercel.app',
} as const

const config: CapacitorConfig = {
  appId: 'com.dearmydays.app',
  appName: 'Dear My Days',

  // webDir is required but not used (dummy directory)
  webDir: 'public',

  // Load web URL in WebView
  server: {
    url: serverUrlMap[capEnv],
    cleartext: capEnv === 'local',
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
      resize: 'none',
      resizeOnFullScreen: false,
    },
    // CORS bypass (Capacitor native HTTP)
    CapacitorHttp: {
      enabled: true,
    },
  },
}

export default config
