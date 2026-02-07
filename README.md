# Dear My Days 🗓️

> 한국 음력 달력을 지원하는 기념일 관리 모바일 앱

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor-6-blue)](https://capacitorjs.com/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)

Dear My Days는 생일, 기념일, 기일 등의 특별한 날을 관리하는 크로스 플랫폼 모바일 애플리케이션입니다. 한국 음력 달력을 완벽하게 지원하며, iOS와 Android에서 동일한 사용자 경험을 제공합니다.

## ✨ 주요 기능

- 🎂 **이벤트 관리**: 생일, 기념일, 기일, 공휴일, 기타 이벤트 CRUD
- 🌙 **음력 지원**: KASI API를 활용한 양력↔음력 변환, 윤달 처리
- 📅 **달력 뷰**: 월별 이벤트 캘린더, 과거 이벤트 조회
- 🔐 **다중 인증**: 이메일, Google, Kakao, Naver, Apple OAuth
- 🔔 **푸시 알림**: 이벤트 리마인더 (D-7, D-3, D-1, D-Day)
- 💳 **구독 관리**: 프리미엄 기능 (IAP 지원)
- ⚙️ **설정**: 계정 관리, 데이터 내보내기

## 🏗️ 기술 스택

### Frontend
- **Framework**: Next.js 16 (App Router, React 19, Turbopack)
- **Language**: TypeScript (strict mode)
- **Styling**: Panda CSS (제로 런타임)
- **State**: Zustand + TanStack Query v5
- **Validation**: Zod
- **Mobile**: Capacitor 6

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Email**: Resend
- **APIs**: KASI (음력), Firebase (Push), OAuth (Naver/Kakao/Google/Apple)

### DevOps
- **Hosting**: Vercel (Web)
- **Linting**: Biome
- **Environment**: @t3-oss/env-nextjs
- **CI/CD**: GitHub Actions + Husky

## 📦 Installation

### Prerequisites

- **Node.js**: 18.x or higher
- **pnpm**: 9.x or higher
- **Xcode**: 15+ (for iOS development)
- **Android Studio**: Latest (for Android development)
- **CocoaPods**: Latest (for iOS dependencies)

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/dear-my-days.git
cd dear-my-days

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Generate Panda CSS
pnpm panda codegen

# Run development server
pnpm dev
```

## 🚀 Development

### Web Development

```bash
# Start Next.js dev server
pnpm dev

# Open browser
open http://localhost:3000

# Lint code
pnpm biome check .

# Format code
pnpm biome check --write .
```

### Mobile Development

```bash
# Add native platforms (first time only)
npx cap add ios
npx cap add android

# Sync code to native projects
npx cap sync

# Run on iOS
pnpm dev:ios

# Run on Android
pnpm dev:android

# Open in native IDEs
pnpm cap:ios      # Opens Xcode
pnpm cap:android  # Opens Android Studio
```

## 📱 Building for Production

### Web (Vercel)

```bash
# Build production bundle
pnpm build

# Preview production build
pnpm start

# Deploy to Vercel
vercel --prod
```

### iOS (App Store)

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select **Product → Archive**
3. Distribute to App Store Connect
4. Submit for review

### Android (Google Play)

```bash
# Build release bundle
cd android
./gradlew bundleRelease

# Upload to Google Play Console
# android/app/build/outputs/bundle/release/app-release.aab
```

## 📚 Documentation

- [프로젝트 가이드](./CLAUDE.md) - 아키텍처, 컨벤션, 가이드라인
- [OAuth 설정](./docs/OAUTH_SETUP.md) - OAuth 및 딥링크 설정
- [IAP 설정](./docs/IAP_SETUP.md) - 인앱결제 구현 가이드
- [푸시 알림 설정](./docs/PUSH_NOTIFICATIONS_SETUP.md) - Firebase 푸시 알림
- [배포 체크리스트](./docs/DEPLOYMENT_CHECKLIST.md) - 전체 배포 가이드
- [Supabase 리다이렉트 URL](./docs/SUPABASE_REDIRECT_URLS.md) - 빠른 참조

## 🗂️ Project Structure

```
dear-my-days/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                # Authentication
│   │   ├── events/              # Event CRUD
│   │   ├── iap/                 # In-App Purchases
│   │   ├── lunar/               # Lunar calendar
│   │   └── notifications/       # Push notifications
│   ├── auth/                    # Auth pages
│   ├── calendar/                # Calendar view
│   ├── event/                   # Event pages
│   ├── login/                   # Login page
│   ├── settings/                # Settings pages
│   │   └── subscription/        # Subscription management
│   ├── components/              # React components
│   │   └── ui/                  # UI components
│   ├── libs/                    # Libraries & utilities
│   │   ├── capacitor/           # Capacitor utilities
│   │   ├── config/              # Environment config
│   │   ├── supabase/            # Supabase clients
│   │   └── utils/               # Helper functions
│   └── stores/                  # Zustand stores
├── ios/                         # iOS native project
├── android/                     # Android native project
├── supabase/                    # Supabase config
│   ├── functions/               # Edge Functions
│   └── migrations/              # Database migrations
├── docs/                        # Documentation
├── public/                      # Static assets
│   └── .well-known/            # Universal Links
├── capacitor.config.ts          # Capacitor config
└── next.config.ts               # Next.js config
```

## 🔐 Environment Variables

### Required

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

### Optional

```env
# OAuth
NEXT_PUBLIC_NAVER_CLIENT_ID=xxx
NAVER_CLIENT_SECRET=xxx

# IAP (if implementing)
APPLE_SHARED_SECRET=xxx
GOOGLE_PACKAGE_NAME=com.dearmydays.app
GOOGLE_SERVICE_ACCOUNT_TOKEN=xxx

# Push Notifications (if implementing)
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY=xxx
```

See [DEPLOYMENT_CHECKLIST.md](./docs/DEPLOYMENT_CHECKLIST.md) for complete setup.

## 🧪 Testing

```bash
# Run linter
pnpm biome check .

# Format code
pnpm biome format --write .

# Type check
pnpm build

# Test on iOS Simulator
pnpm dev:ios

# Test on Android Emulator
pnpm dev:android
```

## 🔧 Troubleshooting

### "Cannot find module '@/...'"
```bash
# Regenerate TypeScript paths
pnpm build
```

### "Missing required environment variables"
```bash
# Check .env.local has all required variables
# See .env.example for reference
```

### Capacitor sync fails
```bash
# Clean and reinstall
rm -rf node_modules
rm -rf ios android
pnpm install
npx cap add ios
npx cap add android
npx cap sync
```

### Panda CSS types missing
```bash
# Regenerate Panda CSS
pnpm panda codegen
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

```
feat: 새로운 기능
fix: 버그 수정
refactor: 코드 리팩토링
style: 코드 포맷팅
docs: 문서 수정
test: 테스트 코드
chore: 빌드 설정
```

## 📄 License

This project is proprietary and confidential.

## 👥 Authors

- **Developer**: @a17050
- **Co-Author**: Claude Sonnet 4.5

## 📞 Support

- **Issues**: GitHub Issues
- **Documentation**: [Project Wiki](./docs/)

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Vercel](https://vercel.com) - Web hosting
- [Capacitor](https://capacitorjs.com) - Mobile framework
- [Next.js](https://nextjs.org) - React framework
- [KASI](https://www.kasi.re.kr) - Lunar calendar data

---

Made with ❤️ in Korea 🇰🇷
