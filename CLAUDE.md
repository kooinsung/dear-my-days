# Dear My Days - 프로젝트 가이드

> 한국 음력 달력을 지원하는 크로스 플랫폼 기념일 관리 애플리케이션

## 프로젝트 개요

Dear My Days는 생일, 기념일, 기일 등의 특별한 날을 관리하는 **웹 및 모바일 애플리케이션**입니다.
Capacitor 기반 모바일 앱으로 웹과 동일한 기능을 제공하며, 한국 음력 달력을 완벽하게 지원합니다.

### 핵심 기능
- 🎂 **이벤트 관리**: 생일, 기념일, 기일, 공휴일, 기타 이벤트 CRUD
- 🌙 **음력 지원**: KASI API를 활용한 양력↔음력 변환, 윤달 처리
- 📅 **달력 뷰**: 월별 이벤트 캘린더, 과거 이벤트 조회
- 🔐 **다중 인증**: 이메일, Google, Kakao, Naver, Apple OAuth
- 🔔 **푸시 알림**: FCM 기반 이벤트 리마인더 (커스텀 시간 설정)
- 💳 **구독/IAP**: 프리미엄 구독 및 이벤트 슬롯 단건 구매
- 🚨 **에러 모니터링**: Sentry를 통한 실시간 에러 추적
- 📊 **운영 알림**: Slack Webhook을 통한 회원가입/에러 알림
- ⚙️ **설정**: 계정 관리, 데이터 내보내기

---

## 기술 스택

### 프론트엔드
- **Framework**: Next.js 16 (App Router, React 19, Turbopack)
- **Language**: TypeScript (strict mode)
- **Styling**: Panda CSS (CSS-in-JS, 제로 런타임)
- **State Management**:
  - Zustand (클라이언트 상태)
  - TanStack Query v5 (서버 상태, 캐싱)
- **Validation**: Zod (런타임 타입 검증)
- **Environment**: @t3-oss/env-nextjs (타입 안전한 환경 변수)
- **Linting**: Biome (빠른 린터/포맷터)
- **Mobile**: Capacitor (WebView 기반 하이브리드)

### 백엔드
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email, OAuth)
- **Email**: Resend (트랜잭션 이메일)
- **Push Notifications**: Firebase Cloud Messaging
- **Error Monitoring**: Sentry (`@sentry/nextjs`)
- **Slack**: Incoming Webhooks (회원가입 알림, 에러 알림)
- **External APIs**:
  - KASI (한국천문연구원) - 음력 변환
  - Naver/Kakao/Google/Apple OAuth

### 배포
- **Web Hosting**: Vercel
- **Edge Functions**: Supabase
- **Environment**: `.env` (@t3-oss/env-nextjs로 타입 안전하게 검증)

---

## 프로젝트 구조

```
프로젝트 루트/
├── app/                      # Next.js 앱
│   ├── api/                  # API 라우트 (Route Handlers)
│   │   ├── auth/            # 인증 관련 API (signup, reset-password, kakao-native)
│   │   ├── events/          # 이벤트 CRUD API
│   │   ├── iap/             # 인앱결제 검증 API (verify, subscription, restore)
│   │   ├── lunar/           # 음력 변환 API
│   │   ├── notifications/   # 푸시 알림 API (register-token, send 등)
│   │   ├── provider/        # OAuth 제공자 연결/해제
│   │   └── tracking/        # 회원가입 추적 API
│   ├── auth/                # 인증 페이지 (로그인, 회원가입, 이메일 인증, 비밀번호 리셋)
│   ├── calendar/            # 캘린더 뷰 페이지
│   ├── event/               # 이벤트 상세/편집 페이지
│   │   ├── detail/
│   │   ├── edit/
│   │   └── past/
│   ├── login/               # 로그인 페이지
│   ├── settings/            # 설정 페이지
│   │   ├── link/           # OAuth 제공자 연결 관리
│   │   └── subscription/   # 구독 관리
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   └── ui/             # UI 컴포넌트 라이브러리
│   ├── libs/                # 유틸리티 및 라이브러리
│   │   ├── api/            # API 헬퍼
│   │   ├── auth/           # 인증 유틸리티
│   │   ├── capacitor/      # Capacitor 네이티브 통합
│   │   ├── config/         # 환경 변수 검증
│   │   ├── constants/      # 상수 (카테고리, 메시지)
│   │   ├── fcm/            # Firebase Cloud Messaging 클라이언트
│   │   ├── helpers/        # 비즈니스 로직 헬퍼
│   │   ├── iap/            # 인앱결제 영수증 검증
│   │   ├── kasi/           # KASI API 클라이언트
│   │   ├── naver/          # Naver OAuth 클라이언트
│   │   ├── oauth/          # OAuth URL 헬퍼
│   │   ├── providers/      # OAuth 프로바이더 유틸리티
│   │   ├── resend/         # Resend 이메일 클라이언트
│   │   ├── slack/          # Slack Webhook 클라이언트 및 포매터
│   │   ├── supabase/       # Supabase 클라이언트
│   │   ├── transitions/    # 페이지 전환 유틸리티
│   │   ├── utils/          # 공통 유틸리티
│   │   └── validation/     # Zod 스키마
│   ├── hooks/              # React 커스텀 훅
│   ├── stores/             # Zustand 스토어
│   └── layout.tsx          # 루트 레이아웃
│
├── ios/                    # iOS Capacitor 프로젝트 (생성 후)
├── android/                # Android Capacitor 프로젝트 (생성 후)
│
├── supabase/               # Supabase 설정 및 마이그레이션
│   ├── functions/         # Edge Functions
│   │   ├── poll-app-reviews/           # 앱 리뷰 수집
│   │   └── send-scheduled-notifications/ # 예약 푸시 알림 발송
│   └── migrations/        # DB 마이그레이션 SQL 파일
│
├── docs/                   # 프로젝트 문서
│
├── sentry.client.config.ts # Sentry 클라이언트 설정
├── sentry.server.config.ts # Sentry 서버 설정
├── sentry.edge.config.ts   # Sentry Edge 설정
├── instrumentation.ts      # Next.js Instrumentation (Sentry 초기화)
├── middleware.ts           # Next.js 미들웨어 (인증 체크)
├── proxy.ts                # 인증 프록시
└── package.json            # 프로젝트 의존성 및 스크립트
```

### 주요 디렉토리 설명

**`app/`** - Next.js 앱 디렉토리
- Server Actions, API Routes, React 컴포넌트
- 웹 애플리케이션의 모든 프론트엔드 코드

**`supabase/`** - Supabase 백엔드
- `migrations/` - PostgreSQL 마이그레이션 스크립트
- `functions/` - Edge Functions (서버리스 함수)

---

## 아키텍처 패턴 및 컨벤션

### 1. 환경 변수 관리

**CRITICAL**: 환경 변수는 **@t3-oss/env-nextjs**로 관리되며, `env` 객체를 import하는 순간 자동으로 검증됩니다.

```typescript
// app/libs/config/env.ts
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    RESEND_FROM_EMAIL: z.string().email(),
    // ...
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    // ...
  },
  runtimeEnv: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    // ...
  },
})
```

**사용법**:
```typescript
// ❌ 절대 이렇게 하지 마세요
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

// ✅ 항상 검증된 env 사용 (타입 안전 + 자동완성)
import { env } from '@/libs/config/env'
const url = env.NEXT_PUBLIC_SUPABASE_URL  // string (URL 검증됨)
```

**주요 특징**:
- ✅ Zod 스키마 기반 런타임 검증 (URL, Email, min length 등)
- ✅ 타입 안전성 + 자동완성
- ✅ 클라이언트/서버 변수 명확한 분리
- ✅ import 시 자동 검증 (누락/잘못된 값 즉시 에러)

### 2. Supabase 클라이언트 패턴

**3가지 클라이언트 타입**:

```typescript
// 1. 브라우저 클라이언트 (클라이언트 컴포넌트)
import { createSupabaseBrowser } from '@/libs/supabase/browser'
const supabase = createSupabaseBrowser()

// 2. 서버 클라이언트 (서버 컴포넌트, API 라우트)
import { createSupabaseServer } from '@/libs/supabase/server'
const supabase = await createSupabaseServer()

// 3. Admin 클라이언트 (서버 전용, 관리자 권한)
import { supabaseAdmin } from '@/libs/supabase/admin'
const admin = supabaseAdmin()
```

**⚠️ Admin 클라이언트는 `server-only` 패키지로 보호됨** - 브라우저에서 import 시 빌드 에러

### 3. API 라우트 패턴

**모든 API 라우트는 동일한 패턴을 따릅니다**:

```typescript
import { handleApiError, successResponse } from '@/libs/utils/errors'
import { someSchema } from '@/libs/validation/schemas'

export async function POST(req: NextRequest) {
  try {
    // 1. 입력 검증 (Zod)
    const body = await req.json()
    const validated = someSchema.parse(body)

    // 2. 비즈니스 로직
    const result = await doSomething(validated)

    // 3. 성공 응답
    return successResponse(result)
  } catch (error) {
    // 4. 통합 에러 처리 (await 필수 — Sentry/Slack 전송 대기)
    return await handleApiError(error)
  }
}
```

**응답 형식**:
- 성공: `{ success: true, data: T }`
- 에러: `{ error: string }` (상태 코드: 400, 401, 500 등)

### 4. 달력 변환 로직

**음력↔양력 변환은 공통 유틸리티 사용**:

```typescript
import { convertCalendarDates } from '@/libs/utils/calendar-conversion'

const { finalSolar, finalLunar, finalIsLeapMonth } = await convertCalendarDates(
  'LUNAR',           // 'SOLAR' | 'LUNAR'
  undefined,         // solarDate (SOLAR일 때 필수)
  '2024-01-01',     // lunarDate (LUNAR일 때 필수)
  true              // isLeapMonth (선택)
)
```

**윤달 처리**:
- 사용자가 명시적으로 윤달 선택 시 우선 적용
- 미선택 시 KASI API가 반환한 윤달 우선
- 둘 다 없으면 첫 번째 후보 사용

### 5. 에러 처리

**계층별 에러 처리**:

1. **API 계층**: `handleApiError()` - Zod, AppError, 일반 에러 통합 처리
   - `async` 함수, `Promise<NextResponse>` 반환
   - 500 에러 시 자동으로 Sentry 캡처 + Slack 알림 전송
   - 사용법: `return await handleApiError(error)` (`await` 필수)
2. **UI 계층**: React Error Boundary + `global-error.tsx` (Sentry 연동)
3. **폼 검증**: Zod 스키마 + 클라이언트 측 검증

**Sentry + Slack 통합**:
- `@sentry/nextjs`로 클라이언트/서버/에지 런타임 에러 자동 캡처
- `handleApiError()` 내부에서 500 에러 발생 시:
  - `Sentry.captureException(error)` 호출
  - `sendSlackErrorNotification()` 호출 (Slack Webhook)

**에러 메시지**:
- 모든 에러 메시지는 한글로 통일
- `app/libs/constants/messages.ts`에 상수로 관리
- 사용자 친화적인 메시지 (기술 용어 지양)

### 6. 상태 관리 전략

**Zustand (클라이언트 상태)**:
```typescript
// app/stores/ui-store.ts
export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        toast: null,
        showToast: (message, type) => { /* ... */ },
        // ...
      }),
      { name: 'ui-store' }
    )
  )
)
```

**TanStack Query (서버 상태)**:
```typescript
// 이벤트 목록 조회
const { data: events } = useQuery({
  queryKey: ['events'],
  queryFn: fetchEvents,
})

// 이벤트 생성/수정/삭제 후 캐시 무효화
const { mutate } = useMutation({
  mutationFn: createEvent,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['events'] })
  },
})
```

### 7. 컴포넌트 패턴

**UI 컴포넌트** (`app/components/ui/`):
- Button, Input, FormField, Select 등
- Panda CSS 스타일 레시피 사용
- variant, size 등 props로 제어

**폼 컴포넌트**:
- Custom hooks로 상태 관리 분리 (useEventFormState, useEventFormSubmit)
- Presentational/Container 패턴 지향
- 516줄 → 150줄로 리팩토링 완료 (EventForm)

### 8. Capacitor 네이티브 통합

**아키텍처**:
```
웹앱 (Next.js) ↔ Capacitor APIs → 네이티브 플러그인 (iOS/Android)
```

**플랫폼 감지**:
```typescript
'use client'

import { useEffect, useState } from 'react'
import { isNative } from '@/libs/capacitor/platform'

export default function MyComponent() {
  const [isNativeApp, setIsNativeApp] = useState(false)

  useEffect(() => {
    const checkPlatform = async () => {
      setIsNativeApp(await isNative())
    }
    checkPlatform()
  }, [])

  return <div>{isNativeApp ? 'Mobile App' : 'Web Browser'}</div>
}
```

**OAuth 브라우저 열기**:
```typescript
import { Browser } from '@capacitor/browser'

// OAuth 인증 시 시스템 브라우저에서 열기
await Browser.open({ url: oauthUrl })
```

**네비게이션**:
```typescript
import { useNativeNavigation } from '@/libs/capacitor/use-native-navigation'

const { openPage, goBack } = useNativeNavigation()

// 페이지 열기 (웹/앱 모두 자동 처리)
openPage('/event/detail/123')

// 뒤로 가기 (웹/앱 모두 자동 처리)
goBack()
```

**사용 가능한 기능**:
- ✅ 플랫폼 감지 (`@capacitor/device`)
- ✅ 딥링크 (`@capacitor/app`)
- ✅ 브라우저 API (`@capacitor/browser`)
- ✅ 공유 기능 (`@capacitor/share`)
- ✅ 햅틱 피드백 (`@capacitor/haptics`)
- ✅ 상태바 제어 (`@capacitor/status-bar`)
- ✅ 스플래시 화면 (`@capacitor/splash-screen`)
- ✅ 푸시 알림 (`@capacitor/push-notifications`)
- ✅ 인앱결제 (서드파티 플러그인)

**자세한 문서**:
- Capacitor 명령어: [docs/CAPACITOR_COMMANDS.md](docs/CAPACITOR_COMMANDS.md)
- 푸시 알림 설정: [docs/PUSH_NOTIFICATIONS_SETUP.md](docs/PUSH_NOTIFICATIONS_SETUP.md)
- 인앱결제 설정: [docs/IAP_SETUP.md](docs/IAP_SETUP.md)

---

## 개발 가이드라인

### 코드 스타일

1. **타입 안전성**
   - 타입 단언 `as` 최소화 (Zod 검증 활용)
   - Non-null assertion `!` 사용 최소화 (@t3-oss/env-nextjs가 환경 변수 타입 보장)
   - `!` 필요 시 반드시 biome-ignore 주석 + 이유 명시

2. **함수/변수 명명**
   - 파일명: kebab-case (`lunar-to-solar.ts`)
   - 컴포넌트: PascalCase (`EventForm`)
   - 함수/변수: camelCase (`convertCalendarDates`)
   - 상수: SCREAMING_SNAKE_CASE (`CATEGORIES`)

3. **임포트 순서**
   - 외부 패키지
   - 내부 절대 경로 (`@/libs/...`)
   - 상대 경로 (`./...`)
   - 타입 임포트 분리 (`import type`)

4. **주석**
   - 코드로 설명 가능하면 주석 생략
   - 복잡한 비즈니스 로직만 주석 (why, not what)
   - JSDoc은 공개 API/유틸리티에만 사용

### Git 커밋 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
refactor: 코드 리팩토링
style: 코드 포맷팅, 세미콜론 누락 등
docs: 문서 수정
test: 테스트 코드
chore: 빌드 설정, 패키지 매니저 등
```

### 금지 사항 (NEVER)

1. **보안**
   - ❌ `.env` 파일 커밋
   - ❌ Admin 클라이언트를 클라이언트 코드에서 import
   - ❌ 환경 변수 폴백 값 (`|| ''`)
   - ❌ Supabase service role key를 브라우저에 노출

2. **코드 품질**
   - ❌ `console.log`를 프로덕션 코드에 남기기
   - ❌ 100줄 이상의 중복 코드
   - ❌ 검증 없는 사용자 입력 처리
   - ❌ Try-catch 없이 API 호출

3. **아키텍처**
   - ❌ API 라우트에서 직접 DB 스키마 변경
   - ❌ 클라이언트 컴포넌트에서 민감한 서버 로직 호출
   - ❌ 타입 단언으로 타입 에러 우회

---

## API 엔드포인트

### 인증 API

| 엔드포인트 | 메서드 | 설명 | 입력 |
|----------|--------|------|------|
| `/api/auth/signup` | POST | 이메일 회원가입 | `{ email, password }` |
| `/api/auth/reset-password` | POST | 비밀번호 리셋 요청 | `{ email }` |
| `/api/auth/reset-password/confirm` | POST | 비밀번호 리셋 확인 | `{ uid, token, password }` |
| `/api/auth/kakao-native` | POST | Kakao 네이티브 로그인 | `{ access_token }` |

### 이벤트 API

| 엔드포인트 | 메서드 | 설명 | 입력 |
|----------|--------|------|------|
| `/api/events/create` | POST | 이벤트 생성 | `CreateEventInput` |
| `/api/events/update` | POST | 이벤트 수정 | `UpdateEventInput` |

**CreateEventInput**:
```typescript
{
  title: string           // 1-100자
  category: CategoryType  // BIRTHDAY | ANNIVERSARY | MEMORIAL | HOLIDAY | OTHER
  calendar_type: 'SOLAR' | 'LUNAR'
  solar_date?: string     // YYYY-MM-DD (calendar_type=SOLAR일 때 필수)
  lunar_date?: string     // YYYY-MM-DD (calendar_type=LUNAR일 때 필수)
  is_leap_month?: boolean // 윤달 여부 (선택)
  note?: string | null    // 최대 500자
}
```

### 음력 변환 API

| 엔드포인트 | 메서드 | 설명 | 쿼리 파라미터 |
|----------|--------|------|-------------|
| `/api/lunar/lunar-to-solar` | GET | 음력→양력 | `year, month, day` |
| `/api/lunar/solar-to-lunar` | GET | 양력→음력 | `year, month, day` |
| `/api/lunar/lunar-special` | GET | 음력 특수일 조회 | `year, month, day` |

**예시**:
```
GET /api/lunar/lunar-to-solar?year=2024&month=1&day=1
→ { success: true, data: { candidates: [...] } }
```

### OAuth 제공자 API

| 엔드포인트 | 메서드 | 설명 |
|----------|--------|------|
| `/api/provider/connect` | POST | OAuth 제공자 연결 |
| `/api/provider/disconnect` | POST | OAuth 제공자 해제 |

### 푸시 알림 API

| 엔드포인트 | 메서드 | 설명 |
|----------|--------|------|
| `/api/notifications/register-token` | POST | 디바이스 토큰 등록 |
| `/api/notifications/unregister-token` | POST | 디바이스 토큰 해제 |
| `/api/notifications/send` | POST | 알림 발송 |
| `/api/notifications/test-send` | POST | 테스트 알림 발송 |

### IAP API

| 엔드포인트 | 메서드 | 설명 |
|----------|--------|------|
| `/api/iap/verify` | POST | 영수증 검증 |
| `/api/iap/subscription` | GET/POST | 구독 상태 조회/관리 |
| `/api/iap/restore` | POST | 구매 복원 |

### 트래킹 API

| 엔드포인트 | 메서드 | 설명 |
|----------|--------|------|
| `/api/tracking/check-new-signup` | POST | 신규 회원가입 확인 (Slack 알림) |

---

## 보안 고려사항

### 1. 환경 변수 보호

**필수 환경 변수**:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=           # ⚠️ 서버 전용

# 이메일
RESEND_API_KEY=                      # ⚠️ 서버 전용
RESEND_FROM_EMAIL=

# KASI (음력 변환)
KASI_SERVICE_KEY=                    # ⚠️ 서버 전용

# 기타
NEXT_PUBLIC_WEB_BASE_URL=
```

**선택 환경 변수**:
```env
# OAuth
NEXT_PUBLIC_NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=                 # ⚠️ 서버 전용

# Google OAuth (네이티브 로그인용)
NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID=

# Slack Webhook
SLACK_WEBHOOK_URL=                   # ⚠️ 서버 전용 (회원가입 알림)
SLACK_WEBHOOK_URL_ERRORS=            # ⚠️ 서버 전용 (에러 알림)

# Sentry
NEXT_PUBLIC_SENTRY_DSN=

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=                 # ⚠️ 서버 전용
FIREBASE_CLIENT_EMAIL=               # ⚠️ 서버 전용
FIREBASE_PRIVATE_KEY=                # ⚠️ 서버 전용

# IAP (In-App Purchases)
APPLE_SHARED_SECRET=                 # ⚠️ 서버 전용
GOOGLE_PACKAGE_NAME=                 # ⚠️ 서버 전용
GOOGLE_SERVICE_ACCOUNT_TOKEN=        # ⚠️ 서버 전용
```

**검증**:
- @t3-oss/env-nextjs가 `env` import 시 자동으로 검증
- 누락되거나 잘못된 환경 변수가 있으면 즉시 에러 발생
- Zod 스키마로 타입 검증 (URL, Email 등)

### 2. 인증 플로우

**보호된 라우트**:
- `middleware.ts` + `proxy.ts`에서 인증 체크
- 미인증 시 `/login?redirect={path}` 리다이렉트

**Public 경로**:
```typescript
// app/libs/auth/route-policy.ts
const publicPaths = [
  '/login',
  '/auth/callback',
  '/auth/reset-password',
  '/auth/verify-email',
  '/test',
]
```

### 3. 데이터 검증

**모든 API 입력은 Zod 검증 필수**:

```typescript
// app/libs/validation/schemas.ts
export const createEventSchema = z.object({
  title: z.string().min(1).max(100),
  // ...
}).refine(/* 커스텀 검증 */)
```

**XSS/Injection 방어**:
- Supabase RLS (Row Level Security) 활성화
- 모든 사용자 입력은 Parameterized Query 사용
- HTML은 렌더링 전 sanitize (필요시)

---

## 일반적인 작업들

### 새로운 API 라우트 추가

1. **스키마 정의** (`app/libs/validation/schemas.ts`):
```typescript
export const newFeatureSchema = z.object({
  field: z.string(),
})
```

2. **API 라우트 생성** (`app/api/new-feature/route.ts`):
```typescript
import { handleApiError, successResponse } from '@/libs/utils/errors'
import { newFeatureSchema } from '@/libs/validation/schemas'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = newFeatureSchema.parse(body)

    // 비즈니스 로직
    const result = await doSomething(validated)

    return successResponse(result)
  } catch (error) {
    return await handleApiError(error)
  }
}
```

### 새로운 UI 컴포넌트 추가

1. **컴포넌트 생성** (`app/components/ui/NewComponent.tsx`):
```typescript
import { css } from '@/styled-system/css'

type NewComponentProps = {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
}

export function NewComponent({ variant = 'primary', children }: NewComponentProps) {
  return (
    <div className={css({ /* Panda CSS */ })}>
      {children}
    </div>
  )
}
```

2. **사용**:
```typescript
import { NewComponent } from '@/components/ui/NewComponent'

<NewComponent variant="primary">내용</NewComponent>
```

### 카테고리 추가/수정

**`app/libs/constants/categories.ts` 수정**:
```typescript
export const CATEGORIES = [
  { value: 'BIRTHDAY', label: '생일', icon: '🎂' },
  { value: 'NEW_CATEGORY', label: '새 카테고리', icon: '🎉' },
  // ...
] as const
```

**타입 업데이트** (`app/libs/supabase/database.types.ts`):
```typescript
export type CategoryType = 'BIRTHDAY' | 'ANNIVERSARY' | 'MEMORIAL' | 'HOLIDAY' | 'NEW_CATEGORY' | 'OTHER'
```

### 음력 변환 커스터마이징

**KASI API 응답 처리** (`app/libs/utils/calendar-conversion.ts`):
```typescript
export async function convertCalendarDates(...) {
  // 윤달 선택 로직 커스터마이징
  const preferred =
    typeof isLeapMonth === 'boolean'
      ? candidates.find((c) => c.isLeapMonth === isLeapMonth)
      : candidates.find((c) => c.isLeapMonth)

  const picked = preferred ?? candidates[0]
  // ...
}
```

---

## 문제 해결

### 빌드 에러

**1. "Missing required environment variables"**
```bash
# .env 파일에 모든 필수 환경 변수 추가
cp .env.example .env
# 값 채우기
```

**2. "Cannot find module '@/...'"**
```bash
# tsconfig.json의 paths 확인
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./app/*"]
    }
  }
}
```

**3. Panda CSS 타입 에러**
```bash
# Panda CSS 재생성
pnpm panda codegen
```

### 런타임 에러

**1. Supabase 인증 실패**
- Supabase 프로젝트 설정에서 OAuth 제공자 설정 확인
- Redirect URL 화이트리스트 확인

**2. KASI API 에러**
- API 키 유효성 확인
- 요청 파라미터 범위 확인 (year: 1000-3000, month: 1-12, day: 1-31)

**3. Vercel 배포 실패**
- 환경 변수가 Vercel 프로젝트 설정에 추가되었는지 확인
- Build Command: `next build`
- Output Directory: `.next`

### 개발 환경

**로컬 개발 서버**:
```bash
pnpm dev      # localhost:3000
```

**빌드 테스트**:
```bash
pnpm build
pnpm start
```

**린트 체크**:
```bash
pnpm biome check .
pnpm biome check --write .  # 자동 수정
```

---

## 유용한 명령어

```bash
# 개발
pnpm dev              # 개발 서버 시작
pnpm build            # 프로덕션 빌드
pnpm start            # 프로덕션 서버 시작

# 코드 품질
pnpm biome check .                    # 린트 체크
pnpm biome check --write .            # 린트 자동 수정
pnpm biome check --write --unsafe .   # Unsafe 수정 포함

# Panda CSS
pnpm panda codegen    # CSS 재생성

# 패키지 관리
pnpm add <package>         # 패키지 추가
pnpm add -D <package>      # 개발 의존성 추가
pnpm remove <package>      # 패키지 제거

# Capacitor (모바일 앱)
pnpm cap:sync              # 웹 변경사항을 네이티브 프로젝트에 동기화
pnpm cap:sync:prod         # 프로덕션 환경으로 동기화
pnpm cap:ios               # Xcode에서 iOS 프로젝트 열기
pnpm cap:android           # Android Studio에서 Android 프로젝트 열기
pnpm cap:run:ios           # iOS 시뮬레이터 실행
pnpm cap:run:android       # Android 에뮬레이터 실행
pnpm dev:ios               # iOS 라이브 리로드 개발
pnpm dev:android           # Android 라이브 리로드 개발

# 📖 Capacitor 가이드: docs/CAPACITOR_COMMANDS.md
```

---

## 참고 자료

### 웹 개발
- [Next.js 16 문서](https://nextjs.org/docs)
- [Supabase 문서](https://supabase.com/docs)
- [Panda CSS 문서](https://panda-css.com)
- [Zod 문서](https://zod.dev)
- [@t3-oss/env-nextjs 문서](https://env.t3.gg/)
- [TanStack Query 문서](https://tanstack.com/query/latest)
- [Biome 문서](https://biomejs.dev)
- [KASI API 문서](https://www.kasi.re.kr)

### 모바일 개발
- [Capacitor 문서](https://capacitorjs.com/docs)
- [Capacitor iOS 가이드](https://capacitorjs.com/docs/ios)
- [Capacitor Android 가이드](https://capacitorjs.com/docs/android)
- [Capacitor 플러그인](https://capacitorjs.com/docs/plugins)
- [Capacitor CLI](https://capacitorjs.com/docs/cli)

---

## 프로젝트 상태

**최근 작업** (2026-02-28):
- ✅ Sentry 에러 모니터링 통합 (`@sentry/nextjs`)
- ✅ Slack Webhook 알림 (회원가입, 서버 에러)
- ✅ 푸시 알림 구현 (FCM + Capacitor Push Notifications)
- ✅ 인앱결제 구현 (Apple IAP + Google Play Billing)
- ✅ 알림 설정 minutes_before 컬럼 마이그레이션
- ✅ Kakao 네이티브 로그인 API
- ✅ 회원가입 추적 및 Slack 알림

**이전 작업** (2026-02-06 ~ 2026-02-09):
- ✅ Capacitor 기반 크로스 플랫폼 앱 구축
- ✅ 환경 변수 검증 시스템 구축 (@t3-oss/env-nextjs)
- ✅ Zod 입력 검증 전면 적용
- ✅ 통합 에러 처리 시스템
- ✅ UI 컴포넌트 라이브러리 구축
- ✅ Biome 린팅 100% 통과

**다음 단계 권장사항**:
1. 유닛 테스트 추가 (Vitest + React Testing Library)
2. Universal Links (iOS) / App Links (Android) 설정
3. 앱 스토어 배포 (iOS App Store, Google Play)

---

**마지막 업데이트**: 2026-02-28
**메인테이너**: @a17050
**Co-Author**: Claude Opus 4.6
