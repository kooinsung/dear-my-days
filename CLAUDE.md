# Dear Days - 프로젝트 가이드

> 한국 음력 달력을 지원하는 기념일 관리 웹 애플리케이션

## 프로젝트 개요

Dear Days는 생일, 기념일, 기일 등의 특별한 날을 관리하는 웹 애플리케이션입니다.
한국 음력 달력을 완벽하게 지원하며, 윤달 처리 등 복잡한 음력 변환 로직을 포함합니다.

### 핵심 기능
- 🎂 **이벤트 관리**: 생일, 기념일, 기일, 공휴일, 기타 이벤트 CRUD
- 🌙 **음력 지원**: KASI API를 활용한 양력↔음력 변환, 윤달 처리
- 📅 **달력 뷰**: 월별 이벤트 캘린더, 과거 이벤트 조회
- 🔐 **다중 인증**: 이메일, Google, Kakao, Naver OAuth
- ⚙️ **설정**: 계정 관리, 데이터 내보내기, 알림 설정

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
- **Linting**: Biome (빠른 린터/포맷터)

### 백엔드
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email, OAuth)
- **Email**: Resend (트랜잭션 이메일)
- **External APIs**:
  - KASI (한국천문연구원) - 음력 변환
  - Naver/Kakao/Google OAuth

### 배포
- **Hosting**: Vercel
- **Environment**: `.env` (환경 변수는 `app/libs/config/env.ts`에서 검증)

---

## 프로젝트 구조

```
app/
├── api/                      # API 라우트 (Route Handlers)
│   ├── auth/                # 인증 관련 API
│   ├── events/              # 이벤트 CRUD API
│   ├── lunar/               # 음력 변환 API
│   └── provider/            # OAuth 제공자 연결/해제
├── auth/                    # 인증 페이지 (로그인, 회원가입, 이메일 인증, 비밀번호 리셋)
├── calendar/                # 캘린더 뷰 페이지
├── event/                   # 이벤트 상세/편집 페이지
│   ├── detail/
│   ├── edit/
│   └── past/
├── login/                   # 로그인 페이지
├── settings/                # 설정 페이지
├── components/              # 재사용 가능한 컴포넌트
│   └── ui/                  # UI 컴포넌트 라이브러리
├── libs/                    # 유틸리티 및 라이브러리
│   ├── api/                 # API 헬퍼
│   ├── auth/                # 인증 유틸리티
│   ├── config/              # 환경 변수 검증
│   ├── constants/           # 상수 (카테고리, 메시지)
│   ├── kasi/                # KASI API 클라이언트
│   ├── naver/               # Naver OAuth 클라이언트
│   ├── resend/              # Resend 이메일 클라이언트
│   ├── supabase/            # Supabase 클라이언트
│   ├── utils/               # 공통 유틸리티
│   └── validation/          # Zod 스키마
├── stores/                  # Zustand 스토어
└── layout.tsx               # 루트 레이아웃 (환경 변수 검증 호출)

middleware.ts                # Next.js 미들웨어 (인증 체크)
proxy.ts                     # 인증 프록시
```

---

## 아키텍처 패턴 및 컨벤션

### 1. 환경 변수 관리

**CRITICAL**: 환경 변수는 앱 시작 시 `validateEnv()`로 검증됩니다.

```typescript
// app/libs/config/env.ts
export function validateEnv() { /* 모든 필수 환경 변수 검증 */ }
export const env = { /* 타입 안전한 환경 변수 */ }
```

**사용법**:
```typescript
// ❌ 절대 이렇게 하지 마세요
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

// ✅ 항상 검증된 env 사용
import { env } from '@/libs/config/env'
const url = env.NEXT_PUBLIC_SUPABASE_URL
```

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
    // 4. 통합 에러 처리
    return handleApiError(error)
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
2. **UI 계층**: React Error Boundary
3. **폼 검증**: Zod 스키마 + 클라이언트 측 검증

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

---

## 개발 가이드라인

### 코드 스타일

1. **타입 안전성**
   - 타입 단언 `as` 최소화 (Zod 검증 활용)
   - Non-null assertion `!` 사용 시 반드시 biome-ignore 주석 + 이유 명시

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

# OAuth
NEXT_PUBLIC_NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=                 # ⚠️ 서버 전용

# 기타
NEXT_PUBLIC_WEB_BASE_URL=
NEXT_PUBLIC_SITE_URL=
```

**검증**:
- `app/layout.tsx`에서 앱 시작 시 `validateEnv()` 호출
- 누락 시 즉시 에러로 앱 시작 차단

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
    return handleApiError(error)
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
```

---

## 참고 자료

- [Next.js 16 문서](https://nextjs.org/docs)
- [Supabase 문서](https://supabase.com/docs)
- [Panda CSS 문서](https://panda-css.com)
- [Zod 문서](https://zod.dev)
- [TanStack Query 문서](https://tanstack.com/query/latest)
- [Biome 문서](https://biomejs.dev)
- [KASI API 문서](https://www.kasi.re.kr)

---

## 프로젝트 상태

**최근 리팩토링 완료** (2026-02-06):
- ✅ 환경 변수 검증 시스템 구축
- ✅ Admin 클라이언트 서버 전용 보호
- ✅ Zod 입력 검증 전면 적용
- ✅ 통합 에러 처리 시스템
- ✅ 코드 중복 제거 (~250줄 감소)
- ✅ UI 컴포넌트 라이브러리 구축
- ✅ 에러 메시지 한글 통일
- ✅ Biome 린팅 100% 통과

**다음 단계 권장사항**:
1. EventForm 추가 리팩토링 (516줄 → ~150줄)
2. LoginForm 추가 리팩토링 (353줄 → ~100줄)
3. 유닛 테스트 추가 (Jest + React Testing Library)
4. E2E 테스트 추가 (Playwright)
5. 에러 모니터링 도구 통합 (Sentry)

---

**마지막 업데이트**: 2026-02-06
**메인테이너**: @a17050
