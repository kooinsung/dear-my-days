This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Authentication**: Supabase Auth (Email, Google, Kakao, Naver)
- **Database**: Supabase (PostgreSQL)
- **Styling**: (To be added)
- **Linting**: Biome 2.3.11
- **Package Manager**: pnpm

## Features

- 🔐 Multi OAuth Authentication (Email, Google, Kakao, Naver)
- 📅 Event Management (Birthdays, Anniversaries, etc.)
- 🌙 Solar & Lunar Calendar Support
- 🔔 Push Notification System
- 💳 Payment Integration
- 📊 User Plans (FREE, PREMIUM, ENTERPRISE)

## Database Schema

데이터베이스 스키마는 `supabase/migrations` 디렉토리에 정의되어 있습니다.

주요 테이블:
- `events`: 이벤트 (생일, 기념일 등)
- `user_providers`: OAuth 프로바이더 연결
- `notification_jobs`: 알림 작업
- `notification_rules`: 알림 규칙
- `user_plans`: 사용자 플랜
- `device_tokens`: 푸시 알림 토큰
- `event_purchases`: 구매 내역

자세한 내용은 [supabase/README.md](./supabase/README.md)를 참조하세요.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Supabase 계정

### Environment Variables

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Web
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WEB_BASE_URL=http://localhost:3000

# Resend (Custom SMTP 대체)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL="Dear Days <no-reply@your-domain>"

# Naver OAuth
NEXT_PUBLIC_NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
```

> 이메일 회원가입을 사용할 경우, 인증 메일은 Supabase 기본 메일이 아니라 Resend로 발송됩니다.
> 가입 후 메일의 링크(`/auth/verify-email?uid=...&token=...`)를 클릭하면 Supabase 계정이 이메일 인증 처리됩니다.

### Installation

```bash
# Install dependencies
pnpm install

# Run database migrations (if using Supabase CLI)
supabase db push

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run Biome linter
pnpm format       # Format code with Biome
pnpm check        # Run Biome check (lint + format)
pnpm type-check   # Run TypeScript type check
```

## Project Structure

```
dear-days/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   └── provider/         # Provider management APIs
│   ├── auth/                 # Auth callbacks
│   ├── libs/                 # Shared libraries
│   │   ├── auth/             # Auth utilities
│   │   ├── naver/            # Naver OAuth
│   │   └── supabase/         # Supabase clients
│   ├── login/                # Login page
│   └── provider/             # Provider management page
├── supabase/                 # Supabase configuration
│   ├── migrations/           # Database migrations
│   └── README.md             # Database documentation
└── .github/
    └── workflows/
        └── ci.yaml           # CI/CD pipeline
```

## CI/CD

GitHub Actions를 통해 자동화된 CI/CD 파이프라인이 구성되어 있습니다:

- **Lint & Build**: Biome 린팅 및 Next.js 빌드
- **Type Check**: TypeScript 타입 체크 (캐싱 최적화)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Supabase Documentation](https://supabase.com/docs) - learn about Supabase.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
