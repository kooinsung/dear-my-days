# 푸시 알림 설정 가이드

## 개요

이 가이드는 Capacitor 앱의 푸시 알림 설정 방법을 설명합니다. 예약된 이벤트 리마인더를 포함합니다.

## 아키텍처

**2부 시스템:**
1. **인프라 (Phase 5-1):** 토큰 등록, 권한 처리, 기본 전송 API
2. **스케줄링 (Phase 5-2):** 이벤트 날짜와 사용자 설정 기반 자동 알림

## Part 1: 푸시 알림 인프라

### 1.1 Firebase 설정

#### Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)로 이동
2. 새 프로젝트 생성 또는 기존 프로젝트 사용
3. iOS 앱 추가:
   - iOS bundle ID: `com.dearmydays.app`
   - `GoogleService-Info.plist` 다운로드
4. Android 앱 추가:
   - Android package name: `com.dearmydays.app`
   - `google-services.json` 다운로드

#### Firebase Cloud Messaging 설정

**iOS (APNs):**
1. Project Settings → Cloud Messaging으로 이동
2. APNs 인증 키 업로드:
   - Apple Developer Console → Keys에서 APNs 키 생성
   - Firebase에 업로드
3. Team ID 입력

**Android (FCM):**
- Android 앱 추가 시 자동 설정
- FCM은 `google-services.json` 파일 사용

### 1.2 iOS 네이티브 설정

**iOS 프로젝트에 Firebase SDK 추가:**

1. `GoogleService-Info.plist`를 `ios/App/App/`에 배치

2. `ios/App/Podfile`에 추가:
```ruby
target 'App' do
  capacitor_pods

  # Add Firebase
  pod 'Firebase/Messaging'
end
```

3. 실행:
```bash
cd ios/App
pod install
```

4. `ios/App/App/AppDelegate.swift` 업데이트:
```swift
import UIKit
import Capacitor
import Firebase

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        // Initialize Firebase
        FirebaseApp.configure()

        // Request notification permissions
        UNUserNotificationCenter.current().delegate = self

        return true
    }

    // Handle remote notifications
    func application(_ application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
    }
}

extension AppDelegate: UNUserNotificationCenterDelegate {
    // Handle notification when app is in foreground
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([[.banner, .sound]])
    }
}
```

### 1.3 Android 네이티브 설정

**Android 프로젝트에 Firebase 추가:**

1. `google-services.json`을 `android/app/`에 배치

2. `android/build.gradle` 업데이트:
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

3. `android/app/build.gradle` 업데이트:
```gradle
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation 'com.google.firebase:firebase-messaging:23.1.0'
}
```

4. `android/app/src/main/java/.../FirebaseMessagingService.java` 생성:
```java
package com.dearmydays.app;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        // Token will be sent via Capacitor plugin
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        // Capacitor plugin handles notification display
    }
}
```

5. `AndroidManifest.xml` 업데이트:
```xml
<service
    android:name=".MyFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

### 1.4 환경 변수

`.env.local`에 추가:
```env
# Firebase (서버측 알림 발송용)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Firebase 자격 증명 가져오기:**
1. Firebase Console → Project Settings → Service Accounts
2. 새 비공개 키 생성
3. JSON 파일 다운로드
4. `project_id`, `client_email`, `private_key` 추출

### 1.5 푸시 알림 테스트

**토큰 등록 테스트:**
```bash
pnpm dev:ios
# 앱에 로그인
# 콘솔 로그에서 "Push token: ..." 확인
# device_tokens 테이블에 토큰이 저장되었는지 확인
```

**테스트 알림 전송:**
```bash
# Firebase Console → Cloud Messaging → 테스트 메시지 전송 사용
# 또는 API 사용:
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "title": "테스트 알림",
    "bodyText": "테스트입니다",
    "data": {"eventId": "event-uuid"}
  }'
```

## Part 2: 알림 스케줄링 시스템

### 2.1 데이터베이스 설정

Supabase SQL Editor에서 SQL 마이그레이션 실행:
```bash
# 파일: supabase/migrations/create_notification_system.sql
```

다음을 생성합니다:
- `notification_logs` 테이블
- `get_pending_notifications()` 함수
- 성능을 위한 인덱스
- RLS 정책

### 2.2 Edge Function 배포

**Edge Function 배포:**
```bash
# Supabase CLI 설치
brew install supabase/tap/supabase

# 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref your-project-ref

# 함수 배포
supabase functions deploy send-scheduled-notifications

# Secrets 설정
supabase secrets set FIREBASE_PROJECT_ID=your-project
supabase secrets set FIREBASE_CLIENT_EMAIL=xxx@xxx.iam.gserviceaccount.com
supabase secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxx\n-----END PRIVATE KEY-----\n"
```

### 2.3 Cron 작업 설정

**옵션 1: Supabase pg_cron (권장)**

Supabase SQL Editor에서 실행:
```sql
-- pg_cron 확장 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 매분마다 실행되도록 함수 예약
SELECT cron.schedule(
  'send-scheduled-notifications',
  '* * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-scheduled-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      )
    ) AS request_id;
  $$
);

-- 예약된 작업 보기
SELECT * FROM cron.job;

-- 예약 취소 (필요시)
-- SELECT cron.unschedule('send-scheduled-notifications');
```

**옵션 2: 외부 Cron (예: Vercel Cron, GitHub Actions)**

`vercel.json` 생성:
```json
{
  "crons": [{
    "path": "/api/cron/send-notifications",
    "schedule": "* * * * *"
  }]
}
```

`/api/cron/send-notifications/route.ts` 생성:
```typescript
export async function GET(req: NextRequest) {
  // Supabase Edge Function 호출
  const response = await fetch(
    'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-scheduled-notifications',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  )

  return Response.json(await response.json())
}
```

### 2.4 이벤트 알림 설정 구성

**사용자 플로우:**
1. 사용자가 이벤트 생성/편집
2. 사용자가 알림 설정 UI 확인
3. 사용자가 알림 받을 시기 선택 (D-7, D-3, D-1, 당일)
4. 사용자가 시간 설정 (시와 분)
5. 설정이 `event_notification_settings` 테이블에 저장

**예시:**
```typescript
// 이벤트: 2025-01-15 생일
// 설정:
[
  { days_before: 7, hour: 9, minute: 0 },  // 2025-01-08 09:00
  { days_before: 1, hour: 9, minute: 0 },  // 2025-01-14 09:00
  { days_before: 0, hour: 9, minute: 0 },  // 2025-01-15 09:00
]
```

### 2.5 예약된 알림 테스트

**PostgreSQL 함수 테스트:**
```sql
-- 현재 시간 시뮬레이션: 오전 9:00
SELECT * FROM get_pending_notifications(9, 0);

-- 오늘 9:00에 예약된 이벤트를 반환해야 함
```

**Edge Function 로컬 테스트:**
```bash
# 로컬 Supabase 시작
supabase start

# Edge Function 서빙
supabase functions serve send-scheduled-notifications --env-file .env.local

# 수동으로 트리거
curl -X POST http://localhost:54321/functions/v1/send-scheduled-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**프로덕션 테스트:**
1. 내일 현재 시간+1분에 알림 설정이 있는 이벤트 생성
2. Cron 작업이 실행될 때까지 대기
3. `notification_logs` 테이블 확인
4. 기기에서 푸시 수신 확인

## 문제 해결

### iOS: 푸시 토큰을 받지 못함
- APNs 키가 Firebase에 업로드되었는지 확인
- Bundle ID가 정확히 일치하는지 확인
- 기기가 인터넷에 연결되어 있는지 확인
- 앱 재시작 시도

### Android: 푸시 토큰을 받지 못함
- `google-services.json`이 올바른 위치에 있는지 확인
- 패키지 이름이 정확히 일치하는지 확인
- 기기에 Google Play Services가 설치되어 있는지 확인
- 앱 데이터 삭제 후 재설치 시도

### 알림이 전송되지 않음
- Edge Function 로그 확인: `supabase functions logs send-scheduled-notifications`
- Cron 작업이 실행 중인지 확인: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`
- `get_pending_notifications()`가 결과를 반환하는지 확인
- Firebase 자격 증명이 올바른지 확인

### 알림이 전송되었지만 수신되지 않음
- 기기에서 앱 알림이 활성화되어 있는지 확인
- FCM 토큰이 유효한지 확인 (만료되지 않음)
- Firebase Console → Cloud Messaging → 로그 확인
- Firebase Console에서 직접 전송 테스트

### 중복 알림
- `notification_logs` 테이블에 적절한 unique 제약 조건이 있는지 확인
- 동일한 알림이 여러 번 예약되지 않았는지 확인
- Cron 작업이 여러 번 실행되지 않는지 확인

## 프로덕션 체크리스트

- [ ] Firebase 프로젝트 생성 및 설정
- [ ] iOS APNs 키를 Firebase에 업로드
- [ ] Android `google-services.json` 추가
- [ ] 네이티브 코드에서 푸시 알림 플러그인 설정
- [ ] 데이터베이스 마이그레이션 실행 (notification_logs, functions)
- [ ] Edge Function 배포
- [ ] Supabase에 Firebase secrets 설정
- [ ] Cron 작업 예약 (pg_cron 또는 외부)
- [ ] 실제 기기에서 토큰 등록 테스트
- [ ] 예약된 알림 엔드투엔드 테스트
- [ ] 에러 로깅 및 모니터링 설정
- [ ] Rate limiting 고려 (스팸 방지)

## 참고 자료

- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [APNs 설정](https://developer.apple.com/documentation/usernotifications)
- [FCM 설정](https://firebase.google.com/docs/cloud-messaging/android/client)
