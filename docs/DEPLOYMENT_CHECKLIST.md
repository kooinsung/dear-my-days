# Dear My Days 모바일 앱 배포 체크리스트

## 개요

이 체크리스트는 Dear My Days Capacitor 앱을 프로덕션에 배포하는 데 필요한 모든 단계를 다룹니다.

## 배포 전 체크리스트

### 1. 코드 & 설정 ✅

- [x] 모든 단계 구현 완료 (Phase 1-6)
- [x] Capacitor 설정 완료 (`capacitor.config.ts`)
- [x] 환경 변수 문서화 완료
- [x] 린팅 통과 (`pnpm biome check`)
- [x] 빌드 성공 (`pnpm build`)

### 2. 환경 변수

#### 필수 (모든 환경)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Web
NEXT_PUBLIC_WEB_BASE_URL=https://dear-my-days.com
NEXT_PUBLIC_SITE_URL=https://dear-my-days.com

# Email
RESEND_API_KEY=xxx
RESEND_FROM_EMAIL=noreply@dear-my-days.com

# KASI (Lunar Calendar)
KASI_SERVICE_KEY=xxx
```

#### 선택 (OAuth)
```env
# Naver
NEXT_PUBLIC_NAVER_CLIENT_ID=xxx
NAVER_CLIENT_SECRET=xxx

# Google/Kakao/Apple - Configure in Supabase Dashboard
```

#### 선택 (IAP - 구현 시)
```env
APPLE_SHARED_SECRET=xxx
GOOGLE_PACKAGE_NAME=com.dearmydays.app
GOOGLE_SERVICE_ACCOUNT_TOKEN=xxx
```

#### 선택 (푸시 알림 - 구현 시)
```env
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxx\n-----END PRIVATE KEY-----\n"
```

### 3. Supabase 설정

#### 데이터베이스 설정
- [ ] 모든 마이그레이션 실행
- [ ] 테이블 존재 확인:
  - `events`
  - `user_plans`
  - `event_purchases` (IAP 사용 시)
  - `device_tokens` (푸시 사용 시)
  - `event_notification_settings` (푸시 사용 시)
  - `notification_logs` (푸시 사용 시)
- [ ] 모든 테이블에 Row Level Security (RLS) 활성화
- [ ] RLS 정책 테스트

#### 인증 설정
- [ ] 리다이렉트 URL 추가:
  ```
  https://dear-my-days.com/auth/callback
  http://localhost:3000/auth/callback
  dearmydays://auth/callback
  capacitor://localhost/auth/callback
  ```
- [ ] OAuth 제공자 설정 (Google, Kakao, Apple, Naver)
- [ ] 각 OAuth 플로우 테스트

#### Edge Functions (푸시 알림 사용 시)
- [ ] Edge Function 배포:
  ```bash
  supabase functions deploy send-scheduled-notifications
  ```
- [ ] Secrets 설정:
  ```bash
  supabase secrets set FIREBASE_PROJECT_ID=xxx
  supabase secrets set FIREBASE_CLIENT_EMAIL=xxx
  supabase secrets set FIREBASE_PRIVATE_KEY=xxx
  ```
- [ ] pg_cron 작업 설정 (PUSH_NOTIFICATIONS_SETUP.md 참조)

### 4. 웹 배포 (Vercel)

- [ ] GitHub 저장소를 Vercel에 연결
- [ ] Vercel에서 환경 변수 설정
- [ ] 빌드 명령어 설정: `next build`
- [ ] 출력 디렉토리 설정: `.next`
- [ ] 프로덕션 빌드 배포
- [ ] 웹 앱 테스트: https://dear-my-days.com
- [ ] `.well-known` 파일 접근 가능 확인:
  - `/.well-known/apple-app-site-association`
  - `/.well-known/assetlinks.json`

### 5. iOS 설정

#### Apple Developer 계정
- [ ] Apple Developer Program 등록 ($99/년)
- [ ] App ID 생성: `com.dearmydays.app`
- [ ] 기능 활성화:
  - Associated Domains (Universal Links용)
  - Push Notifications
  - In-App Purchase (구현 시)
  - Sign in with Apple (구현 시)

#### Xcode 설정
- [ ] Xcode에서 `ios/App/App.xcworkspace` 열기
- [ ] Bundle Identifier 업데이트: `com.dearmydays.app`
- [ ] Signing & Capabilities 설정:
  - 개발 팀 선택
  - 자동 서명 활성화
  - Associated Domains 추가: `applinks:dear-my-days.com`
  - Push Notifications 기능 추가
- [ ] 버전 및 빌드 번호 업데이트
- [ ] 앱 아이콘 교체 (Assets.xcassets)
- [ ] iOS 시뮬레이터에서 테스트

#### Firebase 설정 (푸시 알림 사용 시)
- [ ] `ios/App/App/`에 `GoogleService-Info.plist` 추가
- [ ] Firebase 의존성으로 `Podfile` 업데이트
- [ ] `pod install` 실행
- [ ] Firebase 초기화 코드로 `AppDelegate.swift` 업데이트
- [ ] Firebase Console에 APNs 키 업로드

#### TestFlight 배포
- [ ] 앱 아카이브 (Product → Archive)
- [ ] App Store Connect로 배포
- [ ] TestFlight에 추가
- [ ] 내부 테스터 초대
- [ ] 실제 기기에서 테스트

#### App Store 제출
- [ ] App Store Connect에서 앱 생성
- [ ] 스크린샷 업로드 (모든 필수 크기)
- [ ] 앱 설명 작성 (한국어 + 영어)
- [ ] 카테고리 및 키워드 설정
- [ ] 개인정보 처리방침 URL 추가
- [ ] 검토 제출

### 6. Android 설정

#### Google Play Console
- [ ] Google Play Developer 계정 생성 ($25 일회성)
- [ ] 애플리케이션 생성
- [ ] 앱 세부정보 설정:
  - 앱 이름: Dear My Days
  - 패키지 이름: `com.dearmydays.app`
  - 카테고리: 라이프스타일 또는 생산성

#### Android Studio 설정
- [ ] Android Studio에서 `android/` 열기
- [ ] `build.gradle`에서 `applicationId` 업데이트: `com.dearmydays.app`
- [ ] 버전 코드 및 버전 이름 업데이트
- [ ] 앱 아이콘 교체 (res/mipmap)
- [ ] 서명 키 생성:
  ```bash
  keytool -genkey -v -keystore my-release-key.keystore \
    -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
  ```
- [ ] `build.gradle`에서 서명 설정
- [ ] Android 에뮬레이터에서 테스트

#### Firebase 설정 (푸시 알림 사용 시)
- [ ] `android/app/`에 `google-services.json` 추가
- [ ] Firebase 의존성으로 `build.gradle` 업데이트
- [ ] `FirebaseMessagingService.java` 생성
- [ ] 서비스로 `AndroidManifest.xml` 업데이트

#### App Links 설정
- [ ] SHA-256 지문 생성:
  ```bash
  keytool -list -v -keystore my-release-key.keystore -alias my-key-alias
  ```
- [ ] 지문으로 `assetlinks.json` 업데이트
- [ ] 확인: https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://dear-my-days.com

#### 내부 테스트
- [ ] 서명된 APK/AAB 빌드:
  ```bash
  cd android
  ./gradlew bundleRelease
  ```
- [ ] 내부 테스트 트랙에 업로드
- [ ] 테스트 사용자 추가
- [ ] 실제 기기에서 테스트

#### 프로덕션 출시
- [ ] 프로덕션 릴리스 생성
- [ ] 서명된 AAB 업로드
- [ ] 스토어 목록 작성:
  - 스크린샷 (모든 필수 크기)
  - 기능 그래픽
  - 앱 설명
  - 개인정보 처리방침 URL
- [ ] 콘텐츠 등급 설정
- [ ] 검토 제출

### 7. 인앱 결제 설정 (구현 시)

#### iOS (App Store Connect)
- [ ] 구독 그룹 생성: "Premium Subscriptions"
- [ ] 제품 생성:
  - `com.dearmydays.premium.monthly` - ₩4,900/월
  - `com.dearmydays.premium.yearly` - ₩49,000/년
- [ ] App-Specific Shared Secret 생성
- [ ] 환경 변수에 추가: `APPLE_SHARED_SECRET`

#### Android (Google Play Console)
- [ ] 구독 제품 생성:
  - `com.dearmydays.premium.monthly` - ₩4,900/월
  - `com.dearmydays.premium.yearly` - ₩49,000/년
- [ ] 결제 기간 및 가격 설정
- [ ] 제품 활성화
- [ ] API 액세스를 위한 서비스 계정 설정
- [ ] 액세스 토큰 생성
- [ ] 환경 변수에 추가

#### 네이티브 코드
- [ ] iOS IAP 구현 (IAP_SETUP.md 참조)
- [ ] Android Billing 구현 (IAP_SETUP.md 참조)
- [ ] 샌드박스 계정으로 테스트

### 8. 푸시 알림 설정 (구현 시)

#### Firebase 설정
- [ ] Firebase 프로젝트 생성
- [ ] iOS 앱 추가 + 설정 다운로드
- [ ] Android 앱 추가 + 설정 다운로드
- [ ] Cloud Messaging 설정
- [ ] APNs 키 업로드 (iOS)

#### 데이터베이스 설정
- [ ] 알림 마이그레이션 실행
- [ ] `get_pending_notifications()` 함수 생성
- [ ] pg_cron 작업 설정

#### 테스트
- [ ] 토큰 등록 테스트
- [ ] 수동 알림 전송 테스트
- [ ] 예약된 알림 테스트
- [ ] 알림 클릭 → 딥링크 테스트

### 9. 테스트 체크리스트

#### 웹 테스트
- [ ] 모든 페이지가 올바르게 로드됨
- [ ] OAuth 로그인 작동
- [ ] 이벤트 CRUD 작동
- [ ] 캘린더 뷰 작동
- [ ] 음력 날짜 변환 작동

#### iOS 테스트
- [ ] 앱이 성공적으로 실행됨
- [ ] OAuth 로그인 작동 (모든 제공자)
- [ ] 딥링크 작동 (`dearmydays://`)
- [ ] Universal Links 작동 (`https://dear-my-days.com/`)
- [ ] 네이티브 뒤로 가기 제스처 작동
- [ ] 상태 표시줄 스타일링 올바름
- [ ] 푸시 알림 작동 (구현 시)
- [ ] IAP 작동 (구현 시)

#### Android 테스트
- [ ] 앱이 성공적으로 실행됨
- [ ] OAuth 로그인 작동 (모든 제공자)
- [ ] 딥링크 작동
- [ ] App Links 작동
- [ ] 네이티브 뒤로 가기 버튼 작동
- [ ] 푸시 알림 작동 (구현 시)
- [ ] IAP 작동 (구현 시)

### 10. 모니터링 & 분석

#### 에러 추적
- [ ] Sentry 또는 유사 도구 설정
- [ ] Error Boundary 설정
- [ ] 에러 리포팅 테스트

#### 분석 (선택)
- [ ] Google Analytics 또는 유사 도구 설정
- [ ] 주요 이벤트 추적:
  - 사용자 등록
  - 이벤트 생성
  - OAuth 로그인
  - 구독 구매
  - 알림 상호작용

#### 성능 모니터링
- [ ] API 응답 시간 모니터링
- [ ] Supabase 쿼리 성능 모니터링
- [ ] Edge Function 실행 모니터링

## 배포 후 체크리스트

### 1일차
- [ ] 크래시 리포트 모니터링
- [ ] 사용자 피드백 확인
- [ ] 분석 추적 확인
- [ ] API 에러 모니터링

### 1주차
- [ ] 앱 스토어 리뷰 검토
- [ ] 치명적인 버그 수정
- [ ] 구독 전환율 모니터링 (해당 시)
- [ ] 알림 전달률 확인 (해당 시)

### 1개월차
- [ ] 사용자 유지율 분석
- [ ] 성능 병목 최적화
- [ ] 기능 업데이트 계획
- [ ] 사용자 피드백 대응

## 유지보수 체크리스트

### 매월
- [ ] 에러 로그 검토
- [ ] Capacitor 업데이트 확인
- [ ] 의존성 업데이트 확인
- [ ] 앱 스토어 리뷰 검토

### 분기별
- [ ] 개인정보 처리방침 업데이트 (필요 시)
- [ ] 데이터베이스 쿼리 검토 및 최적화
- [ ] 보안 관행 감사
- [ ] 주요 기능 릴리스 계획

### 연간
- [ ] Apple Developer 멤버십 갱신
- [ ] 앱 스크린샷 검토 및 업데이트
- [ ] 주요 버전 업데이트
- [ ] 보안 감사

## 긴급 절차

### 치명적인 버그 발견
1. 심각도 식별 (크래시, 데이터 손실, 보안)
2. 개발 환경에서 수정
3. 철저한 테스트
4. 프로덕션에 핫픽스 배포
5. 긴급 앱 업데이트 제출

### 서버 장애
1. Vercel 상태 확인
2. Supabase 상태 확인
3. 서드파티 서비스 확인 (Firebase 등)
4. 사용자에게 공지 (상태 페이지)
5. 가능하면 폴백 구현

### 데이터 유출
1. 유출 범위 식별
2. 영향받은 사용자에게 알림
3. 필요 시 자격 증명 재설정
4. 보안 관행 검토
5. 당국에 보고 (필요 시)

## 롤백 절차

### 웹 (Vercel)
```bash
# 이전 배포로 롤백
vercel rollback
```

### 모바일 앱
- iOS: 롤백 불가 (새 버전 제출)
- Android: Play Console의 릴리스 관리 사용
- 사용자에게 문제 공지

## 리소스

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Apple Developer](https://developer.apple.com)
- [Google Play Console](https://play.google.com/console)
- [Vercel Docs](https://vercel.com/docs)

## 지원 연락처

- 기술 지원: support@dear-my-days.com
- 긴급 연락처: emergency@dear-my-days.com
- 개발자 GitHub: https://github.com/dearmydays/app

---

**마지막 업데이트:** 2026-02-07
**버전:** 1.0.0
