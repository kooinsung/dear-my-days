# Supabase 리다이렉트 URL 설정

## 빠른 설정

Supabase 프로젝트에 다음 URL들을 추가하세요:

**Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**

```
https://dear-my-days.com/auth/callback
http://localhost:3000/auth/callback
dearmydays://auth/callback
capacitor://localhost/auth/callback
```

## URL 설명

| URL | 용도 |
|-----|------|
| `https://dear-my-days.com/auth/callback` | 프로덕션 웹앱 & Universal Links (iOS) / App Links (Android) |
| `http://localhost:3000/auth/callback` | 로컬 개발 환경 (웹 브라우저) |
| `dearmydays://auth/callback` | 모바일 앱 딥링크용 커스텀 URL 스킴 |
| `capacitor://localhost/auth/callback` | Capacitor WebView 내부 URL |

## 왜 여러 URL이 필요한가?

1. **프로덕션 웹**: 브라우저에서 dear-my-days.com을 사용하는 사용자
2. **로컬 개발**: localhost에서 테스트
3. **커스텀 스킴**: 모바일 딥링크 폴백
4. **Capacitor 내부**: WebView OAuth 플로우에 필요

## 각 URL 테스트

### 프로덕션
```bash
# Vercel에 배포
vercel --prod

# 브라우저에서 OAuth 테스트
https://dear-my-days.com/login
```

### 로컬 개발
```bash
# 개발 서버 실행
pnpm dev

# OAuth 테스트
http://localhost:3000/login
```

### 모바일 앱 (개발 모드)
```bash
# iOS
pnpm dev:ios

# Android
pnpm dev:android

# OAuth는 내부적으로 capacitor://localhost URL 사용
```

### 딥링크
```bash
# iOS
xcrun simctl openurl booted dearmydays://auth/callback?code=test

# Android
adb shell am start -a android.intent.action.VIEW -d "dearmydays://auth/callback?code=test"
```

## 일반적인 문제

### "Invalid redirect URL" 에러
- URL이 위에 표시된 대로 정확히 Supabase에 추가되었는지 확인
- 후행 슬래시 확인 (추가하지 마세요)
- URL이 Site URL이 아닌 **Redirect URLs** 섹션에 있는지 확인

### OAuth가 WebView 대신 브라우저에서 열림
- `capacitor://localhost/auth/callback`을 리다이렉트 URL에 추가
- Capacitor가 올바르게 설정되었는지 확인

### Universal Links가 앱을 열지 않음
- `https://dear-my-days.com/auth/callback`이 리다이렉트 URL에 있는지 확인
- apple-app-site-association 파일 배포
- 실제 기기에서 테스트 (시뮬레이터 아님)

## 프로덕션 체크리스트

라이브 전:

- [ ] Supabase 리다이렉트 URL에 프로덕션 URL 추가
- [ ] 프로덕션에서 localhost URL 제거 (선택사항, 보안을 위해)
- [ ] 프로덕션 도메인에서 OAuth 테스트
- [ ] iOS 기기에서 Universal Links 작동 확인
- [ ] Android 기기에서 App Links 작동 확인
