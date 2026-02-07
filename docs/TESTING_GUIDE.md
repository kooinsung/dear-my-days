# Dear My Days - 로컬 & Dev 환경 테스트 가이드

> Capacitor 앱을 로컬 및 개발 환경에서 iOS/Android 테스트하는 단계별 가이드

## 목차

- [사전 준비](#사전-준비)
- [로컬 환경 설정](#로컬-환경-설정)
- [웹 개발 서버 테스트](#웹-개발-서버-테스트)
- [iOS 테스트](#ios-테스트)
- [Android 테스트](#android-테스트)
- [기능별 테스트 체크리스트](#기능별-테스트-체크리스트)
- [문제 해결](#문제-해결)

---

## 사전 준비

### 필수 도구 설치

#### 1. Node.js 및 pnpm
```bash
# Node.js 20+ 설치 (Homebrew 사용)
brew install node

# pnpm 설치
npm install -g pnpm

# 버전 확인
node --version   # v20.0.0 이상
pnpm --version   # 8.0.0 이상
```

#### 2. iOS 개발 도구 (macOS 전용)
```bash
# Xcode 설치 (App Store에서)
# 설치 후 Command Line Tools 설정
xcode-select --install

# CocoaPods 설치 (iOS 의존성 관리)
sudo gem install cocoapods

# 버전 확인
xcodebuild -version   # Xcode 15.0 이상
pod --version         # 1.15.0 이상
```

#### 3. Android 개발 도구
```bash
# Android Studio 설치
# https://developer.android.com/studio 에서 다운로드

# 설치 후 SDK 경로 설정
# Android Studio → Settings → Appearance & Behavior → System Settings → Android SDK

# 환경 변수 설정 (~/.zshrc 또는 ~/.bashrc)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# 적용
source ~/.zshrc

# 버전 확인
adb --version         # Android Debug Bridge
emulator -version     # Android Emulator
```

#### 4. Capacitor CLI
```bash
# Capacitor CLI는 프로젝트 의존성으로 이미 설치됨
# 전역 설치 불필요
```

---

## 로컬 환경 설정

### 1. 프로젝트 클론 및 의존성 설치

```bash
# 프로젝트 디렉토리로 이동
cd /Users/a17050/side-project/dear-my-days

# 의존성 설치
pnpm install

# Capacitor 동기화 (네이티브 프로젝트 생성)
pnpm cap:sync
```

### 2. 환경 변수 설정

`.env.local` 파일 생성:

```bash
# .env.example을 복사하여 시작
cp .env.example .env.local

# 필수 환경 변수 설정
vi .env.local
```

**필수 환경 변수:**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Web URL
NEXT_PUBLIC_WEB_BASE_URL=https://dear-my-days.com
NEXT_PUBLIC_SITE_URL=https://dear-my-days.com

# 로컬 개발용 (선택)
# NEXT_PUBLIC_WEB_BASE_URL=http://localhost:3000
# NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Email (선택)
RESEND_API_KEY=xxx
RESEND_FROM_EMAIL=noreply@dear-my-days.com

# KASI (음력 변환)
KASI_SERVICE_KEY=xxx

# OAuth (선택)
NEXT_PUBLIC_NAVER_CLIENT_ID=xxx
NAVER_CLIENT_SECRET=xxx

# IAP (실제 디바이스 테스트 시 필요)
APPLE_SHARED_SECRET=xxx
GOOGLE_PACKAGE_NAME=com.dearmydays.app
GOOGLE_SERVICE_ACCOUNT_TOKEN=xxx

# Firebase (푸시 알림 테스트 시 필요)
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=xxx@xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxx\n-----END PRIVATE KEY-----\n"
```

### 3. 데이터베이스 마이그레이션

Supabase SQL Editor에서 다음 순서로 실행:

```bash
# 1. event_notification_settings 테이블 생성
supabase/migrations/create_event_notification_settings.sql

# 2. notification_logs 테이블 및 함수 생성
supabase/migrations/create_notification_system.sql

# 3. 구독 모델 업데이트
supabase/migrations/20260207_update_subscription_model.sql
```

---

## 웹 개발 서버 테스트

### 1. 개발 서버 실행

```bash
# Turbopack 사용 (빠른 HMR)
pnpm dev

# 또는 일반 모드
pnpm next dev
```

**결과:**
```
  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 1.5s
```

### 2. 브라우저 테스트

브라우저에서 `http://localhost:3000` 접속:

**테스트 항목:**
- [ ] 로그인 페이지 로드 확인
- [ ] 이메일 로그인 기능
- [ ] OAuth 로그인 (Google/Kakao/Naver)
- [ ] 이벤트 CRUD 기능
- [ ] 캘린더 뷰
- [ ] 음력 변환 기능
- [ ] 설정 페이지

### 3. 빌드 테스트

```bash
# 프로덕션 빌드
pnpm build

# 빌드 완료 확인
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages

# 프로덕션 서버 실행
pnpm start
```

---

## iOS 테스트

### 1. 시뮬레이터 테스트

#### Step 1: Capacitor 동기화

```bash
# iOS 프로젝트 동기화 (최초 1회 또는 설정 변경 시)
pnpm cap:sync ios

# 또는 전체 동기화
pnpm cap:sync
```

**결과:**
```
✔ Copying web assets from out to ios/App/App/public in 50.00ms
✔ Creating capacitor.config.json in ios/App/App in 1.00ms
✔ copy ios in 51.00ms
✔ Updating iOS plugins in 10.00ms
```

#### Step 2: 개발 서버 실행 (별도 터미널)

```bash
# 터미널 1: Next.js 개발 서버
pnpm dev
```

#### Step 3: iOS 시뮬레이터 실행

```bash
# 터미널 2: iOS 앱 실행
pnpm cap:run:ios

# 또는 Xcode에서 직접 실행
pnpm cap:ios
```

**Xcode가 열리면:**
1. 상단에서 시뮬레이터 선택 (예: iPhone 15 Pro)
2. ▶️ 버튼 클릭 또는 `Cmd + R`
3. 시뮬레이터가 부팅되고 앱 실행

#### Step 4: Live Reload 테스트 (선택)

```bash
# Live Reload로 실행 (코드 변경 시 자동 새로고침)
pnpm cap:run:ios --livereload --external

# 네트워크 IP 확인
ifconfig | grep "inet "
# 예: 192.168.1.100
```

**주의사항:**
- 시뮬레이터와 개발 머신이 같은 네트워크에 있어야 함
- 방화벽에서 포트 3000 허용 필요

### 2. 실제 디바이스 테스트 (TestFlight)

#### Step 1: Apple Developer 계정 설정

```bash
# Apple Developer Program 가입 필요 ($99/년)
# https://developer.apple.com/programs/
```

#### Step 2: Xcode 서명 설정

1. Xcode에서 `ios/App/App.xcworkspace` 열기
2. 프로젝트 Navigator에서 "App" 선택
3. **Signing & Capabilities** 탭:
   - Team: 개발자 계정 선택
   - Bundle Identifier: `com.dearmydays.app`
   - Automatically manage signing 체크

#### Step 3: 아카이브 빌드

```bash
# Xcode에서:
# 1. 상단 타겟을 "Any iOS Device (arm64)"로 선택
# 2. Product → Archive
# 3. Archives 창에서 "Distribute App" 클릭
# 4. "App Store Connect" 선택
# 5. "Upload" 선택
# 6. 서명 옵션 선택 (Automatic)
# 7. "Upload" 완료 대기
```

#### Step 4: TestFlight 설정

1. [App Store Connect](https://appstoreconnect.apple.com) 접속
2. "My Apps" → 앱 선택 → "TestFlight" 탭
3. "Internal Testing" → 테스터 추가
4. 빌드가 처리되면 (보통 5-10분) 테스터에게 초대 발송
5. 테스터는 TestFlight 앱에서 앱 다운로드

#### Step 5: 실제 디바이스에서 테스트

**테스트 항목:**
- [ ] 앱 설치 및 실행
- [ ] OAuth 로그인 (실제 인증 플로우)
- [ ] 푸시 알림 권한 요청
- [ ] 푸시 알림 수신
- [ ] 딥링크 (`dearmydays://`, Universal Links)
- [ ] IAP 구매 (Sandbox 계정)
- [ ] 네이티브 뒤로가기 제스처
- [ ] 캘린더 연동 (권한 요청)

---

## Android 테스트

### 1. 에뮬레이터 테스트

#### Step 1: AVD (Android Virtual Device) 생성

```bash
# Android Studio 실행
# Tools → Device Manager → Create Device

# 권장 설정:
# - Device: Pixel 5 또는 Pixel 7
# - System Image: Android 13 (API 33) 이상
# - RAM: 2048 MB
# - Storage: 2048 MB
```

**또는 명령줄로:**
```bash
# AVD 목록 확인
emulator -list-avds

# AVD 생성 (예시)
avdmanager create avd -n Pixel_5_API_33 \
  -k "system-images;android-33;google_apis;x86_64" \
  -d pixel_5

# 에뮬레이터 실행
emulator -avd Pixel_5_API_33
```

#### Step 2: Capacitor 동기화

```bash
# Android 프로젝트 동기화
pnpm cap:sync android

# 또는 전체 동기화
pnpm cap:sync
```

#### Step 3: 개발 서버 실행 (별도 터미널)

```bash
# 터미널 1: Next.js 개발 서버
pnpm dev
```

#### Step 4: Android 앱 실행

```bash
# 터미널 2: Android 앱 실행
pnpm cap:run:android

# 또는 Android Studio에서 직접 실행
pnpm cap:android
```

**Android Studio가 열리면:**
1. 상단에서 AVD 선택
2. ▶️ 버튼 클릭 또는 `Shift + F10`
3. 에뮬레이터에서 앱 실행

#### Step 5: Live Reload 테스트 (선택)

```bash
# Live Reload로 실행
pnpm cap:run:android --livereload --external
```

### 2. 실제 디바이스 테스트 (Internal Testing)

#### Step 1: Google Play Console 계정 설정

```bash
# Google Play Developer 계정 필요 ($25 일회성)
# https://play.google.com/console/signup
```

#### Step 2: 서명 키 생성

```bash
# Release 키 생성
cd android
keytool -genkey -v -keystore my-release-key.keystore \
  -alias my-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# 키 정보 입력 (비밀번호, 이름 등)
# 키는 안전한 곳에 보관!
```

#### Step 3: 서명 설정

`android/app/build.gradle` 수정:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword 'your-store-password'
            keyAlias 'my-key-alias'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

**보안 주의:**
- 키스토어 파일은 절대 Git에 커밋하지 않기
- `.gitignore`에 `*.keystore` 추가
- 비밀번호는 환경 변수로 관리

#### Step 4: 서명된 AAB 빌드

```bash
# Android App Bundle 빌드
cd android
./gradlew bundleRelease

# 빌드 결과 위치:
# android/app/build/outputs/bundle/release/app-release.aab
```

#### Step 5: Google Play Console 업로드

1. [Google Play Console](https://play.google.com/console) 접속
2. 앱 선택 → "Testing" → "Internal testing"
3. "Create new release" 클릭
4. AAB 파일 업로드
5. Release name 및 notes 입력
6. "Save" → "Review release" → "Start rollout to Internal testing"

#### Step 6: 테스터 추가

1. "Internal testing" → "Testers" 탭
2. 이메일 목록 생성 및 추가
3. 테스터에게 초대 링크 전송
4. 테스터는 링크를 통해 앱 다운로드

#### Step 7: 실제 디바이스에서 테스트

**테스트 항목:**
- [ ] 앱 설치 및 실행
- [ ] OAuth 로그인
- [ ] 푸시 알림 권한 요청
- [ ] 푸시 알림 수신
- [ ] 딥링크 (App Links)
- [ ] IAP 구매 (테스트 계정)
- [ ] 네이티브 뒤로가기 버튼
- [ ] 캘린더 연동

---

## 기능별 테스트 체크리스트

### 인증 (Authentication)

#### 웹 브라우저
- [ ] 이메일 회원가입
- [ ] 이메일 로그인
- [ ] 이메일 인증
- [ ] 비밀번호 리셋
- [ ] Google OAuth 로그인
- [ ] Kakao OAuth 로그인
- [ ] Naver OAuth 로그인

#### iOS 시뮬레이터
- [ ] 이메일 로그인
- [ ] Google OAuth (Safari로 리다이렉트)
- [ ] Kakao OAuth
- [ ] Apple Sign In
- [ ] 딥링크 콜백 (`dearmydays://auth/callback`)

#### Android 에뮬레이터
- [ ] 이메일 로그인
- [ ] Google OAuth (Chrome으로 리다이렉트)
- [ ] Kakao OAuth
- [ ] App Links 콜백 (`https://dear-my-days.com/auth/callback`)

### 이벤트 관리

#### 공통
- [ ] 이벤트 생성 (양력)
- [ ] 이벤트 생성 (음력, 평달)
- [ ] 이벤트 생성 (음력, 윤달)
- [ ] 이벤트 목록 조회
- [ ] 이벤트 상세 조회
- [ ] 이벤트 수정
- [ ] 이벤트 삭제
- [ ] 과거 이벤트 조회
- [ ] 캘린더 뷰 (월별)

#### 이벤트 제한
- [ ] FREE 플랜 (3개 제한) 테스트
- [ ] 제한 초과 시 에러 메시지 확인
- [ ] 추가 슬롯 구매 후 제한 증가 확인

### 알림 (Push Notifications)

#### 설정
- [ ] 알림 권한 요청 (iOS/Android)
- [ ] 알림 스케줄 추가 (D-7, D-3, D-1, 당일)
- [ ] 알림 스케줄 삭제
- [ ] 알림 시간 설정 (시, 분)

#### 발송 (실제 디바이스 필요)
- [ ] 디바이스 토큰 등록 확인 (device_tokens 테이블)
- [ ] 예약 알림 발송 (Edge Function)
- [ ] 알림 수신 (Foreground)
- [ ] 알림 수신 (Background)
- [ ] 알림 클릭 시 이벤트 상세 페이지 이동
- [ ] 알림 로그 확인 (notification_logs 테이블)

### 인앱결제 (IAP)

#### 웹 (Mock)
- [ ] 구독 상품 목록 표시
- [ ] 현재 플랜 표시
- [ ] 이벤트 제한 표시
- [ ] "모바일 앱에서만 가능" 메시지

#### iOS (Sandbox)
- [ ] Sandbox 테스트 계정 생성 및 로그인
- [ ] 월간 구독 구매 (₩4,900)
- [ ] 연간 구독 구매 (₩49,000)
- [ ] 이벤트 슬롯 구매 (₩990)
- [ ] 구매 후 플랜 업데이트 확인
- [ ] event_purchases 테이블 기록 확인
- [ ] 구독 복원 기능

#### Android (Test)
- [ ] 테스트 계정 생성 및 설정
- [ ] 월간 구독 구매
- [ ] 연간 구독 구매
- [ ] 이벤트 슬롯 구매
- [ ] 구매 후 플랜 업데이트 확인
- [ ] 구독 복원 기능

### 딥링크 (Deep Links)

#### iOS
- [ ] Custom URL Scheme: `dearmydays://calendar`
- [ ] Custom URL Scheme: `dearmydays://settings`
- [ ] Universal Links: `https://dear-my-days.com/calendar`
- [ ] Universal Links: `https://dear-my-days.com/auth/callback?code=xxx`

#### Android
- [ ] Custom URL Scheme: `dearmydays://calendar`
- [ ] App Links: `https://dear-my-days.com/calendar`
- [ ] App Links: `https://dear-my-days.com/auth/callback?code=xxx`

### Native 기능

#### iOS
- [ ] Status Bar 스타일 (Light/Dark)
- [ ] Safe Area 처리
- [ ] Swipe Back 제스처
- [ ] 키보드 처리 (Resize/Pan)
- [ ] Haptic Feedback
- [ ] Share Sheet (네이티브 공유)

#### Android
- [ ] Status Bar 색상
- [ ] Navigation Bar 처리
- [ ] 뒤로가기 버튼
- [ ] 키보드 처리
- [ ] Vibration
- [ ] Share Intent

---

## 문제 해결

### 공통

#### 문제: `pnpm dev` 실행 시 환경 변수 에러
```
Error: Missing required environment variables
```

**해결:**
```bash
# .env.local 파일 확인
cat .env.local

# 필수 환경 변수가 모두 설정되어 있는지 확인
# @t3-oss/env-nextjs가 자동으로 검증함
```

#### 문제: Capacitor 동기화 실패
```
Error: capacitor.config.ts not found
```

**해결:**
```bash
# 프로젝트 루트에서 실행했는지 확인
pwd
# → /Users/a17050/side-project/dear-my-days

# Capacitor 초기화 (최초 1회)
npx cap init "Dear My Days" "com.dearmydays.app"

# 동기화 재시도
pnpm cap:sync
```

### iOS

#### 문제: Xcode 빌드 에러 "No such module 'Capacitor'"
```
Module 'Capacitor' not found
```

**해결:**
```bash
# CocoaPods 의존성 재설치
cd ios/App
pod install
pod update

# Xcode 클린 빌드
# Xcode → Product → Clean Build Folder (Cmd + Shift + K)
# 다시 빌드 (Cmd + R)
```

#### 문제: 시뮬레이터에서 네트워크 연결 안 됨
```
Failed to load: localhost:3000
```

**해결:**
```bash
# 1. 개발 서버가 실행 중인지 확인
lsof -i :3000

# 2. capacitor.config.ts 확인
# server.url이 올바른지 확인

# 3. 시뮬레이터 재시작
# Hardware → Restart
```

#### 문제: TestFlight 업로드 실패
```
Asset validation failed
```

**해결:**
```bash
# 1. 번들 ID 확인 (com.dearmydays.app)
# 2. 버전 번호 증가 (CFBundleShortVersionString)
# 3. 빌드 번호 증가 (CFBundleVersion)
# 4. Provisioning Profile 갱신
# 5. 아카이브 재시도
```

### Android

#### 문제: Gradle 빌드 실패
```
FAILURE: Build failed with an exception
```

**해결:**
```bash
# Gradle 캐시 클리어
cd android
./gradlew clean

# 캐시 완전 삭제
rm -rf .gradle
rm -rf app/build

# 재빌드
./gradlew assembleDebug
```

#### 문제: 에뮬레이터 실행 안 됨
```
Emulator: ERROR: x86 emulation currently requires hardware acceleration
```

**해결:**
```bash
# Intel HAXM 설치 확인 (Intel Mac)
# Android Studio → SDK Manager → SDK Tools → Intel HAXM

# M1/M2 Mac: ARM 이미지 사용
# System Image: ARM 64 (arm64-v8a)
```

#### 문제: AAB 업로드 실패 (Google Play)
```
This release is not compliant with Google Play 64-bit requirement
```

**해결:**
```gradle
// android/app/build.gradle
android {
    defaultConfig {
        ndk {
            abiFilters 'arm64-v8a', 'armeabi-v7a', 'x86', 'x86_64'
        }
    }
    splits {
        abi {
            enable true
            reset()
            include 'arm64-v8a', 'armeabi-v7a', 'x86', 'x86_64'
            universalApk true
        }
    }
}
```

### 푸시 알림

#### 문제: iOS에서 푸시 토큰을 받지 못함
```
APNs registration failed
```

**해결:**
```bash
# 1. APNs 키가 Firebase에 업로드되었는지 확인
# Firebase Console → Project Settings → Cloud Messaging → APNs

# 2. Bundle ID가 일치하는지 확인
# 3. 실제 디바이스에서 테스트 (시뮬레이터는 푸시 미지원)
# 4. Capabilities에서 Push Notifications 활성화
```

#### 문제: Android에서 알림이 수신되지 않음
```
FCM token not registered
```

**해결:**
```bash
# 1. google-services.json 위치 확인
# android/app/google-services.json

# 2. 패키지 이름 일치 확인
# google-services.json의 package_name === com.dearmydays.app

# 3. Google Services 플러그인 확인
# android/app/build.gradle: apply plugin: 'com.google.gms.google-services'

# 4. Firebase Console에서 직접 테스트
# Cloud Messaging → Send test message
```

### IAP

#### 문제: "Unable to complete purchase"
```
Purchase failed: Product not found
```

**해결:**
```bash
# iOS:
# 1. App Store Connect에서 상품 생성 확인
# 2. 상품 ID 일치 확인 (com.dearmydays.premium.monthly)
# 3. Sandbox 계정으로 로그인했는지 확인
# 4. 앱이 "Waiting for Review" 또는 "Ready to Submit" 상태인지 확인

# Android:
# 1. Google Play Console에서 상품 활성화 확인
# 2. 상품 ID 일치 확인
# 3. 테스트 계정이 Internal Testing 그룹에 추가되었는지 확인
# 4. 최소 1회 Internal Testing 버전이 배포되었는지 확인
```

---

## 추가 리소스

### 공식 문서
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Xcode Documentation](https://developer.apple.com/documentation/xcode)
- [Android Studio User Guide](https://developer.android.com/studio/intro)

### 테스트 도구
- [Xcode Instruments](https://developer.apple.com/xcode/features/) - 성능 프로파일링
- [Android Profiler](https://developer.android.com/studio/profile) - 성능 분석
- [React Developer Tools](https://react.dev/learn/react-developer-tools) - 디버깅

### 디버깅
```bash
# iOS 로그 확인
# Xcode → Window → Devices and Simulators → 디바이스 선택 → Open Console

# Android 로그 확인
adb logcat | grep "Capacitor"

# Chrome DevTools로 디버깅 (Android)
chrome://inspect/#devices
```

---

**마지막 업데이트:** 2026-02-07
**버전:** 1.0.0
