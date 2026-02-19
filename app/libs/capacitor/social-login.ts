'use client'

import { SocialLogin } from '@capgo/capacitor-social-login'
import { Capacitor3KakaoLogin } from 'capacitor3-kakao-login'
import { env } from '@/libs/config/env'
import { createSupabaseBrowser } from '@/libs/supabase/browser'

let isInitialized = false

/**
 * SocialLogin 플러그인 초기화
 */
export async function initializeSocialLogin() {
  if (isInitialized) {
    return
  }

  // Google Client ID가 설정되지 않은 경우 초기화 건너뛰기
  if (
    !env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID &&
    !env.NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID
  ) {
    console.warn('⚠️ Google Client IDs not configured')
    return
  }

  try {
    await SocialLogin.initialize({
      google: {
        iOSClientId: env.NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        webClientId: env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        mode: 'online',
      },
    })
    isInitialized = true
    console.log('✅ SocialLogin initialized')
  } catch (error) {
    console.error('❌ SocialLogin initialization error:', error)
    throw error
  }
}

/**
 * 네이티브 Google 로그인
 * Android/iOS에서 네이티브 SDK 사용
 */
export async function googleLogin() {
  // 초기화 확인
  await initializeSocialLogin()

  // Client ID가 설정되지 않은 경우
  if (!isInitialized) {
    throw new Error(
      'Google 로그인이 설정되지 않았습니다. Google Client ID를 설정해주세요.',
    )
  }

  try {
    // 1. 네이티브 Google Sign-In
    const { provider, result } = await SocialLogin.login({
      provider: 'google',
      options: {
        style: 'standard',
        filterByAuthorizedAccounts: false,
      },
    })

    console.log('✅ Google native sign-in success:', {
      provider,
      responseType: result.responseType,
    })

    // 2. Online 모드 확인 (idToken 필요)
    if (result.responseType !== 'online') {
      throw new Error(
        'Google login failed: Expected online mode but got offline mode',
      )
    }

    if (!result.idToken) {
      throw new Error('Google login failed: No idToken received')
    }

    // 3. Google ID 토큰을 Supabase로 전달
    const supabase = createSupabaseBrowser()
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: result.idToken,
    })

    if (error) {
      throw error
    }

    console.log('✅ Supabase session created')
    return { success: true, data }
  } catch (error) {
    console.error('❌ Google login error:', error)
    throw error
  }
}

/**
 * 네이티브 Kakao 로그인
 * accessToken을 서버로 보내 Supabase 세션을 생성
 */
export async function kakaoLogin() {
  try {
    // 1. 네이티브 Kakao Sign-In → accessToken 반환
    const result = await Capacitor3KakaoLogin.kakaoLogin()
    const accessToken = result.value

    if (!accessToken) {
      throw new Error('Kakao login failed: No accessToken received')
    }

    console.log('✅ Kakao native sign-in success')

    // 2. 서버 API로 accessToken 전달 → Supabase 세션 생성
    const response = await fetch('/api/auth/kakao-native', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Kakao 로그인 처리에 실패했습니다.')
    }

    const { tokenHash } = await response.json()

    // 3. OTP 검증으로 클라이언트 세션 생성
    const supabase = createSupabaseBrowser()
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'email',
    })

    if (error) {
      throw error
    }

    console.log('✅ Supabase session created (Kakao)')
    return { success: true, data }
  } catch (error) {
    console.error('❌ Kakao login error:', error)
    throw error
  }
}

/**
 * Kakao 로그아웃
 */
export async function kakaoLogout() {
  try {
    await Capacitor3KakaoLogin.kakaoLogout()
    console.log('✅ Kakao sign-out success')
  } catch (error) {
    console.error('❌ Kakao logout error:', error)
  }
}

/**
 * Google 로그아웃
 */
export async function googleLogout() {
  try {
    await SocialLogin.logout({ provider: 'google' })
    console.log('✅ Google sign-out success')
  } catch (error) {
    console.error('❌ Google logout error:', error)
  }
}
