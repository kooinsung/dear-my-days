# Dear My Days - 로컬 & Dev 환경 테스트 가이드

> React Native CLI + WebView 앱을 로컬 및 개발 환경에서 iOS/Android 테스트하는 단계별 가이드

**📱 모바일 앱 상세 가이드:** [mobile/README.md](../mobile/README.md)에서 React Native CLI 프로젝트 초기화 및 개발 방법을 확인하세요.

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

# 버전 확인
xcodebuild -version   # Xcode 15.0 이상
```

**Note**: CocoaPods 설치 필수 (iOS 의존성 관리)

```bash
# CocoaPods 설치
sudo gem install cocoapods

# 버전 확인
pod --version   # 1.15.0 이상
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

# 적용
source ~/.zshrc

# 버전 확인
adb --version         # Android Debug Bridge
emulator -version     # Android Emulator
```

#### 4. React Native CLI

```bash
# 전역 설치 불필요
# npx로 사용
npx react-native --version
```

---

## 로컬 환경 설정

### 1. 프로젝트 클론 및 의존성 설치

```bash
# 프로젝트 디렉토리로 이동
cd /Users/a17050/side-project/dear-my-days

# 웹 앱 의존성 설치
pnpm install

# 모바일 앱 의존성 설치
cd mobile
npm install
cd ..
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

#### Step 1: 개발 서버 실행 (터미널 1)

```bash
# Next.js 개발 서버 시작
pnpm dev
```

**중요**: iOS 시뮬레이터는 `localhost:3000`에 직접 접근할 수 있으므로 별도 설정 불필요

#### Step 2: Metro 번들러 시작 (터미널 2)

```bash
# 모바일 앱 디렉토리로 이동
cd mobile

# Metro 번들러 시작
npm start
```

**결과:**
```
› Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
› Press o │ open Expo Go
```

#### Step 3A: iOS 시뮬레이터 실행 (방법 1 - 추천)

Metro 번들러 화면에서:
```
Press i
```

또는 별도 터미널에서:
```bash
cd mobile
npm run ios
```

**Expo가 자동으로:**
1. iOS 시뮬레이터 실행
2. Expo Go 앱 빌드 및 설치
3. 앱 실행

#### Step 3B: Xcode에서 실행 (방법 2 - 커스텀 빌드)

```bash
# 네이티브 iOS 프로젝트 생성 (최초 1회)
cd mobile
npx expo prebuild --platform ios

# Xcode 열기
open ios/dearmydays.xcworkspace
```

**Xcode에서:**
1. 상단에서 시뮬레이터 선택 (예: iPhone 15 Pro)
2. ▶️ 버튼 클릭 또는 `Cmd + R`
3. 시뮬레이터가 부팅되고 앱 실행

#### Step 4: 앱 동작 확인

시뮬레이터에서 앱이 실행되면:
- WebView가 `http://localhost:3000` 로드
- 웹 앱의 모든 기능 사용 가능
- 로그인, 이벤트 CRUD 등 정상 동작 확인

### 2. 실제 디바이스 테스트

#### 방법 1: Expo Go 앱 사용 (빠른 테스트)

```bash
# Metro 번들러 실행
cd mobile
npm start

# 결과로 나온 QR 코드를:
# 1. App Store에서 "Expo Go" 앱 설치
# 2. 카메라 앱으로 QR 코드 스캔
# 3. Expo Go에서 앱 열림
```

**장점:**
- 가장 빠른 테스트 방법
- Apple Developer 계정 불필요
- 코드 변경 시 즉시 핫 리로드

**단점:**
- 커스텀 네이티브 코드 사용 불가
- 일부 네이티브 API 제한

#### 방법 2: Development Build (실제 앱 빌드)

```bash
# EAS CLI 설치
npm install -g eas-cli

# EAS 로그인
eas login

# 개발 빌드 생성
eas build --profile development --platform ios

# 빌드 완료 후 디바이스에 설치
# QR 코드를 카메라로 스캔하여 다운로드
```

#### 방법 3: TestFlight (프로덕션 테스트)

```bash
# 프로덕션 빌드
eas build --platform ios --profile production

# App Store Connect 자동 제출
eas submit --platform ios

# TestFlight에서 앱 다운로드
```

**TestFlight 설정:**
1. [App Store Connect](https://appstoreconnect.apple.com) 접속
2. "My Apps" → 앱 선택 → "TestFlight" 탭
3. "Internal Testing" → 테스터 추가
4. 빌드가 처리되면 테스터에게 초대 발송
5. 테스터는 TestFlight 앱에서 앱 다운로드

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

#### Step 2: 개발 서버 실행 (터미널 1)

```bash
# Next.js 개발 서버
pnpm dev
```

**중요**: Android 에뮬레이터는 `localhost:3000`에 직접 접근할 수 없습니다.
`mobile/constants/Config.ts`에서 로컬 IP를 설정해야 합니다.

```typescript
// mobile/constants/Config.ts
const getDevUrl = () => {
  const localIP = '192.168.1.100' // 실제 IP로 변경
  return `http://${localIP}:3000`
}
```

**로컬 IP 확인:**
```bash
# macOS
ifconfig | grep "inet "
# 예: inet 192.168.1.100

# Windows
ipconfig
```

#### Step 3: Metro 번들러 시작 (터미널 2)

```bash
cd mobile
npm start
```

#### Step 4: Android 앱 실행

Metro 번들러 화면에서:
```
Press a
```

또는 별도 터미널에서:
```bash
cd mobile
npm run android
```

**Expo가 자동으로:**
1. Android 에뮬레이터 감지
2. Expo Go 앱 빌드 및 설치
3. 앱 실행

#### Step 5: 앱 동작 확인

에뮬레이터에서 앱이 실행되면:
- WebView가 `http://192.168.1.100:3000` 로드
- 웹 앱의 모든 기능 사용 가능

### 2. 실제 디바이스 테스트

#### 방법 1: Expo Go 앱 사용

```bash
# Metro 번들러 실행
cd mobile
npm start

# QR 코드를:
# 1. Google Play에서 "Expo Go" 앱 설치
# 2. Expo Go 앱 내 스캔 기능으로 QR 코드 스캔
# 3. 앱 열림
```

#### 방법 2: Development Build

```bash
# 개발 빌드 생성
eas build --profile development --platform android

# APK 다운로드 후 디바이스에 설치
adb install app-development.apk
```

#### 방법 3: Internal Testing (Play Store)

```bash
# 프로덕션 빌드
eas build --platform android --profile production

# Google Play Console 자동 제출
eas submit --platform android
```

**Internal Testing 설정:**
1. [Google Play Console](https://play.google.com/console) 접속
2. 앱 선택 → "Testing" → "Internal testing"
3. "Create new release" 클릭
4. AAB 파일 업로드 (EAS가 자동 생성)
5. 테스터 추가 및 초대 링크 전송

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
- [ ] Naver OAuth

#### Android 에뮬레이터
- [ ] 이메일 로그인
- [ ] Google OAuth (Chrome으로 리다이렉트)
- [ ] Kakao OAuth
- [ ] Naver OAuth

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

### WebView 기능

#### iOS
- [ ] WebView 로딩 (localhost:3000)
- [ ] 로딩 인디케이터 표시
- [ ] 네트워크 에러 시 에러 메시지
- [ ] 재시도 기능
- [ ] Swipe Back 제스처
- [ ] Safe Area 처리

#### Android
- [ ] WebView 로딩 (로컬 IP:3000)
- [ ] 로딩 인디케이터 표시
- [ ] 네트워크 에러 시 에러 메시지
- [ ] 재시도 기능
- [ ] 뒤로가기 버튼

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

#### 문제: Metro 번들러 시작 실패
```
Error: EADDRINUSE: address already in use :::8081
```

**해결:**
```bash
# 8081 포트를 사용 중인 프로세스 종료
lsof -ti:8081 | xargs kill -9

# Metro 재시작
npm start
```

### iOS

#### 문제: 시뮬레이터에서 WebView가 로드되지 않음
```
Failed to load: localhost:3000
```

**해결:**
```bash
# 1. 개발 서버가 실행 중인지 확인
lsof -i :3000

# 2. 시뮬레이터 재시작
# Hardware → Restart

# 3. 앱 재실행
npm run ios
```

#### 문제: Expo Go 빌드 실패
```
Build failed with error: No profile named 'development' found
```

**해결:**
```bash
# eas.json 생성
cd mobile
eas build:configure

# 다시 빌드
eas build --profile development --platform ios
```

### Android

#### 문제: 에뮬레이터에서 네트워크 연결 안 됨
```
Failed to load: http://localhost:3000
```

**해결:**
```bash
# 1. Config.ts에서 localhost를 로컬 IP로 변경
# mobile/constants/Config.ts
const localIP = '192.168.1.100' // 실제 IP

# 2. 로컬 IP 확인
ifconfig | grep "inet "

# 3. 웹 서버가 외부 접근 가능한지 확인
# Next.js는 기본적으로 0.0.0.0 바인딩 (외부 접근 가능)
```

#### 문제: Gradle 빌드 실패
```
FAILURE: Build failed with an exception
```

**해결:**
```bash
# Gradle 캐시 클리어
cd mobile/android
./gradlew clean

# 캐시 완전 삭제
rm -rf .gradle
rm -rf app/build

# 재빌드
npm run android
```

#### 문제: 에뮬레이터 실행 안 됨
```
Emulator: ERROR: x86 emulation currently requires hardware acceleration
```

**해결:**
```bash
# M1/M2 Mac: ARM 이미지 사용
# System Image: ARM 64 (arm64-v8a)

# AVD Manager에서 ARM 이미지 선택하여 새 AVD 생성
```

### WebView

#### 문제: WebView에서 이미지가 로드되지 않음

**해결:**
```typescript
// mobile/components/AppWebView.tsx
// mixedContentMode 확인
mixedContentMode="compatibility"  // HTTP 콘텐츠 허용
```

#### 문제: WebView에서 OAuth 리다이렉트 안 됨

**원인**: OAuth는 WebView에서 제한될 수 있음

**해결**: 현재 구현에서는 WebView 내에서 OAuth가 정상 동작합니다.
문제 발생 시 `expo-web-browser` 또는 `expo-auth-session` 사용 고려

---

## 향후 기능 (현재 미구현)

### 푸시 알림
- Expo Notifications 플러그인 추가 예정
- FCM 토큰 등록 및 알림 수신
- 로컬 스케줄 알림

### 인앱결제 (IAP)
- Expo In-App Purchases 플러그인 추가 예정
- Apple StoreKit / Google Play Billing 연동
- 구독 관리

### 딥링크
- Expo Linking 플러그인 추가 예정
- Universal Links (iOS) / App Links (Android)
- OAuth 콜백 처리

### 네이티브 기능
- 파일 공유 (expo-sharing)
- 카메라 접근 (expo-camera)
- 캘린더 연동 (expo-calendar)

---

## 추가 리소스

### 공식 문서
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Native WebView](https://github.com/react-native-webview/react-native-webview)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Next.js Testing](https://nextjs.org/docs/testing)

### 테스트 도구
- [Expo DevTools](https://docs.expo.dev/workflow/debugging/) - 디버깅
- [React Developer Tools](https://react.dev/learn/react-developer-tools) - 컴포넌트 검사
- [Flipper](https://fbflipper.com/) - 네이티브 디버깅

### 디버깅

```bash
# Metro 번들러 로그
npm start

# iOS 시뮬레이터 로그
# 앱 실행 중 터미널에 자동 출력

# Android 에뮬레이터 로그
adb logcat

# Chrome DevTools로 디버깅
# Metro 번들러에서 'j' 누르면 Debugger 열림
```

---

**마지막 업데이트:** 2026-02-08
**버전:** 2.0.0 (React Native WebView)
