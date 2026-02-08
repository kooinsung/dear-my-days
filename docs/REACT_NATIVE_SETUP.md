# React Native 모바일 앱 설정 가이드

> Dear My Days 모바일 앱은 **React Native CLI 0.74.5 + react-native-webview**로 구축되었습니다.

## 목차

1. [프로젝트 구조](#프로젝트-구조)
2. [개발 환경 설정](#개발-환경-설정)
3. [개발 서버 실행](#개발-서버-실행)
4. [빌드 및 배포](#빌드-및-배포)
5. [딥링크 설정](#딥링크-설정)
6. [트러블슈팅](#트러블슈팅)

---

## 프로젝트 구조

```
dear-my-days/
├── app/                          # Next.js 웹앱
│   └── libs/
│       └── native-bridge/        # 웹-네이티브 통신 모듈
│           ├── types.ts          # 메시지 타입 정의
│           ├── index.ts          # NativeBridge API
│           └── hooks.ts          # React 훅
│
├── mobile/                       # React Native 앱
│   ├── src/
│   │   ├── App.tsx              # 앱 진입점
│   │   ├── components/
│   │   │   ├── AppWebView.tsx   # 메인 WebView 컴포넌트
│   │   │   └── WebViewStack.tsx # 스택 WebView 관리
│   │   ├── modules/             # 네이티브 모듈
│   │   │   ├── PlatformModule.ts
│   │   │   └── DeepLinkModule.ts
│   │   └── constants/
│   │       └── Config.ts        # 환경 설정
│   ├── ios/                     # iOS 네이티브 프로젝트
│   ├── android/                 # Android 네이티브 프로젝트
│   ├── package.json
│   └── README.md
│
└── package.json                  # 루트 프로젝트 (웹앱)
```

---

## 개발 환경 설정

### 필수 요구사항

**공통:**
- Node.js >= 20.9.0
- npm 또는 yarn

**iOS 개발:**
- macOS (필수)
- Xcode >= 14.0
- CocoaPods (`sudo gem install cocoapods`)

**Android 개발:**
- JDK 17
- Android Studio
- Android SDK (API Level 34+)

### 초기 설정

1. **모바일 프로젝트 의존성 설치:**

```bash
cd mobile
npm install

# iOS 의존성 설치 (macOS만 해당)
cd ios && pod install && cd ..
```

2. **환경 설정 확인:**

`mobile/src/constants/Config.ts` 파일에서 웹앱 URL을 확인합니다:

```typescript
export const Config = {
  webUrl: __DEV__
    ? 'http://localhost:3000'  // 개발 환경
    : 'https://dear-my-days.com',  // 프로덕션
};
```

---

## 개발 서버 실행

### 웹앱 개발 서버

먼저 웹앱 개발 서버를 실행해야 합니다:

```bash
# 프로젝트 루트에서
pnpm dev
```

→ http://localhost:3000 에서 실행됨

### iOS 시뮬레이터

```bash
# 루트에서 실행
pnpm mobile:ios

# 또는 mobile 디렉토리에서
cd mobile
npm run ios
```

**특정 시뮬레이터 지정:**
```bash
npm run ios -- --simulator="iPhone 15 Pro"
```

### Android 에뮬레이터

1. Android Studio에서 에뮬레이터 실행
2. 앱 실행:

```bash
# 루트에서 실행
pnpm mobile:android

# 또는 mobile 디렉토리에서
cd mobile
npm run android
```

### Metro 번들러만 실행

```bash
pnpm mobile
# 또는
cd mobile && npm start
```

---

## 빌드 및 배포

### iOS 릴리스 빌드

1. **Xcode에서 열기:**

```bash
cd mobile/ios
open App.xcworkspace
```

2. **서명 설정:**
   - Xcode → Signing & Capabilities
   - Team 선택
   - Bundle Identifier 확인 (`com.dearmydays.app`)

3. **빌드:**
   - Product → Archive
   - Distribute App → App Store Connect

### Android 릴리스 빌드

1. **서명 키 생성 (최초 1회):**

```bash
cd mobile/android/app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore \
  -alias release -keyalg RSA -keysize 2048 -validity 10000
```

2. **gradle.properties 설정:**

`mobile/android/gradle.properties`에 추가:

```properties
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=release
MYAPP_RELEASE_STORE_PASSWORD=****
MYAPP_RELEASE_KEY_PASSWORD=****
```

3. **APK 빌드:**

```bash
cd mobile/android
./gradlew assembleRelease
```

→ 생성 경로: `android/app/build/outputs/apk/release/app-release.apk`

4. **AAB 빌드 (Google Play):**

```bash
./gradlew bundleRelease
```

→ 생성 경로: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 딥링크 설정

### URL Scheme: `dearmydays://`

**iOS 설정:**

`mobile/ios/App/App/Info.plist`에 이미 설정됨:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>dearmydays</string>
    </array>
  </dict>
</array>
```

**Android 설정:**

`mobile/android/app/src/main/AndroidManifest.xml`에 이미 설정됨:

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="dearmydays" />
</intent-filter>
```

### Universal Links (iOS) / App Links (Android)

**도메인:** `dear-my-days.com`

**iOS:**
- Associated Domains Entitlement 필요
- `.well-known/apple-app-site-association` 파일 배포

**Android:**
- `autoVerify="true"` 설정
- `.well-known/assetlinks.json` 파일 배포

### 테스트

**iOS:**
```bash
xcrun simctl openurl booted "dearmydays://auth/callback?code=test123"
```

**Android:**
```bash
adb shell am start -a android.intent.action.VIEW \
  -d "dearmydays://auth/callback?code=test123"
```

---

## 트러블슈팅

### 1. Metro 번들러 연결 실패

**증상:** "Unable to resolve module..."

**해결:**
```bash
cd mobile
# 캐시 삭제
rm -rf node_modules
npm install

# Metro 캐시 삭제
npm start -- --reset-cache
```

### 2. iOS 빌드 에러

**증상:** "library not found for -l..."

**해결:**
```bash
cd mobile/ios
pod deintegrate
pod install
```

### 3. Android 빌드 에러

**증상:** "AAPT: error: resource..."

**해결:**
```bash
cd mobile/android
./gradlew clean
./gradlew assembleDebug
```

### 4. WebView에서 웹앱이 로드되지 않음

**확인 사항:**
- 웹앱 개발 서버가 실행 중인가? (`pnpm dev`)
- iOS 시뮬레이터/Android 에뮬레이터가 localhost에 접근 가능한가?
- `mobile/src/constants/Config.ts`의 URL이 올바른가?

**Android localhost 접근:**
```bash
# localhost:3000 → 10.0.2.2:3000 (에뮬레이터 전용 주소)
adb reverse tcp:3000 tcp:3000
```

### 5. 딥링크가 동작하지 않음

**iOS:**
- Info.plist의 URL Scheme 확인
- 앱 재설치

**Android:**
- AndroidManifest.xml의 intent-filter 확인
- `adb logcat` 로그 확인

---

## 유용한 명령어

```bash
# 웹앱 개발
pnpm dev                    # 웹앱 개발 서버
pnpm build                  # 웹앱 프로덕션 빌드

# 모바일 개발 (루트에서)
pnpm mobile                 # Metro 번들러만 실행
pnpm mobile:ios             # iOS 시뮬레이터 실행
pnpm mobile:android         # Android 에뮬레이터 실행

# 모바일 개발 (mobile/ 디렉토리에서)
npm start                   # Metro 번들러
npm run ios                 # iOS 시뮬레이터
npm run android             # Android 에뮬레이터

# 디버깅
npx react-native log-ios    # iOS 로그
npx react-native log-android # Android 로그

# 캐시 삭제
npm start -- --reset-cache  # Metro 캐시 삭제
watchman watch-del-all      # Watchman 캐시 삭제
```

---

## 참고 자료

- [React Native 공식 문서](https://reactnative.dev/)
- [react-native-webview](https://github.com/react-native-webview/react-native-webview)
- [React Native 환경 설정](https://reactnative.dev/docs/environment-setup)
- [iOS 배포 가이드](https://reactnative.dev/docs/publishing-to-app-store)
- [Android 배포 가이드](https://reactnative.dev/docs/signed-apk-android)
- [딥링크 가이드](https://reactnative.dev/docs/linking)

---

**마지막 업데이트:** 2026-02-08
