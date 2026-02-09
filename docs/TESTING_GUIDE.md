# Dear My Days - Capacitor 테스트 가이드

> Capacitor 기반 하이브리드 앱을 로컬 및 개발 환경에서 iOS/Android 테스트하는 단계별 가이드

**📱 Capacitor 명령어 가이드:** [CAPACITOR_COMMANDS.md](./CAPACITOR_COMMANDS.md)에서 모든 Capacitor CLI 명령어를 확인하세요.

## 목차

- [사전 준비](#사전-준비)
- [로컬 환경 설정](#로컬-환경-설정)
- [웹 개발 서버 테스트](#웹-개발-서버-테스트)
- [iOS 테스트](#ios-테스트)
- [Android 테스트](#android-테스트)
- [기능별 테스트 체크리스트](#기능별-테스트-체크리스트)
- [문제 해결](#문제-해결)

---

## 사전 준비

### 필수 도구 설치

#### 1. Node.js 22+ 및 pnpm

```bash
# nvm으로 Node.js 22 설치 (권장)
nvm install 22
nvm use 22

# 또는 Homebrew 사용
brew install node@22

# pnpm 설치
npm install -g pnpm

# 버전 확인
node --version   # v22.0.0 이상 (Capacitor 8 요구사항)
pnpm --version   # 9.0.0 이상
```

**중요**: Capacitor 8은 Node.js 22 이상을 요구합니다.

#### 2. iOS 개발 도구 (macOS 전용)

```bash
# Xcode 설치 (App Store에서)
# 최소 버전: Xcode 15.0 이상

# Command Line Tools 설치
xcode-select --install

# 버전 확인
xcodebuild -version
```

**CocoaPods 설치** (iOS 의존성 관리):
```bash
sudo gem install cocoapods

# 버전 확인
pod --version   # 1.15.0 이상
```

#### 3. Android 개발 도구

```bash
# Android Studio 다운로드 및 설치
# https://developer.android.com/studio

# 설치 후 SDK 설정
# Android Studio → Settings → Appearance & Behavior → System Settings → Android SDK

# 필수 SDK 구성요소:
# - Android SDK Platform 34 (Android 14)
# - Android SDK Build-Tools 34.0.0
# - Android SDK Command-line Tools
# - Android Emulator
```

**환경 변수 설정** (~/.zshrc 또는 ~/.bashrc):
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

# 적용
source ~/.zshrc
```

**검증:**
```bash
adb --version         # Android Debug Bridge
emulator -version     # Android Emulator
sdkmanager --version  # SDK Manager
```

---

## 로컬 환경 설정

### 1. 프로젝트 클론 및 의존성 설치

```bash
# 프로젝트 디렉토리로 이동
cd /Users/a17050/side-project/dear-my-days

# Node 22 사용 확인
nvm use 22

# 의존성 설치
pnpm install
```

### 2. 환경 변수 설정

`.env.local` 파일 생성:

```bash
# .env.example을 복사하여 시작
cp .env.example .env.local

# 환경 변수 편집
vi .env.local
```

**필수 환경 변수:**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Web URL (로컬 개발)
NEXT_PUBLIC_WEB_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Email (선택)
RESEND_API_KEY=xxx
RESEND_FROM_EMAIL=noreply@dear-my-days.com

# KASI (음력 변환)
KASI_SERVICE_KEY=xxx

# OAuth (선택)
NEXT_PUBLIC_NAVER_CLIENT_ID=xxx
NAVER_CLIENT_SECRET=xxx
```

### 3. Capacitor 프로젝트 생성 (최초 1회)

```bash
# iOS 프로젝트 생성
pnpm cap add ios

# Android 프로젝트 생성
pnpm cap add android

# 웹 빌드를 네이티브 프로젝트에 복사
pnpm cap sync
```

**결과:**
```
✔ Adding native iOS project in ios in 2.13s
✔ Adding native Android project in android in 1.52s
✔ Syncing files to ios
✔ Syncing files to android
```

---

## 웹 개발 서버 테스트

### 1. 개발 서버 실행

```bash
# Turbopack 사용 (빠른 HMR)
pnpm dev

# 또는 일반 모드
pnpm next dev
```

**결과:**
```
  ▲ Next.js 16.1.2
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 1.2s
```

### 2. 브라우저 테스트

브라우저에서 `http://localhost:3000` 접속:

**테스트 항목:**
- [ ] 로그인 페이지 로드 확인
- [ ] 이메일 로그인 기능
- [ ] OAuth 로그인 (Google/Kakao/Naver/Apple)
- [ ] 이벤트 CRUD 기능
- [ ] 캘린더 뷰
- [ ] 음력 변환 기능
- [ ] 설정 페이지
- [ ] 반응형 디자인 (모바일 뷰포트)

### 3. 프로덕션 빌드 테스트

```bash
# 프로덕션 빌드
pnpm build

# 빌드 확인
# ✓ Compiled successfully
# ✓ Linting and checking validity of types
# ✓ Collecting page data
# ✓ Generating static pages

# 프로덕션 서버 실행
pnpm start
```

---

## iOS 테스트

### 1. 시뮬레이터 테스트

#### Step 1: 웹 개발 서버 실행 (터미널 1)

```bash
# Next.js 개발 서버 시작
pnpm dev
```

**참고**: iOS 시뮬레이터는 `localhost:3000`에 직접 접근 가능합니다.

#### Step 2: Xcode에서 실행 (터미널 2)

```bash
# Xcode에서 iOS 프로젝트 열기
pnpm cap:ios

# 또는 직접 열기
open ios/App/App.xcworkspace
```

**Xcode에서:**
1. 상단 툴바에서 시뮬레이터 선택 (예: iPhone 15 Pro)
2. ▶️ 버튼 클릭 또는 `Cmd + R`
3. 시뮬레이터가 부팅되고 앱 실행
4. WebView가 `http://localhost:3000` 로드

#### Step 3: 라이브 리로드로 실행 (추천)

```bash
# 라이브 리로드 모드로 실행 (코드 변경 시 자동 새로고침)
pnpm dev:ios

# 특정 시뮬레이터 지정
pnpm cap run ios --target="iPhone 15 Pro"
```

**라이브 리로드 장점:**
- 웹 코드 변경 시 자동으로 앱 새로고침
- 네이티브 재빌드 불필요
- 빠른 개발 사이클

#### Step 4: 앱 동작 확인

시뮬레이터에서:
- [ ] WebView 정상 로드
- [ ] 로그인/로그아웃
- [ ] 이벤트 CRUD
- [ ] 네비게이션 (Safe Area 확인)
- [ ] Swipe Back 제스처
- [ ] 상태바 스타일
- [ ] 스플래시 화면

### 2. 실제 디바이스 테스트

#### 방법 1: Xcode를 통한 직접 설치 (빠른 테스트)

```bash
# 1. iPhone/iPad를 Mac에 연결 (USB)
# 2. Xcode에서 디바이스 선택
# 3. Signing & Capabilities 탭에서 Team 설정
#    (Apple Developer 계정 필요 - 무료 계정 가능)
# 4. ▶️ 버튼으로 실행
```

**무료 Apple Developer 계정 제한사항:**
- 앱 유효 기간: 7일
- 최대 3개 앱까지 설치 가능
- 매주 재설치 필요

#### 방법 2: TestFlight (베타 테스트)

```bash
# 1. Apple Developer Program 가입 필요 ($99/년)
# 2. App Store Connect에서 앱 등록
# 3. Archive 빌드 생성

# Xcode에서:
# Product → Archive
# Archive 완료 후 → Distribute App → TestFlight
```

**TestFlight 설정:**
1. [App Store Connect](https://appstoreconnect.apple.com) 접속
2. "My Apps" → 앱 선택 → "TestFlight" 탭
3. "Internal Testing" → 테스터 추가
4. 빌드가 처리되면 테스터에게 초대 발송
5. 테스터는 TestFlight 앱에서 앱 다운로드

---

## Android 테스트

### 1. 에뮬레이터 테스트

#### Step 1: AVD (Android Virtual Device) 생성

```bash
# Android Studio 실행
# Tools → Device Manager → Create Device

# 권장 설정:
# - Device: Pixel 5 또는 Pixel 8
# - System Image: Android 14 (API 34)
# - RAM: 2048 MB
# - Storage: 4096 MB
```

**또는 명령줄로:**
```bash
# 사용 가능한 시스템 이미지 확인
sdkmanager --list | grep system-images

# 시스템 이미지 다운로드
sdkmanager "system-images;android-34;google_apis;x86_64"

# AVD 생성
avdmanager create avd -n Pixel_8_API_34 \
  -k "system-images;android-34;google_apis;x86_64" \
  -d pixel_8

# 에뮬레이터 실행
emulator -avd Pixel_8_API_34
```

#### Step 2: 웹 개발 서버 실행 (터미널 1)

```bash
pnpm dev
```

**중요**: Android 에뮬레이터는 `localhost`를 에뮬레이터 자체로 인식합니다.

**해결 방법:**
- `capacitor.config.ts`가 자동으로 처리
- Android: `http://10.0.2.2:3000` (에뮬레이터 → 호스트 머신)
- iOS: `http://localhost:3000` (시뮬레이터는 localhost 사용 가능)

#### Step 3: Android Studio에서 실행 (터미널 2)

```bash
# Android Studio에서 프로젝트 열기
pnpm cap:android

# 또는 직접 열기
open -a "Android Studio" android/
```

**Android Studio에서:**
1. 상단 툴바에서 에뮬레이터 선택
2. ▶️ Run 버튼 클릭
3. 앱 빌드 및 설치
4. WebView가 `http://10.0.2.2:3000` 로드

#### Step 4: 라이브 리로드로 실행 (추천)

```bash
# 라이브 리로드 모드로 실행
pnpm dev:android

# 특정 에뮬레이터 지정
pnpm cap run android --target="emulator-5554"
```

#### Step 5: 앱 동작 확인

에뮬레이터에서:
- [ ] WebView 정상 로드
- [ ] 로그인/로그아웃
- [ ] 이벤트 CRUD
- [ ] 뒤로가기 버튼
- [ ] 키보드 동작
- [ ] 상태바 색상
- [ ] 스플래시 화면

### 2. 실제 디바이스 테스트

#### 방법 1: USB 디버깅 (빠른 테스트)

```bash
# 1. 디바이스 설정에서 개발자 옵션 활성화
#    설정 → 디바이스 정보 → 빌드 번호 7번 탭

# 2. USB 디버깅 활성화
#    설정 → 개발자 옵션 → USB 디버깅

# 3. USB로 디바이스 연결

# 4. 디바이스 확인
adb devices
# 결과:
# List of devices attached
# 1234567890ABCDEF    device

# 5. Android Studio에서 실행
# 연결된 디바이스 선택 → ▶️ Run
```

#### 방법 2: Internal Testing (Google Play)

```bash
# 1. Release APK 빌드
pnpm cap sync
cd android
./gradlew assembleRelease

# 2. APK 위치
# android/app/build/outputs/apk/release/app-release.apk
```

**Google Play Console 설정:**
1. [Google Play Console](https://play.google.com/console) 접속
2. 앱 생성 → "Testing" → "Internal testing"
3. "Create new release" 클릭
4. APK/AAB 업로드
5. 테스터 이메일 추가
6. 테스터에게 다운로드 링크 전송

---

## 기능별 테스트 체크리스트

### 인증 (Authentication)

#### 웹 브라우저
- [ ] 이메일 회원가입
- [ ] 이메일 로그인
- [ ] 이메일 인증
- [ ] 비밀번호 리셋
- [ ] Google OAuth 로그인
- [ ] Kakao OAuth 로그인
- [ ] Naver OAuth 로그인
- [ ] Apple OAuth 로그인

#### iOS 시뮬레이터/디바이스
- [ ] 이메일 로그인
- [ ] Google OAuth (Safari 열림)
- [ ] Kakao OAuth
- [ ] Naver OAuth
- [ ] Apple OAuth (실제 디바이스만)
- [ ] 딥링크 OAuth 콜백 처리

#### Android 에뮬레이터/디바이스
- [ ] 이메일 로그인
- [ ] Google OAuth (Chrome 열림)
- [ ] Kakao OAuth
- [ ] Naver OAuth
- [ ] 딥링크 OAuth 콜백 처리

### 이벤트 관리

#### 공통
- [ ] 이벤트 생성 (양력)
- [ ] 이벤트 생성 (음력, 평달)
- [ ] 이벤트 생성 (음력, 윤달)
- [ ] 이벤트 목록 조회
- [ ] 이벤트 상세 조회
- [ ] 이벤트 수정
- [ ] 이벤트 삭제
- [ ] 과거 이벤트 조회
- [ ] 캘린더 뷰 (월별)
- [ ] 음력 변환 정확도 확인

#### 알림 설정
- [ ] 알림 스케줄 추가
- [ ] 알림 스케줄 수정
- [ ] 알림 스케줄 삭제
- [ ] 여러 알림 설정
- [ ] 알림 권한 요청 (네이티브)

### Capacitor 네이티브 기능

#### 플랫폼 감지
- [ ] `isNative()` 정확도 (웹/앱 구분)
- [ ] `getPlatform()` 반환값 (ios/android/web)
- [ ] 플랫폼별 UI 조건 렌더링

#### 브라우저 API
- [ ] OAuth URL을 시스템 브라우저에서 열기
- [ ] 브라우저 닫힌 후 앱 복귀
- [ ] 딥링크로 OAuth 콜백 처리

#### 네비게이션
- [ ] `useNativeNavigation()` - 앱/웹 자동 처리
- [ ] 뒤로 가기 (Android 하드웨어 버튼)
- [ ] iOS Swipe Back 제스처

#### 상태바 & UI
- [ ] 상태바 색상 설정
- [ ] Safe Area 처리 (노치/다이나믹 아일랜드)
- [ ] 스플래시 화면 표시
- [ ] 키보드 resize 모드

#### 공유
- [ ] Share API (텍스트)
- [ ] Share API (URL)

#### 햅틱
- [ ] Haptics API (진동 피드백)

### 네트워크

#### API 통신
- [ ] Supabase API 호출
- [ ] KASI API 호출 (음력 변환)
- [ ] 네트워크 에러 핸들링
- [ ] 오프라인 모드 동작

#### WebView 로딩
- [ ] 초기 로딩 (localhost/IP)
- [ ] 로딩 인디케이터 표시
- [ ] 네트워크 에러 시 재시도
- [ ] 타임아웃 처리

---

## 문제 해결

### 공통 문제

#### 문제: Node.js 버전 에러
```
The Capacitor CLI requires NodeJS >=22.0.0
```

**해결:**
```bash
# Node 22 설치 및 전환
nvm install 22
nvm use 22

# 프로젝트 디렉토리에 .nvmrc 생성
echo "22" > .nvmrc

# 이후 자동 전환
nvm use
```

#### 문제: 환경 변수 에러
```
Error: Missing required environment variables
```

**해결:**
```bash
# .env.local 파일 확인
cat .env.local

# @t3-oss/env-nextjs가 자동 검증
# 필수 환경 변수 모두 설정 필요
```

#### 문제: Capacitor 동기화 실패
```
[error] Capacitor could not find the web assets directory
```

**해결:**
```bash
# Next.js 빌드 먼저 실행
pnpm build

# 그 다음 Capacitor 동기화
pnpm cap:sync
```

### iOS 문제

#### 문제: CocoaPods 설치 실패
```
[error] Unable to find a specification for some pods
```

**해결:**
```bash
# Pod 레포지토리 업데이트
cd ios/App
pod repo update

# Pod 재설치
pod install

# 캐시 제거 후 재설치
rm -rf Pods Podfile.lock
pod install
```

#### 문제: Signing 에러
```
Signing for "App" requires a development team
```

**해결:**
```bash
# Xcode에서:
# 1. Project Navigator → App 선택
# 2. Signing & Capabilities 탭
# 3. Team 선택 (Apple ID로 로그인 필요)
# 4. Automatically manage signing 체크
```

#### 문제: 시뮬레이터에서 WebView 로드 안 됨
```
Failed to load: localhost:3000
```

**해결:**
```bash
# 1. 개발 서버 실행 확인
lsof -i :3000

# 2. capacitor.config.ts 확인
# iOS는 localhost:3000 사용

# 3. 시뮬레이터 재시작
# Device → Erase All Content and Settings
```

### Android 문제

#### 문제: Gradle 빌드 실패
```
FAILURE: Build failed with an exception
```

**해결:**
```bash
# Gradle 캐시 클리어
cd android
./gradlew clean

# 전체 빌드 캐시 삭제
rm -rf .gradle app/build

# 재빌드
cd ..
pnpm cap:sync
```

#### 문제: 에뮬레이터에서 네트워크 연결 안 됨
```
Failed to load: http://localhost:3000
```

**해결:**
```bash
# capacitor.config.ts가 자동으로 10.0.2.2 사용
# Android 에뮬레이터는 10.0.2.2 = 호스트 머신

# 확인:
# 1. 개발 서버 실행 중인지 확인
# 2. 에뮬레이터가 네트워크 접근 가능한지 확인
# 3. capacitor.config.ts의 server.url 확인
```

#### 문제: USB 디바이스 인식 안 됨
```
adb devices
List of devices attached
```

**해결:**
```bash
# 1. USB 디버깅 활성화 확인
# 2. USB 케이블 재연결
# 3. adb 재시작
adb kill-server
adb start-server

# 4. 디바이스에서 "이 컴퓨터를 항상 신뢰" 허용
```

#### 문제: Android Emulator 실행 안 됨 (M1/M2 Mac)
```
ERROR: x86 emulation currently requires hardware acceleration
```

**해결:**
```bash
# ARM64 시스템 이미지 사용
sdkmanager "system-images;android-34;google_apis;arm64-v8a"

# ARM64 AVD 생성
avdmanager create avd -n Pixel_8_ARM \
  -k "system-images;android-34;google_apis;arm64-v8a" \
  -d pixel_8
```

### Capacitor 문제

#### 문제: 플러그인 에러
```
[error] Plugin not implemented on this platform
```

**해결:**
```bash
# 1. 플러그인이 설치되어 있는지 확인
pnpm list | grep @capacitor

# 2. 플러그인 재설치
pnpm add @capacitor/[plugin-name]

# 3. 동기화
pnpm cap:sync
```

#### 문제: 딥링크 동작 안 함
```
Deep link not opening the app
```

**해결:**
```bash
# iOS: Info.plist 확인
# ios/App/App/Info.plist
# CFBundleURLSchemes에 dearmydays 추가됨 확인

# Android: AndroidManifest.xml 확인
# android/app/src/main/AndroidManifest.xml
# intent-filter 확인
```

---

## 추가 리소스

### 공식 문서
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)

### 디버깅 도구

#### Chrome DevTools (Android)
```bash
# 1. Android 디바이스/에뮬레이터에서 앱 실행
# 2. Chrome에서 chrome://inspect 접속
# 3. WebView 선택 → "Inspect"
# 4. Console, Network, Elements 탭 사용 가능
```

#### Safari DevTools (iOS)
```bash
# 1. iPhone 설정 → Safari → 고급 → Web Inspector 활성화
# 2. Mac Safari → 개발 메뉴 활성화
#    Safari → 설정 → 고급 → "메뉴 막대에서 개발자용 메뉴 보기"
# 3. 개발 → [디바이스명] → [WebView] 선택
```

#### Xcode Console
```bash
# Xcode에서 앱 실행 중:
# View → Debug Area → Activate Console (Cmd + Shift + C)
# 네이티브 로그 및 크래시 확인
```

#### Android Logcat
```bash
# 실시간 로그 확인
adb logcat

# 앱 로그만 필터링
adb logcat | grep "Capacitor"

# 크래시 로그
adb logcat -b crash
```

### 성능 측정

#### Lighthouse (웹 성능)
```bash
# Chrome DevTools에서:
# 1. F12 → Lighthouse 탭
# 2. "Generate report" 클릭
# 3. Performance, Accessibility, Best Practices, SEO 점수 확인
```

#### React DevTools
```bash
# 브라우저 확장 프로그램 설치
# https://react.dev/learn/react-developer-tools

# 컴포넌트 렌더링 분석
# Profiler 탭에서 성능 측정
```

---

## 배포 체크리스트

### iOS App Store 배포 전

- [ ] Apple Developer Program 가입 ($99/년)
- [ ] App Store Connect에서 앱 등록
- [ ] 앱 아이콘 및 스크린샷 준비
- [ ] 개인정보 보호정책 URL 준비
- [ ] TestFlight 베타 테스트 완료
- [ ] 프로덕션 빌드 생성 및 제출
- [ ] App Store 심사 통과

### Google Play 배포 전

- [ ] Google Play Console 계정 생성 ($25 일회성)
- [ ] 앱 등록 및 콘텐츠 등급 받기
- [ ] 앱 아이콘 및 스크린샷 준비
- [ ] 개인정보 보호정책 URL 준비
- [ ] Internal Testing 완료
- [ ] Closed Testing (Alpha/Beta)
- [ ] Release APK/AAB 생성 및 제출
- [ ] Google Play 심사 통과

---

**마지막 업데이트:** 2026-02-09
**버전:** 3.0.0 (Capacitor 8)
**Node.js:** 22.22.0 이상
