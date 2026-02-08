# Dear My Days - Mobile App

React Native WebView 기반 모바일 애플리케이션

## 개요

Dear My Days 모바일 앱은 순수 React Native + react-native-webview로 구현되었습니다.
웹 URL을 로드하는 방식으로, 웹 애플리케이션의 모든 기능을 그대로 사용할 수 있습니다.

## 기술 스택

- **React Native**: 0.74.5 (Node 18 호환)
- **React**: 18.2.0
- **react-native-webview**: ^13.12.3
- **TypeScript**: ~5.0.4

## 사전 요구사항

### Node.js
- **Node 18.x** (현재 시스템 버전: 18.20.3)
- React Native 0.74.5는 Node 18과 호환됩니다

### CocoaPods (iOS 개발 시 필요)

CocoaPods가 설치되어 있지 않다면 먼저 설치하세요:

```bash
# Homebrew로 설치 (권장)
brew install cocoapods

# 또는 RubyGems로 설치
sudo gem install cocoapods
```

설치 확인:
```bash
pod --version
```

## 초기 설정

### 1. 의존성 설치

**이 프로젝트는 pnpm workspace로 관리됩니다. 루트 디렉토리에서 설치하세요.**

```bash
# 프로젝트 루트에서
cd /Users/a17050/side-project/dear-my-days
pnpm install
```

### 2. iOS CocoaPods 의존성 설치

```bash
cd mobile/ios
pod install
cd ../..
```

**문제 발생 시**:
- `pod: command not found` → 위의 "사전 요구사항" 섹션 참고
- 설치 실패 → `pod repo update` 후 재시도

### 3. Android 설정

Android 네이티브 프로젝트는 이미 포함되어 있습니다.
Android Studio에서 `mobile/android` 디렉토리를 열어 Gradle 동기화를 수행하세요.

## 개발

**이 프로젝트는 pnpm workspace를 사용합니다. 모든 명령은 프로젝트 루트에서 실행하세요.**

### 웹 서버 실행 (터미널 1)

```bash
# 프로젝트 루트에서
pnpm dev
```

### Metro 번들러 시작 (터미널 2)

```bash
# 프로젝트 루트에서
pnpm mobile
```

### iOS 실행 (터미널 3)

```bash
# 프로젝트 루트에서
pnpm mobile:ios

# 또는 특정 디바이스 지정
pnpm --filter DearMyDays ios -- --simulator="iPhone 15 Pro"
```

### Android 실행 (터미널 3)

**중요**: Android 에뮬레이터에서 테스트하기 전에 `src/constants/Config.ts`의 IP 주소를 확인하세요.

```bash
# 프로젝트 루트에서
pnpm mobile:android
```

## 환경 설정

### 개발 URL 변경

`src/constants/Config.ts` 파일에서 로컬 개발 URL을 변경할 수 있습니다:

```typescript
const getDevUrl = () => {
  if (Platform.OS === 'ios') {
    return 'http://localhost:3000';  // iOS 시뮬레이터
  } else {
    return 'http://10.0.2.2:3000';   // Android 에뮬레이터
    // 실제 디바이스: 'http://192.168.1.100:3000'
  }
};
```

**Android 실제 디바이스 테스트:**
1. 로컬 IP 주소 확인: `ifconfig | grep "inet "`
2. `Config.ts`에서 Android URL을 로컬 IP로 변경
3. 웹 서버와 디바이스가 같은 네트워크에 있는지 확인

## 프로젝트 구조

```
mobile/
├── android/                # Android 네이티브 프로젝트
├── ios/                    # iOS 네이티브 프로젝트
├── src/
│   ├── App.tsx            # 앱 진입점
│   ├── components/
│   │   ├── AppWebView.tsx # 메인 WebView 컴포넌트
│   │   └── WebViewStack.tsx # 스택 WebView 관리
│   ├── modules/           # 네이티브 모듈
│   │   ├── PlatformModule.ts # 플랫폼 감지
│   │   └── DeepLinkModule.ts # 딥링크 처리
│   └── constants/
│       └── Config.ts      # 환경 설정
├── index.js               # React Native 진입점
├── app.json               # 앱 설정
├── babel.config.js        # Babel 설정
├── metro.config.js        # Metro 번들러 설정
├── tsconfig.json          # TypeScript 설정
└── package.json           # 의존성
```

## 빌드 및 배포

### iOS

#### 개발 빌드 (Xcode)

```bash
# Xcode 열기
open ios/DearMyDays.xcworkspace

# Xcode에서:
# 1. 시뮬레이터/디바이스 선택
# 2. ▶️ 버튼 클릭
```

#### 프로덕션 빌드 (Archive)

```bash
# Xcode에서:
# 1. Product → Scheme → Edit Scheme
# 2. Run → Build Configuration → Release
# 3. 타겟을 "Any iOS Device (arm64)"로 선택
# 4. Product → Archive
# 5. Distribute App → App Store Connect
```

### Android

#### 개발 빌드 (APK)

```bash
cd android
./gradlew assembleDebug

# 결과: android/app/build/outputs/apk/debug/app-debug.apk
```

#### 프로덕션 빌드 (AAB)

```bash
cd android
./gradlew bundleRelease

# 결과: android/app/build/outputs/bundle/release/app-release.aab
```

**서명 설정 필요** (프로덕션):
1. 릴리스 키 생성
2. `android/app/build.gradle`에 서명 설정 추가
3. 키스토어 파일 보관 (Git에 커밋하지 말것!)

## 문제 해결

### iOS

#### 문제: `pod install` 실패

```bash
# CocoaPods 캐시 클리어
cd ios
pod deintegrate
pod install
```

#### 문제: Xcode 빌드 실패

```bash
# 클린 빌드
cd ios
xcodebuild clean
rm -rf ~/Library/Developer/Xcode/DerivedData/*
pod install
```

### Android

#### 문제: Gradle 빌드 실패

```bash
cd android
./gradlew clean
rm -rf .gradle app/build
./gradlew assembleDebug
```

#### 문제: WebView 로딩 안 됨 (Android 에뮬레이터)

```typescript
// src/constants/Config.ts
// localhost 대신 10.0.2.2 사용
return 'http://10.0.2.2:3000';
```

### WebView

#### 문제: OAuth 리다이렉트 안 됨

현재 구현은 WebView 내에서 OAuth를 처리합니다.
문제 발생 시 네이티브 브라우저를 사용하도록 수정 필요:
- iOS: `SFSafariViewController`
- Android: `Chrome Custom Tabs`

## Expo와의 차이점

| 항목 | React Native CLI | Expo |
|------|------------------|------|
| **앱 크기** | 최소화 (~10-15MB) | 크다 (~50MB+) |
| **설정** | 복잡 (네이티브 필요) | 간단 |
| **빌드** | Xcode/Android Studio | EAS Build |
| **네이티브 모듈** | 완전 제어 | 제한적 |
| **OTA 업데이트** | 수동 구현 | 내장 지원 |

## 웹-네이티브 통신 (Native Bridge)

이 앱은 웹앱과 네이티브 앱 간 통신을 위해 **Native Bridge** 시스템을 사용합니다.

### 구현된 기능
- ✅ **WebView 스택 네비게이션**: 새 페이지를 전체 화면 WebView로 열기
- ✅ **플랫폼 감지**: iOS/Android 구분
- ✅ **딥링크**: OAuth 콜백 처리 (`dearmydays://`)
- ✅ **외부 URL**: 전화, 이메일, 브라우저 열기

### 웹앱에서 사용하기

```typescript
// 웹앱 코드 예시
import { NativeBridge } from '@/libs/native-bridge'

// 새 WebView 열기
NativeBridge.openWebView('/event/edit/123', '이벤트 수정')

// 외부 URL 열기
NativeBridge.openExternalUrl('tel:010-1234-5678')
```

자세한 API 문서: [/docs/NATIVE_BRIDGE_API.md](../docs/NATIVE_BRIDGE_API.md)

### 향후 추가 예정 기능

#### 푸시 알림 (Phase 3)
- React Native Firebase 추가
- FCM 토큰 등록 및 알림 수신

#### 인앱결제 (Phase 4)
- react-native-iap 추가
- Apple StoreKit / Google Play Billing 연동

#### 기타 네이티브 기능
- 파일 공유 (react-native-share)
- 캘린더 연동

## 참고 자료

- [React Native 문서](https://reactnative.dev/)
- [React Native WebView](https://github.com/react-native-webview/react-native-webview)
- [Metro 번들러](https://metrobundler.dev/)
- [iOS 개발 가이드](https://reactnative.dev/docs/running-on-device)
- [Android 개발 가이드](https://reactnative.dev/docs/signed-apk-android)

---

**마지막 업데이트**: 2026-02-08
**버전**: 1.0.0 (React Native CLI)
