# 인앱결제 (IAP) 설정 가이드

## 개요

이 가이드는 Capacitor 앱에서 iOS (Apple) 및 Android (Google Play) 인앱결제를 구현하는 방법을 설명합니다.

## 아키텍처

**네이티브 결제 처리:** [`@capgo/native-purchases`](https://github.com/Cap-go/native-purchases) (v8.1.0)
- iOS: StoreKit 2, Android: Google Play Billing Library를 래핑한 Capacitor 플러그인
- 별도의 네이티브 코드(Swift/Java) 작성 없이 JavaScript에서 직접 호출

**구현 상태:**
- ✅ 클라이언트 IAP 유틸리티 (`app/libs/capacitor/iap.ts`)
- ✅ 영수증 검증 API (`/api/iap/verify`, `/api/iap/restore`)
- ✅ 구독 상태 API (`/api/iap/subscription`)
- ✅ 구독 관리 UI (`/settings/subscription`)
- ✅ 서버 측 영수증 검증 (`app/libs/iap/verify.ts`)

## 상품 ID

App Store Connect 및 Google Play Console에 다음 상품 ID를 등록하세요:

```typescript
{
  PREMIUM_MONTHLY: 'com.dearmydays.premium.monthly',  // ₩4,900/월 (자동 갱신 구독)
  PREMIUM_YEARLY: 'com.dearmydays.premium.yearly',    // ₩49,000/년 (자동 갱신 구독)
  EVENT_SLOT: 'com.dearmydays.event.slot',            // ₩1,900 (소모품 단건 구매)
}
```

**상품 유형:**
| 상품 | 유형 | iOS | Android |
|------|------|-----|---------|
| 월간 프리미엄 | 자동 갱신 구독 | Auto-Renewable Subscription | 정기 결제 (Subscription) |
| 연간 프리미엄 | 자동 갱신 구독 | Auto-Renewable Subscription | 정기 결제 (Subscription) |
| 이벤트 슬롯 | 소모품 (단건) | Consumable | 인앱 상품 (One-time product) |

## 1. iOS 설정 (Apple)

### 1단계: App Store Connect 설정

1. [App Store Connect](https://appstoreconnect.apple.com) 접속
2. 앱 선택 → **인앱 구입** 메뉴
3. **+** 버튼을 클릭하여 새 구독 생성

**구독 상품 설정 (월간/연간):**
- 상품 ID: `com.dearmydays.premium.monthly` / `com.dearmydays.premium.yearly`
- 유형: **자동 갱신 구독**
- 구독 그룹: "Premium Subscriptions" 생성
- 기간: 1개월 / 1년
- 가격: ₩4,900 / ₩49,000
- 현지화: 한국어 및 영어 설명 추가

**소모품 상품 설정 (이벤트 슬롯):**
- 상품 ID: `com.dearmydays.event.slot`
- 유형: **소모품 (Consumable)**
- 가격: ₩1,900
- 설명: "이벤트 등록 슬롯 1개 추가"
- 현지화: 한국어 및 영어 설명 추가

4. 영수증 검증용 **Shared Secret** 생성:
   - App Store Connect → 앱 → 인앱 구입 → 앱별 공유 암호
   - 생성 후 저장

### 2단계: 환경 변수

`.env.local`에 추가:
```env
APPLE_SHARED_SECRET=your_shared_secret_here
```

### 3단계: Capacitor 플러그인 동기화

`@capgo/native-purchases`가 네이티브 StoreKit 2를 자동으로 처리하므로 별도의 Swift 코드 작성이 불필요합니다.

```bash
# 웹 빌드 후 iOS 프로젝트에 동기화
pnpm cap:sync
# 또는 프로덕션 빌드로 동기화
pnpm cap:sync:prod
```

동기화하면 `@capgo/native-purchases` 플러그인이 iOS 프로젝트에 자동 설치됩니다.

### 4단계: 테스트

1. **Sandbox 테스트:**
   - App Store Connect에서 Sandbox 테스터 계정 생성
   - 디바이스에서 실제 Apple ID 로그아웃
   - 구매 시 Sandbox 계정으로 로그인

2. **테스트 플로우:**
   ```bash
   pnpm dev:ios
   # /settings/subscription으로 이동
   # "구독하기" 클릭
   # StoreKit 결제 시트가 표시되어야 함
   ```

## 2. Android 설정 (Google Play)

### 1단계: Google Play Console 설정

1. [Google Play Console](https://play.google.com/console) 접속
2. 앱 선택 → **수익 창출 설정** → **제품**

#### 정기 결제 (Subscription) 설정

3. **정기 결제** 탭 → **정기 결제 만들기**

**월간 구독 설정:**
- 상품 ID: `com.dearmydays.premium.monthly`
- 이름: Premium Monthly
- 설명: 월간 프리미엄 구독
- 기본 요금제 추가:
  - 요금제 ID: `monthly-plan`
  - 결제 주기: 1개월
  - 가격: ₩4,900

**연간 구독 설정:**
- 상품 ID: `com.dearmydays.premium.yearly`
- 이름: Premium Yearly
- 설명: 연간 프리미엄 구독 (2개월 무료)
- 기본 요금제 추가:
  - 요금제 ID: `yearly-plan`
  - 결제 주기: 1년
  - 가격: ₩49,000

#### 인앱 상품 (One-time product) 설정

4. **인앱 상품** 탭 → **상품 만들기**

**이벤트 슬롯 설정:**
- 상품 ID: `com.dearmydays.event.slot`
- 이름: 이벤트 슬롯 추가
- 설명: 이벤트 등록 슬롯 1개 추가
- 기본 가격: ₩1,900
- **참고:** 소모품(Consumable)이므로 사용자가 여러 번 구매 가능

### 2단계: 서비스 계정 설정

1. **Google Cloud Console:**
   - IAM 및 관리자 → 서비스 계정
   - 앱용 서비스 계정 생성
   - "소유자" 또는 "편집자" 역할 부여
   - JSON 키 생성 후 다운로드

2. **Play Console에 연결:**
   - Play Console → 설정 → API 액세스
   - 서비스 계정 연결
   - "재무 데이터 보기" 권한 부여

3. **액세스 토큰 생성:**
   ```bash
   # gcloud CLI 설치
   gcloud auth activate-service-account --key-file=service-account-key.json
   gcloud auth print-access-token
   ```

### 3단계: 환경 변수

`.env.local`에 추가:
```env
GOOGLE_PACKAGE_NAME=com.dearmydays.app
GOOGLE_SERVICE_ACCOUNT_TOKEN=your_access_token_here
```

**참고:** 액세스 토큰은 1시간 후 만료됩니다. 프로덕션에서는 서비스 계정 키를 사용한 자동 토큰 갱신을 구현하세요.

### 4단계: Capacitor 플러그인 동기화

`@capgo/native-purchases`가 네이티브 Google Play Billing Library를 자동으로 처리하므로 별도의 Java 코드 작성이 불필요합니다.

```bash
# 웹 빌드 후 Android 프로젝트에 동기화
pnpm cap:sync
# 또는 프로덕션 빌드로 동기화
pnpm cap:sync:prod
```

동기화하면 `@capgo/native-purchases` 플러그인이 Android 프로젝트에 자동 설치됩니다.

### 5단계: 테스트

1. **라이선스 테스터 설정:**
   - Play Console → **설정** → **라이선스 테스트**
   - 테스트용 Google 계정 이메일 추가
   - 해당 계정으로 실제 결제 없이 테스트 구매 가능

2. **구독 테스트:**
   ```bash
   pnpm dev:android
   # /settings/subscription으로 이동
   # "월간 구독" 또는 "연간 구독" 클릭
   # Google Play 결제 다이얼로그가 표시되어야 함
   # 테스트 카드로 결제 → 서버 검증 로그 확인
   ```

3. **이벤트 슬롯 (소모품) 테스트:**
   ```bash
   pnpm dev:android
   # /settings/subscription으로 이동
   # "이벤트 슬롯 추가" 클릭
   # Google Play 결제 다이얼로그가 표시되어야 함
   # 결제 완료 후:
   #   - 소비(consume) 처리가 되었는지 확인
   #   - user_plans.extra_event_slots가 증가했는지 확인
   #   - 동일 상품을 다시 구매할 수 있는지 확인 (소모품)
   ```

4. **주의사항:**
   - 인앱 상품은 Play Console에 등록 후 **활성화까지 최대 24시간** 소요
   - 앱이 내부 테스트 트랙 이상에 **한 번 이상 업로드**되어야 결제 테스트 가능
   - 소모품은 `consumeAsync()` 호출 후에만 재구매 가능

## 3. 전체 플로우 테스트

### 웹 테스트 (Mock)
```bash
pnpm dev
# http://localhost:3000/settings/subscription 접속
# Mock 가격이 포함된 상품 목록이 표시되어야 함
# "구독하기" 클릭 시 에러 표시 (웹에서는 IAP 불가)
```

### iOS 테스트
```bash
pnpm dev:ios
# Sandbox Apple ID 사용
# 구매 완료
# 영수증 검증 로그 확인
```

### Android 테스트
```bash
pnpm dev:android
# 라이선스 테스터 계정 사용
# 구매 완료
# 토큰 검증 로그 확인
```

## 4. 프로덕션 배포

### iOS
1. IAP가 설정된 상태로 앱 심사 제출
2. 모든 상품 ID가 승인되었는지 확인
3. 출시 전 TestFlight으로 테스트
4. App Store Connect에서 구독 모니터링

### Android
1. Play Console에서 구독 상품 활성화
2. 내부/비공개 테스트 트랙에서 테스트
3. 프로덕션 릴리스 제출
4. Play Console에서 구독 모니터링

## 5. 구독 관리

### 사용자 해지

**iOS:**
- 사용자가 설정 앱 → Apple ID → 구독에서 해지
- 앱에서 프로그래밍 방식으로 구독 해지 불가
- 사용자를 설정으로 안내하는 UI 구현

**Android:**
- 사용자가 Google Play 스토어 → 구독에서 해지
- 앱에서 `NativePurchases.manageSubscriptions()` 호출로 구독 관리 페이지 열기

### 구독 상태 확인

- `/api/iap/subscription`을 주기적으로 폴링
- 사용자에게 만료일 표시
- 유예 기간 처리 (결제 재시도)
- 갱신일 표시

### 영수증 검증

- **항상 서버에서 영수증 검증**
- 클라이언트 측 검증을 신뢰하지 말 것
- 재전송 공격 방지를 위해 트랜잭션 ID 저장
- 만료된 구독을 우아하게 처리

## 6. 보안 모범 사례

- ✅ 시크릿을 환경 변수에 저장 (코드에 포함 금지)
- ✅ 모든 영수증을 서버에서 검증
- ✅ 모든 API 호출에 HTTPS 사용
- ✅ 멱등성 구현 (중복 트랜잭션 확인)
- ✅ 사기 탐지를 위해 모든 구매 시도 로깅
- ❌ Apple Shared Secret을 클라이언트에 노출 금지
- ❌ Google 서비스 계정 자격증명을 클라이언트에 노출 금지
- ❌ 서버 측 검증을 건너뛰지 말 것

## 7. 일반적인 문제

### iOS: "iTunes Store에 연결할 수 없습니다"
- Sandbox 환경 설정 확인
- Sandbox 테스터 계정 검증
- 앱이 개발 인증서로 서명되었는지 확인

### iOS: "영수증 검증 실패"
- `APPLE_SHARED_SECRET`이 올바른지 확인
- 상태 코드가 21007이면 Sandbox URL 시도
- 영수증 데이터가 base64 인코딩되었는지 확인

### Android: "상품을 사용할 수 없습니다"
- Play Console에서 상품 활성화 확인
- 활성화 후 24시간 대기
- 앱 버전이 Play Console과 일치하는지 확인

### Android: "구매 정보를 조회할 수 없습니다"
- Play Console API 액세스 확인
- 서비스 계정 권한 검증
- `pnpm cap:sync` 실행하여 플러그인이 정상 설치되었는지 확인

### 공통: "이미 처리된 트랜잭션"
- 정상 동작 (이중 결제 방지)
- 정상적인 복원인 경우 user_plans만 업데이트

## 8. 클라이언트 구현 (`app/libs/capacitor/iap.ts`)

`@capgo/native-purchases`를 래핑한 유틸리티 함수들이 구현되어 있습니다:

```typescript
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases'
```

### 주요 함수

| 함수 | 설명 |
|------|------|
| `isIAPAvailable()` | IAP 지원 여부 확인 (네이티브 환경만 true) |
| `getProducts()` | 상품 목록 조회 (SUBS + INAPP 각각 조회) |
| `purchaseProduct(productId, userId)` | 구매 실행 → 서버 검증 (`/api/iap/verify`) |
| `restorePurchases(userId)` | 구매 복원 → 서버 검증 (`/api/iap/restore`) |
| `getCurrentSubscription(userId)` | 현재 구독 상태 조회 (`/api/iap/subscription`) |
| `manageSubscriptions()` | 네이티브 구독 관리 페이지 열기 |

### 구매 플로우

```
사용자 → purchaseProduct() → NativePurchases.purchaseProduct()
  → 네이티브 결제 UI 표시
  → 결제 완료
  → receipt/purchaseToken 획득
  → /api/iap/verify로 서버 검증
  → event_purchases 기록 + user_plans 업데이트
```

### 플랫폼별 영수증 처리

| | iOS | Android |
|--|-----|---------|
| **영수증** | `receipt` 또는 `jwsRepresentation` | `purchaseToken` |
| **검증 API** | Apple verifyReceipt API | Google Play Developer API v3 |
| **서버 함수** | `verifyAppleReceipt()` | `verifyGoogleReceipt()` |

### 웹 환경

웹에서는 `@capgo/native-purchases`를 사용할 수 없으므로 Mock 데이터를 반환합니다:
- `getProducts()` → Mock 상품 목록 (가격 포함)
- `purchaseProduct()` → `{ success: false, error: '모바일 앱에서만 구매할 수 있습니다.' }`

## 9. 참고 자료

- [@capgo/native-purchases](https://github.com/Cap-go/native-purchases) - Capacitor IAP 플러그인
- [Apple StoreKit 2](https://developer.apple.com/storekit/)
- [Google Play Billing](https://developer.android.com/google/play/billing)
- [App Store Server API](https://developer.apple.com/documentation/appstoreserverapi)
- [Google Play Developer API](https://developers.google.com/android-publisher)
