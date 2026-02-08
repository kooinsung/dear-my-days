# Capacitor 명령어 가이드

> Dear My Days 프로젝트의 Capacitor 관련 스크립트 사용법

## 목차

- [개요](#개요)
- [스크립트 설명](#스크립트-설명)
  - [초기 설정](#-초기-설정)
  - [동기화](#-동기화)
  - [IDE 열기](#-ide-열기)
  - [앱 실행](#️-앱-실행)
  - [개발 모드](#-개발-모드-livereload)
- [일반적인 워크플로우](#일반적인-워크플로우)
- [문제 해결](#문제-해결)

---

## 개요

Dear My Days는 Next.js 웹앱을 Capacitor로 래핑하여 iOS/Android 네이티브 앱으로 제공합니다.
모든 Capacitor 관련 명령어는 `package.json`의 `scripts` 섹션에 정의되어 있습니다.

**핵심 개념:**
- 웹앱은 Vercel에 배포 (Server Actions/API Routes 유지)
- 네이티브 앱은 WebView에서 웹 URL 로드
- 개발 시: `localhost:3000` (iOS) 또는 `10.0.2.2:3000` (Android)
- 프로덕션: `https://dearmydays.com`

---

## 스크립트 설명

### 📦 초기 설정

#### `cap:init` - Capacitor 프로젝트 초기화

```bash
pnpm cap:init
```

**목적:**
- iOS/Android 네이티브 프로젝트 폴더 생성
- Capacitor 설정 파일 초기화

**실행 결과:**
- `ios/` 디렉토리 생성 (Xcode 프로젝트)
- `android/` 디렉토리 생성 (Android Studio 프로젝트)
- `capacitor.config.ts` 기본 설정 적용

**사용 시점:**
- ✅ 프로젝트 최초 1회만 실행
- ❌ 이미 생성되었다면 재실행 불필요

**주의사항:**
- 기존 네이티브 프로젝트가 있으면 덮어쓰기 전에 확인 필요

---

### 🔄 동기화

#### `cap:sync` - 웹 → 네이티브 동기화 (개발 환경)

```bash
pnpm cap:sync
```

**목적:**
- 웹 코드 변경사항을 iOS/Android 프로젝트에 반영
- `capacitor.config.ts` 설정 변경사항 적용
- 네이티브 플러그인 설치/업데이트

**실행 작업:**
1. `webDir` 폴더 복사 (웹 리소스)
2. 네이티브 플러그인 설치
3. 플랫폼별 설정 업데이트

**사용 시점:**
- ✅ Capacitor 플러그인 추가 후 (`pnpm add @capacitor/camera`)
- ✅ `capacitor.config.ts` 수정 후
- ✅ TypeScript 코드 변경 시 (선택적)
- ✅ 앱 실행 전 (권장)

**환경 설정:**
- `CAPACITOR_ENV`: 기본값 (개발 환경)
- `CAPACITOR_PLATFORM`: 기본값 (android)
- 개발 서버 URL: `http://10.0.2.2:3000` (Android) / `http://localhost:3000` (iOS)

---

#### `cap:sync:prod` - 웹 → 네이티브 동기화 (프로덕션 환경)

```bash
pnpm cap:sync:prod
```

**목적:**
- 프로덕션 URL(`https://dearmydays.com`)로 동기화
- 앱스토어 배포용 빌드 준비

**환경 설정:**
- `CAPACITOR_ENV=production`
- 프로덕션 서버 URL: `https://dearmydays.com`

**사용 시점:**
- ✅ App Store / Google Play 배포 전
- ✅ 프로덕션 환경 테스트 시

**주의사항:**
- 프로덕션 빌드 후에는 다시 `cap:sync`를 실행해서 개발 환경으로 되돌려야 함

---

### 🔧 IDE 열기

#### `cap:ios` - Xcode 열기

```bash
pnpm cap:ios
```

**목적:**
- iOS 프로젝트를 Xcode에서 열기

**사용 시점:**
- ✅ iOS 네이티브 코드 수정 필요 시
- ✅ 앱스토어 배포용 Archive 생성 시
- ✅ iOS 전용 설정 변경 시 (`Info.plist`, Signing 등)
- ✅ 앱 아이콘, Splash Screen 변경 시

**필수 조건:**
- Xcode 설치 필요 (App Store에서 설치)
- `ios/` 디렉토리 존재 (`cap:init` 실행 완료)

---

#### `cap:android` - Android Studio 열기

```bash
pnpm cap:android
```

**목적:**
- Android 프로젝트를 Android Studio에서 열기

**사용 시점:**
- ✅ Android 네이티브 코드 수정 필요 시
- ✅ Google Play 배포용 AAB 생성 시
- ✅ Android 전용 설정 변경 시 (`AndroidManifest.xml`, Gradle 등)
- ✅ 앱 아이콘, Splash Screen 변경 시

**필수 조건:**
- Android Studio 설치 필요
- Java JDK 설치 필요 (`brew install openjdk@17`)
- `android/` 디렉토리 존재 (`cap:init` 실행 완료)

---

### ▶️ 앱 실행

#### `cap:run:ios` - iOS 시뮬레이터 실행

```bash
pnpm cap:run:ios
```

**목적:**
- iOS 시뮬레이터에서 앱 실행

**동작 과정:**
1. 앱 빌드 (Swift/Objective-C 컴파일)
2. iOS 시뮬레이터 실행
3. WebView에서 `http://localhost:3000` 로드

**필수 조건:**
- ✅ Next.js 개발 서버 실행 중 (`pnpm dev`)
- ✅ Xcode 설치
- ✅ iOS 시뮬레이터 설정

**환경 변수:**
- `CAPACITOR_PLATFORM=ios` 자동 설정
- 개발 서버 URL: `http://localhost:3000`

**실행 예:**
```bash
# 터미널 1
pnpm dev

# 터미널 2
pnpm cap:run:ios
```

---

#### `cap:run:android` - Android 에뮬레이터 실행

```bash
pnpm cap:run:android
```

**목적:**
- Android 에뮬레이터에서 앱 실행

**동작 과정:**
1. 앱 빌드 (Gradle 빌드)
2. Android 에뮬레이터 실행
3. WebView에서 `http://10.0.2.2:3000` 로드

**필수 조건:**
- ✅ Next.js 개발 서버 실행 중 (`pnpm dev`)
- ✅ Android Studio 설치
- ✅ Android 에뮬레이터 생성 및 실행
- ✅ Java JDK 설치

**환경 변수:**
- `CAPACITOR_PLATFORM=android` 자동 설정
- 개발 서버 URL: `http://10.0.2.2:3000` (Android 에뮬레이터 전용 주소)

**실행 예:**
```bash
# 터미널 1
pnpm dev

# 터미널 2
pnpm cap:run:android
```

**주의사항:**
- Android 에뮬레이터에서는 `localhost`가 에뮬레이터 자체를 가리키므로 `10.0.2.2` 사용 필수

---

### 🔥 개발 모드 (LiveReload)

#### `dev:ios` - iOS LiveReload 개발 모드

```bash
pnpm dev:ios
```

**목적:**
- 코드 변경 시 자동 새로고침 (LiveReload)
- 빠른 개발 사이클 제공

**동작:**
- `--livereload`: 파일 변경 감지 → WebView 자동 새로고침
- `--external`: 외부 네트워크에서 접근 가능 (실제 디바이스 테스트)

**장점:**
- ✅ 웹 코드 수정 → 앱 자동 리로드 (재빌드 불필요)
- ✅ 네이티브 코드 변경 시에만 재빌드
- ✅ 개발 속도 대폭 향상

**필수 조건:**
- Next.js 개발 서버 실행 중 (`pnpm dev`)

**실행 예:**
```bash
# 터미널 1
pnpm dev

# 터미널 2
pnpm dev:ios
```

**차이점:**
| 명령어 | LiveReload | 재빌드 |
|--------|-----------|--------|
| `cap:run:ios` | ❌ | 매번 |
| `dev:ios` | ✅ | 최초만 |

---

#### `dev:android` - Android LiveReload 개발 모드

```bash
pnpm dev:android
```

**목적:**
- 코드 변경 시 자동 새로고침 (LiveReload)
- 빠른 개발 사이클 제공

**동작:**
- iOS와 동일 (플랫폼만 Android)

**장점:**
- iOS와 동일

**필수 조건:**
- Next.js 개발 서버 실행 중 (`pnpm dev`)
- Android 에뮬레이터 실행 중

**실행 예:**
```bash
# 터미널 1
pnpm dev

# 터미널 2
pnpm dev:android
```

---

## 일반적인 워크플로우

### 🆕 최초 설정 (1회만)

```bash
# 1. Capacitor 프로젝트 초기화
pnpm cap:init

# 2. 네이티브 프로젝트 동기화
pnpm cap:sync

# 3. 필요한 플러그인 확인
ls node_modules/@capacitor
```

**예상 소요 시간:** 5-10분

---

### 💻 일상 개발 (권장)

```bash
# 터미널 1: Next.js 개발 서버
pnpm dev

# 터미널 2: 앱 실행 (LiveReload 모드)
pnpm dev:android    # Android
# 또는
pnpm dev:ios        # iOS
```

**장점:**
- 웹 코드 변경 → 즉시 앱에 반영
- 재빌드 불필요
- 빠른 피드백 루프

---

### 🔌 플러그인 추가 후

```bash
# 1. 플러그인 설치 (예: 카메라)
pnpm add @capacitor/camera

# 2. 네이티브 프로젝트 동기화
pnpm cap:sync

# 3. 앱 재실행
pnpm cap:run:android
```

**주의:**
- 플러그인 추가 시 반드시 `cap:sync` 실행 필요

---

### ⚙️ 설정 변경 후

```bash
# capacitor.config.ts 수정 후

# 1. 동기화
pnpm cap:sync

# 2. 앱 재실행
pnpm cap:run:android
```

**변경 예:**
- 앱 이름, 앱 ID 변경
- 플러그인 설정 변경
- Splash Screen 설정 변경

---

### 📱 앱스토어 배포

#### iOS (App Store)

```bash
# 1. 프로덕션 동기화
pnpm cap:sync:prod

# 2. Xcode 열기
pnpm cap:ios

# 3. Xcode에서:
# - Product → Archive
# - Distribute to App Store Connect
# - TestFlight 또는 App Store 제출
```

#### Android (Google Play)

```bash
# 1. 프로덕션 동기화
pnpm cap:sync:prod

# 2. Android Studio 열기
pnpm cap:android

# 3. Android Studio에서:
# - Build → Generate Signed Bundle / APK
# - Release 빌드 선택
# - Google Play Console에 업로드
```

**주의:**
- 배포 후 개발 환경으로 복구: `pnpm cap:sync`

---

### 🧪 테스트

#### 로컬 테스트

```bash
# iOS 시뮬레이터
pnpm dev:ios

# Android 에뮬레이터
pnpm dev:android
```

#### 실제 디바이스 테스트

```bash
# 1. 디바이스 연결 (USB)
# 2. 앱 실행
pnpm cap:run:ios      # iOS
pnpm cap:run:android  # Android

# 3. 또는 Xcode/Android Studio에서 직접 실행
pnpm cap:ios
pnpm cap:android
```

**실제 디바이스 필수 기능:**
- 푸시 알림 테스트
- 인앱결제 테스트
- 카메라, 위치 등 하드웨어 기능

---

## 문제 해결

### "webpage not available" 에러

**원인:**
- Next.js 개발 서버가 실행되지 않음

**해결:**
```bash
# 터미널 1에서 Next.js 서버 실행
pnpm dev

# 터미널 2에서 앱 재실행
pnpm cap:run:android
```

---

### "Unable to locate a Java Runtime" 에러

**원인:**
- Java JDK가 설치되지 않음

**해결:**
```bash
# Java JDK 설치
brew install openjdk@17

# 환경 변수 설정 (~/.zshrc에 추가)
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH=$JAVA_HOME/bin:$PATH

# 터미널 재시작 후 확인
java -version
```

---

### Android에서 localhost 접속 안 됨

**원인:**
- Android 에뮬레이터에서는 `localhost`가 에뮬레이터 자체를 가리킴

**해결:**
- `10.0.2.2` 사용 (호스트 머신의 localhost)
- `capacitor.config.ts`에서 자동으로 설정됨

---

### iOS 시뮬레이터가 실행되지 않음

**원인:**
- Xcode 설치 안 됨 또는 Command Line Tools 미설치

**해결:**
```bash
# Xcode Command Line Tools 설치
xcode-select --install

# Xcode 실행 후 시뮬레이터 확인
open -a Simulator
```

---

### 플러그인이 인식되지 않음

**원인:**
- `cap:sync` 실행 안 함

**해결:**
```bash
# 동기화 실행
pnpm cap:sync

# 앱 재실행
pnpm cap:run:android
```

---

### 변경사항이 반영되지 않음

**원인:**
- 캐시 문제 또는 빌드 문제

**해결:**
```bash
# 1. 클린 빌드
pnpm cap:sync

# 2. 앱 재실행
pnpm cap:run:android

# 3. 여전히 안 되면 네이티브 프로젝트 클린
# iOS: Xcode → Product → Clean Build Folder
# Android: Android Studio → Build → Clean Project
```

---

## 환경 변수

### CAPACITOR_ENV

개발/프로덕션 환경 구분

**값:**
- (기본값): 개발 환경
- `production`: 프로덕션 환경

**사용 예:**
```bash
# 프로덕션 동기화
CAPACITOR_ENV=production pnpm cap:sync
```

---

### CAPACITOR_PLATFORM

iOS/Android 플랫폼 구분

**값:**
- `ios`: iOS 시뮬레이터 (localhost:3000)
- `android`: Android 에뮬레이터 (10.0.2.2:3000)

**사용 예:**
```bash
# iOS 실행
CAPACITOR_PLATFORM=ios pnpm cap:run:ios

# Android 실행 (기본값)
CAPACITOR_PLATFORM=android pnpm cap:run:android
```

**자동 설정:**
- `package.json` 스크립트에서 자동으로 설정됨
- 수동으로 설정할 필요 없음

---

## 참고 자료

- [Capacitor 공식 문서](https://capacitorjs.com/docs)
- [Capacitor CLI 문서](https://capacitorjs.com/docs/cli)
- [iOS 개발 가이드](./TESTING_GUIDE.md)
- [Android 개발 가이드](./TESTING_GUIDE.md)
- [배포 체크리스트](./DEPLOYMENT_CHECKLIST.md)

---

**마지막 업데이트:** 2026-02-08
