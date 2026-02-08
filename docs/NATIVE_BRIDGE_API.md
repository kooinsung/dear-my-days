# Native Bridge API 레퍼런스

> 웹앱과 React Native 네이티브 앱 간의 통신 API

## 개요

Dear My Days는 **단일 코드베이스**를 유지하기 위해 웹앱이 네이티브 기능을 호출할 수 있는 브릿지 시스템을 제공합니다.

**아키텍처:**
```
웹앱 (Next.js)
    ↓
NativeBridge API
    ↓
window.ReactNativeWebView.postMessage()
    ↓
React Native (App.tsx)
    ↓
네이티브 모듈 (iOS/Android)
```

---

## 목차

1. [설치](#설치)
2. [기본 사용법](#기본-사용법)
3. [API 레퍼런스](#api-레퍼런스)
4. [메시지 타입](#메시지-타입)
5. [React 훅](#react-훅)
6. [사용 예시](#사용-예시)

---

## 설치

Native Bridge는 웹앱에 내장되어 있으며 별도 설치가 필요 없습니다.

**import 경로:**
```typescript
import { NativeBridge } from '@/libs/native-bridge'
import { useIsNativeApp, useNativeMessage, usePlatformInfo } from '@/libs/native-bridge/hooks'
```

---

## 기본 사용법

### 1. 네이티브 앱 감지

```typescript
'use client'

import { useIsNativeApp } from '@/libs/native-bridge/hooks'

export default function MyComponent() {
  const isNative = useIsNativeApp()

  return (
    <div>
      {isNative ? (
        <button onClick={() => NativeBridge.openWebView('/settings')}>
          설정 열기
        </button>
      ) : (
        <a href="/settings">설정</a>
      )}
    </div>
  )
}
```

### 2. 네이티브 기능 호출

```typescript
import { NativeBridge } from '@/libs/native-bridge'

// WebView 스택에 새 페이지 열기
NativeBridge.openWebView('/event/edit/123', '이벤트 수정')

// 외부 URL 열기 (브라우저, 전화, 이메일)
NativeBridge.openExternalUrl('tel:010-1234-5678')
NativeBridge.openExternalUrl('mailto:support@example.com')
```

### 3. 네이티브 → 웹 메시지 수신

```typescript
import { useNativeMessage } from '@/libs/native-bridge/hooks'

export default function MyComponent() {
  useNativeMessage((message) => {
    if (message.type === 'PLATFORM_INFO_RESPONSE') {
      console.log('Platform:', message.platform) // 'ios' | 'android'
    }
  })

  return <div>...</div>
}
```

---

## API 레퍼런스

### `NativeBridge` 객체

#### `NativeBridge.isNative(): boolean`

네이티브 앱에서 실행 중인지 확인합니다.

```typescript
if (NativeBridge.isNative()) {
  // 네이티브 앱 전용 로직
}
```

**반환값:**
- `true`: React Native 앱에서 실행 중
- `false`: 웹 브라우저에서 실행 중

---

#### `NativeBridge.openWebView(url: string, title?: string): boolean`

새로운 WebView를 스택에 추가합니다.

```typescript
NativeBridge.openWebView('/event/edit/123', '이벤트 수정')
NativeBridge.openWebView('https://example.com') // 외부 URL도 가능
```

**파라미터:**
- `url`: 열 URL (절대 경로 또는 상대 경로)
- `title`: (선택) WebView 제목

**반환값:**
- `true`: 메시지 전송 성공
- `false`: 웹 브라우저에서 실행 중 (무시됨)

**동작:**
- iOS/Android 모두 전체 화면 WebView가 위로 쌓입니다
- 뒤로가기 버튼 또는 `closeWebView()`로 닫을 수 있습니다
- Android 하드웨어 백 버튼도 자동으로 처리됩니다

---

#### `NativeBridge.closeWebView(): boolean`

최상단 WebView를 닫습니다.

```typescript
NativeBridge.closeWebView()
```

**반환값:**
- `true`: 메시지 전송 성공
- `false`: 웹 브라우저에서 실행 중 (무시됨)

---

#### `NativeBridge.clearWebViewStack(): boolean`

모든 WebView 스택을 비웁니다.

```typescript
NativeBridge.clearWebViewStack()
```

**사용 예시:**
- 로그아웃 후 모든 스택 초기화
- 에러 발생 시 스택 리셋

---

#### `NativeBridge.getPlatformInfo(): boolean`

플랫폼 정보를 요청합니다. 응답은 `window.message` 이벤트로 수신됩니다.

```typescript
NativeBridge.getPlatformInfo()

// 응답 수신
useNativeMessage((message) => {
  if (message.type === 'PLATFORM_INFO_RESPONSE') {
    console.log(message.platform) // 'ios' | 'android'
  }
})
```

**더 쉬운 방법:** `usePlatformInfo()` 훅 사용

---

#### `NativeBridge.openExternalUrl(url: string): boolean`

외부 URL을 기본 브라우저 또는 앱에서 엽니다.

```typescript
// 전화 걸기
NativeBridge.openExternalUrl('tel:010-1234-5678')

// 이메일 보내기
NativeBridge.openExternalUrl('mailto:support@example.com')

// 외부 웹사이트
NativeBridge.openExternalUrl('https://www.google.com')
```

**지원하는 URL Scheme:**
- `http://`, `https://` - 브라우저
- `tel:` - 전화 앱
- `mailto:` - 메일 앱
- `sms:` - 문자 앱

---

#### `NativeBridge.registerPushToken(userId: string): boolean`

푸시 알림 토큰을 등록합니다. (Phase 3에서 구현 예정)

```typescript
NativeBridge.registerPushToken(userId)
```

---

#### `NativeBridge.requestIAPProducts(): boolean`

인앱결제 상품 목록을 요청합니다. (Phase 4에서 구현 예정)

```typescript
NativeBridge.requestIAPProducts()
```

---

#### `NativeBridge.purchaseProduct(productId: string): boolean`

인앱결제를 실행합니다. (Phase 4에서 구현 예정)

```typescript
NativeBridge.purchaseProduct('premium_monthly')
```

---

## 메시지 타입

### 웹 → 네이티브 메시지

```typescript
type WebToNativeMessage =
  | { type: 'OPEN_WEBVIEW'; url: string; title?: string }
  | { type: 'CLOSE_WEBVIEW' }
  | { type: 'CLEAR_WEBVIEW_STACK' }
  | { type: 'PLATFORM_INFO' }
  | { type: 'OPEN_EXTERNAL_URL'; url: string }
  | { type: 'REGISTER_PUSH_TOKEN'; userId: string }
  | { type: 'REQUEST_IAP_PRODUCTS' }
  | { type: 'PURCHASE_PRODUCT'; productId: string }
  | { type: 'RESTORE_PURCHASES' }
```

### 네이티브 → 웹 메시지

```typescript
type NativeToWebMessage =
  | { type: 'PLATFORM_INFO_RESPONSE'; platform: 'ios' | 'android'; isNative: true }
  | { type: 'PUSH_TOKEN_REGISTERED'; token: string }
  | { type: 'IAP_PRODUCTS_RESPONSE'; products: unknown[] }
  | { type: 'PURCHASE_SUCCESS'; receipt: string; productId: string }
  | { type: 'PURCHASE_ERROR'; error: string }
```

---

## React 훅

### `useIsNativeApp()`

네이티브 앱 여부를 반환하는 훅입니다.

```typescript
import { useIsNativeApp } from '@/libs/native-bridge/hooks'

export default function MyComponent() {
  const isNative = useIsNativeApp()

  return <div>{isNative ? 'Native App' : 'Web Browser'}</div>
}
```

**반환값:** `boolean`

---

### `useNativeMessage(callback)`

네이티브로부터 메시지를 수신하는 훅입니다.

```typescript
import { useNativeMessage } from '@/libs/native-bridge/hooks'
import type { NativeToWebMessage } from '@/libs/native-bridge/types'

export default function MyComponent() {
  useNativeMessage((message: NativeToWebMessage) => {
    switch (message.type) {
      case 'PLATFORM_INFO_RESPONSE':
        console.log('Platform:', message.platform)
        break
      case 'PUSH_TOKEN_REGISTERED':
        console.log('Push token:', message.token)
        break
      // ...
    }
  })

  return <div>...</div>
}
```

**파라미터:**
- `callback`: 메시지를 받을 때 호출될 함수

---

### `usePlatformInfo()`

현재 플랫폼을 반환하는 훅입니다.

```typescript
import { usePlatformInfo } from '@/libs/native-bridge/hooks'

export default function MyComponent() {
  const platform = usePlatformInfo() // 'ios' | 'android' | 'web'

  return (
    <div>
      {platform === 'ios' && <div>iOS 전용 UI</div>}
      {platform === 'android' && <div>Android 전용 UI</div>}
      {platform === 'web' && <div>웹 전용 UI</div>}
    </div>
  )
}
```

**반환값:** `'ios' | 'android' | 'web'`

---

## 사용 예시

### 1. 이벤트 편집 페이지 열기

```typescript
// app/event/detail/[id]/page.tsx
'use client'

import { NativeBridge, useIsNativeApp } from '@/libs/native-bridge'
import { useRouter } from 'next/navigation'

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const isNative = useIsNativeApp()
  const router = useRouter()

  const handleEdit = () => {
    const editUrl = `/event/edit/${params.id}`

    if (isNative) {
      // 네이티브: 새 WebView 스택에 열기
      NativeBridge.openWebView(editUrl, '이벤트 수정')
    } else {
      // 웹: Next.js 라우터 사용
      router.push(editUrl)
    }
  }

  return <button onClick={handleEdit}>수정</button>
}
```

### 2. 외부 링크 처리

```typescript
// app/settings/account/page.tsx
'use client'

import { NativeBridge, useIsNativeApp } from '@/libs/native-bridge'

export default function AccountSettingsPage() {
  const isNative = useIsNativeApp()

  const handleContactSupport = () => {
    const email = 'support@dearmydays.com'
    const subject = '문의사항'

    if (isNative) {
      NativeBridge.openExternalUrl(`mailto:${email}?subject=${subject}`)
    } else {
      window.location.href = `mailto:${email}?subject=${subject}`
    }
  }

  return <button onClick={handleContactSupport}>문의하기</button>
}
```

### 3. OAuth 로그인 후 푸시 알림 등록

```typescript
// app/login/login-form.tsx
'use client'

import { NativeBridge, useNativeMessage, useIsNativeApp } from '@/libs/native-bridge'

export default function LoginForm() {
  const isNative = useIsNativeApp()

  useNativeMessage((message) => {
    if (message.type === 'PUSH_TOKEN_REGISTERED') {
      // 백엔드에 토큰 저장
      fetch('/api/notifications/register-token', {
        method: 'POST',
        body: JSON.stringify({ token: message.token, platform: 'fcm' }),
      })
    }
  })

  const handleLoginSuccess = async (userId: string) => {
    // 로그인 성공 후
    if (isNative) {
      NativeBridge.registerPushToken(userId)
    }
  }

  return <form>...</form>
}
```

### 4. 플랫폼별 UI 렌더링

```typescript
// app/settings/settings-home-client.tsx
'use client'

import { usePlatformInfo } from '@/libs/native-bridge/hooks'

export default function SettingsHomeClient() {
  const platform = usePlatformInfo()

  return (
    <div>
      {platform === 'ios' && (
        <div className="ios-only">
          <p>iOS 전용 설정</p>
        </div>
      )}

      {platform === 'android' && (
        <div className="android-only">
          <p>Android 전용 설정</p>
        </div>
      )}

      {platform === 'web' && (
        <div className="web-only">
          <p>PWA로 설치하시겠습니까?</p>
        </div>
      )}
    </div>
  )
}
```

---

## 주의 사항

### 1. Client Component만 사용 가능

Native Bridge는 `window` 객체를 사용하므로 **클라이언트 컴포넌트에서만** 사용 가능합니다.

```typescript
'use client' // ← 필수!

import { NativeBridge } from '@/libs/native-bridge'
```

### 2. 웹 브라우저 대응

네이티브 기능을 호출할 때는 항상 웹 브라우저 대응을 고려해야 합니다.

```typescript
const isNative = useIsNativeApp()

if (isNative) {
  NativeBridge.openWebView('/settings')
} else {
  router.push('/settings') // 웹 대응
}
```

### 3. 타입 안전성

모든 메시지는 TypeScript로 타입이 정의되어 있습니다. IDE 자동완성을 활용하세요.

```typescript
import type { NativeToWebMessage } from '@/libs/native-bridge/types'

useNativeMessage((message: NativeToWebMessage) => {
  // message.type 자동완성 가능
})
```

---

## 디버깅

### 1. 브라우저 콘솔

네이티브 앱이 아닐 때는 경고 로그가 출력됩니다:

```
[NativeBridge] Not in native app, message ignored: OPEN_WEBVIEW
```

### 2. React Native 로그

```bash
# iOS
npx react-native log-ios

# Android
npx react-native log-android
```

### 3. WebView 인스펙터

**iOS:**
- Safari → 개발자용 메뉴 → 시뮬레이터/디바이스 선택

**Android:**
- Chrome → `chrome://inspect` → WebView 선택

---

## 참고 자료

- [소스 코드: /app/libs/native-bridge](../app/libs/native-bridge)
- [React Native WebView](https://github.com/react-native-webview/react-native-webview)
- [React Native Linking](https://reactnative.dev/docs/linking)

---

**마지막 업데이트:** 2026-02-08
