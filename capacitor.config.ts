import type { CapacitorConfig } from '@capacitor/cli'

const isDev = process.env.NODE_ENV === 'development'

const config: CapacitorConfig = {
  appId: 'com.dearmydays.app',
  appName: 'Dear My Days',

  // webDir is required but not used (dummy directory)
  webDir: 'public',

  // Load web URL in WebView
  server: isDev
    ? {
        // Development: Local Next.js server
        url: 'http://localhost:3000',
        cleartext: true,
      }
    : {
        // Production: Vercel deployed web app
        url: 'https://dear-my-days.com', // Replace with actual web app URL
        cleartext: false,
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
