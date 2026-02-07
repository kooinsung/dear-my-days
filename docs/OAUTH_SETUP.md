# OAuth 딥링크 설정 가이드

## 개요

이 가이드는 Capacitor 모바일 앱에서 딥링크와 유니버설 링크를 사용하여 OAuth 인증을 구성하는 방법을 설명합니다.

## 아키텍처

앱은 **웹 URL 로드** 방식을 사용합니다:
- OAuth 플로우는 WebView 내에서 진행 (외부 브라우저 없음)
- OAuth 콜백은 `https://dear-my-days.com/auth/callback`으로 이동
- 콜백 라우트가 코드를 교환하고 세션 생성
- 추가 네이티브 코드 불필요!

## 1. Supabase 설정

### 리다이렉트 URL

Supabase 프로젝트에 다음 URL들을 추가하세요:

1. **Supabase Dashboard** → **Authentication** → **URL Configuration** 이동
2. **Redirect URLs**에 다음 URL들 추가:

```
https://dear-my-days.com/auth/callback
http://localhost:3000/auth/callback
dearmydays://auth/callback
capacitor://localhost/auth/callback
```

### OAuth 제공자

Supabase에서 각 제공자를 설정:

#### Google OAuth
1. **Supabase Dashboard** → **Authentication** → **Providers** → **Google**
2. Google 제공자 활성화
3. Google Client ID와 Secret 추가
4. Google Cloud Console의 승인된 리다이렉트 URI:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

#### Kakao OAuth
1. **Supabase Dashboard** → **Authentication** → **Providers** → **Kakao**
2. Kakao 제공자 활성화
3. Kakao REST API 키 추가
4. Kakao Developers의 Redirect URI:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

#### Apple OAuth
1. **Supabase Dashboard** → **Authentication** → **Providers** → **Apple**
2. Apple 제공자 활성화
3. Apple Service ID와 Key 추가
4. Apple Developer Console의 Redirect URI:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

#### Naver OAuth
Naver는 커스텀 구현 사용 (Supabase 내장 아님):
1. Naver Developers에서 리다이렉트 URI 추가:
   - `https://dear-my-days.com/auth/naver/callback`

## 2. iOS Universal Links 설정

Universal Links를 사용하면 iOS가 링크 클릭 시 Safari 대신 앱을 엽니다.

### 1단계: Apple Developer Console

1. **Certificates, Identifiers & Profiles**로 이동
2. App ID 선택 (`com.dearmydays.app`)
3. **Associated Domains** 기능 활성화
4. 저장

### 2단계: Xcode 설정

1. Xcode에서 `ios/App/App.xcworkspace` 열기
2. **App** 타겟 선택
3. **Signing & Capabilities** 탭으로 이동
4. **+ Capability** 클릭 → **Associated Domains** 선택
5. 도메인 추가:
   ```
   applinks:dear-my-days.com
   ```

### 3단계: apple-app-site-association 배포

파일은 이미 다음 위치에 생성되어 있습니다:
```
public/.well-known/apple-app-site-association
```

**중요:** `TEAM_ID`를 Apple Team ID로 업데이트하세요:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "YOUR_TEAM_ID.com.dearmydays.app",
        "paths": ["/auth/callback", "/event/*", "/calendar"]
      }
    ]
  }
}
```

이 파일을 웹 서버에 배포하여 다음 위치에서 접근 가능하도록 하세요:
```
https://dear-my-days.com/.well-known/apple-app-site-association
```

**참고:** 이 파일은 `Content-Type: application/json`으로 제공되어야 하며, 리다이렉트 없이 HTTPS를 통해 접근 가능해야 합니다.

### 4단계: Universal Links 확인

실제 iOS 기기에서 테스트 (시뮬레이터 아님):

```bash
# Safari에서 이 URL 열기
https://dear-my-days.com/auth/callback?test=1

# Safari 대신 앱이 열려야 함
```

또는 Apple의 검증 도구 사용:
```
https://search.developer.apple.com/appsearch-validation-tool/
```

## 3. Android App Links 설정

App Links를 사용하면 Android가 링크 클릭 시 앱을 엽니다.

### 1단계: SHA256 인증서 지문 생성

디버그 빌드용:
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

릴리스 빌드용:
```bash
keytool -list -v -keystore /path/to/your-release-key.keystore -alias your-key-alias
```

**SHA256** 지문을 복사하세요.

### 2단계: assetlinks.json 업데이트

`public/.well-known/assetlinks.json` 편집:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.dearmydays.app",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

이 파일을 다음 위치에 배포:
```
https://dear-my-days.com/.well-known/assetlinks.json
```

### 3단계: App Links 확인

실제 Android 기기에서 테스트:

```bash
# adb로 테스트
adb shell am start -a android.intent.action.VIEW -d "https://dear-my-days.com/auth/callback"

# 앱이 열려야 함
```

또는 Google의 검증 도구 사용:
```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://dear-my-days.com&relation=delegate_permission/common.handle_all_urls
```

## 4. OAuth 플로우 테스트

### 웹 브라우저 (개발)
```bash
pnpm dev
# http://localhost:3000/login 열기
# OAuth 버튼 클릭 → 정상 작동
```

### iOS 시뮬레이터
```bash
pnpm dev:ios
# OAuth 버튼 클릭 → WebView에서 OAuth 열림
# 인증 후 → 앱으로 리다이렉트
```

### Android 에뮬레이터
```bash
pnpm dev:android
# OAuth 버튼 클릭 → WebView에서 OAuth 열림
# 인증 후 → 앱으로 리다이렉트
```

### 딥링크 테스트

#### iOS
```bash
# 커스텀 URL 스킴 테스트
xcrun simctl openurl booted dearmydays://auth/callback?code=test

# Universal Link 테스트 (실제 기기만 가능)
# Messages나 Notes를 통해 링크 전송 후 탭
```

#### Android
```bash
# 커스텀 URL 스킴 테스트
adb shell am start -a android.intent.action.VIEW -d "dearmydays://auth/callback?code=test"

# App Link 테스트
adb shell am start -a android.intent.action.VIEW -d "https://dear-my-days.com/auth/callback?code=test"
```

## 5. 문제 해결

### OAuth가 외부 브라우저에서 열림 (iOS)
- Supabase 리다이렉트 URL에 WebView가 허용되는지 확인
- 리다이렉트 URL에 `capacitor://localhost`가 있는지 확인

### Universal Links가 작동하지 않음
- apple-app-site-association이 HTTPS로 접근 가능한지 확인
- Content-Type이 `application/json`인지 확인
- 실제 기기에서 테스트 (시뮬레이터는 Universal Links 미지원)
- association 파일의 Team ID가 올바른지 확인

### App Links가 작동하지 않음 (Android)
- assetlinks.json이 접근 가능한지 확인
- SHA256 지문이 keystore와 일치하는지 확인
- Digital Asset Links API로 테스트
- AndroidManifest.xml에 `android:autoVerify="true"`가 있는지 확인

### OAuth 콜백이 앱 대신 웹으로 돌아감
- `deep-link.ts`에 딥링크 핸들러가 등록되어 있는지 확인
- Info.plist (iOS)와 AndroidManifest.xml (Android)에 URL 스킴이 있는지 확인
- Supabase 리다이렉트 URL 설정 확인

### OAuth 후 세션이 유지되지 않음
- `/auth/callback/route.ts`가 코드를 올바르게 교환하는지 확인
- Supabase 쿠키가 올바르게 설정되는지 확인
- 브라우저 콘솔에서 에러 확인

## 6. 프로덕션 체크리스트

프로덕션 배포 전:

- [ ] `capacitor.config.ts`의 서버 URL을 프로덕션 도메인으로 업데이트
- [ ] Supabase에서 모든 OAuth 제공자 설정
- [ ] Supabase에 모든 리다이렉트 URL 추가
- [ ] 올바른 Team ID로 apple-app-site-association 배포
- [ ] 릴리스 SHA256 지문으로 assetlinks.json 배포
- [ ] Xcode에서 Universal Links 활성화
- [ ] 실제 기기(iOS 및 Android)에서 OAuth 플로우 테스트
- [ ] 실제 기기에서 딥링크 작동 확인
- [ ] 모든 OAuth 제공자(Google, Kakao, Apple, Naver) 테스트

## 7. 보안 참고사항

- 프로덕션에서는 항상 HTTPS 사용
- OAuth secrets를 클라이언트 코드에 노출하지 말 것
- Naver의 경우 OAuth state 파라미터 검증
- PKCE 플로우 사용 (Supabase에서 기본 활성화)
- 인증 엔드포인트에 rate limiting 구현
- 의심스러운 OAuth 시도 모니터링

## 8. 참고 자료

- [Capacitor Deep Links](https://capacitorjs.com/docs/guides/deep-links)
- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
