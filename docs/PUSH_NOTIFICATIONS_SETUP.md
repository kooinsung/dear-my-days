# 푸시 알림 설정 가이드

## 개요

이 가이드는 Capacitor 앱에서 예약 이벤트 리마인더를 포함한 푸시 알림 설정 방법을 설명합니다.

## 아키텍처

**2단계 시스템:**
1. **인프라 (Phase 5-1):** 토큰 등록, 권한 처리, 기본 발송 API
2. **스케줄링 (Phase 5-2):** 이벤트 날짜 및 사용자 설정 기반 자동 알림

## Part 1: 푸시 알림 인프라

### 1.1 Firebase 설정

#### Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 사용
3. iOS 앱 추가:
   - iOS 번들 ID: `com.dearmydays.app`
   - `GoogleService-Info.plist` 다운로드
4. Android 앱 추가:
   - Android 패키지 이름: `com.dearmydays.app`
   - `google-services.json` 다운로드

#### Firebase Cloud Messaging 설정

**iOS (APNs):**
1. 프로젝트 설정 → Cloud Messaging 이동
2. APNs 인증 키 업로드:
   - Apple Developer Console → Keys → APNs 키 생성
   - Firebase에 업로드
3. Team ID 입력

**Android (FCM):**
- Android 앱 추가 시 자동 설정
- FCM은 `google-services.json` 파일을 사용

### 1.2 iOS 네이티브 설정

**Firebase SDK를 iOS 프로젝트에 추가:**

1. `GoogleService-Info.plist`를 `ios/App/App/`에 배치

2. `ios/App/Podfile`에 추가:
```ruby
target 'App' do
  capacitor_pods

  # Firebase 추가
  pod 'Firebase/Messaging'
end
```

3. 실행:
```bash
cd ios/App
pod install
```

4. `ios/App/App/AppDelegate.swift` 수정:
```swift
import UIKit
import Capacitor
import Firebase

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        // Firebase 초기화
        FirebaseApp.configure()

        // 알림 권한 요청
        UNUserNotificationCenter.current().delegate = self

        return true
    }

    // 원격 알림 처리
    func application(_ application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
    }
}

extension AppDelegate: UNUserNotificationCenterDelegate {
    // 앱이 포그라운드일 때 알림 처리
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([[.banner, .sound]])
    }
}
```

### 1.3 Android 네이티브 설정

**Firebase를 Android 프로젝트에 추가:**

1. `google-services.json`을 `android/app/`에 배치

2. `android/build.gradle` 수정:
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

3. `android/app/build.gradle` 수정:
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
        // Capacitor 플러그인을 통해 토큰 전송
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        // Capacitor 플러그인이 알림 표시 처리
    }
}
```

5. `AndroidManifest.xml` 수정:
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
# Firebase (서버 측 알림 발송용)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Firebase 자격증명 가져오기:**
1. Firebase Console → 프로젝트 설정 → 서비스 계정
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

**테스트 알림 발송:**
```bash
# Firebase Console → Cloud Messaging → 테스트 메시지 보내기
# 또는 API 사용:
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "title": "테스트 알림",
    "bodyText": "이것은 테스트입니다",
    "data": {"eventId": "event-uuid"}
  }'
```

## Part 2: 알림 스케줄링 시스템

### 2.1 데이터베이스 설정

Supabase SQL 편집기에서 마이그레이션 실행:
```bash
# 파일: supabase/migrations/create_notification_system.sql
```

생성 항목:
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

# 시크릿 설정
supabase secrets set FIREBASE_PROJECT_ID=your-project
supabase secrets set FIREBASE_CLIENT_EMAIL=xxx@xxx.iam.gserviceaccount.com
supabase secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxx\n-----END PRIVATE KEY-----\n"
```

### 2.3 Cron 작업 설정

**방법 1: Supabase pg_cron (권장)**

Supabase SQL 편집기에서 실행:
```sql
-- pg_cron 확장 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 매분 실행되도록 스케줄 등록
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

-- 등록된 작업 확인
SELECT * FROM cron.job;

-- 스케줄 해제 (필요 시)
-- SELECT cron.unschedule('send-scheduled-notifications');
```

**방법 2: 외부 Cron (예: Vercel Cron, GitHub Actions)**

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

### 2.4 이벤트 알림 설정

**사용자 플로우:**
1. 사용자가 이벤트 생성/수정
2. 알림 설정 UI 표시
3. 리마인더 시점 선택 (D-7, D-3, D-1, D-Day)
4. 알림 시간 설정 (시, 분)
5. `event_notification_settings` 테이블에 저장

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

### 2.5 예약 알림 테스트

**PostgreSQL 함수 테스트:**
```sql
-- 현재 시간 시뮬레이션: 오전 9시
SELECT * FROM get_pending_notifications(9, 0);

-- 오늘 9시에 예정된 이벤트가 반환되어야 함
```

**Edge Function 로컬 테스트:**
```bash
# 로컬 Supabase 시작
supabase start

# Edge Function 실행
supabase functions serve send-scheduled-notifications --env-file .env.local

# 수동 트리거
curl -X POST http://localhost:54321/functions/v1/send-scheduled-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**프로덕션 테스트:**
1. 알림 설정이 있는 이벤트 생성 (내일 현재 시간+1분)
2. Cron 작업 실행 대기
3. `notification_logs` 테이블 확인
4. 디바이스에서 푸시 수신 확인

## 문제 해결

### iOS: 푸시 토큰이 수신되지 않음
- APNs 키가 Firebase에 업로드되었는지 확인
- 번들 ID가 정확히 일치하는지 확인
- 디바이스가 인터넷에 연결되어 있는지 확인
- 앱 재시작 시도

### Android: 푸시 토큰이 수신되지 않음
- `google-services.json`이 올바른 위치에 있는지 확인
- 패키지 이름이 정확히 일치하는지 확인
- 디바이스에 Google Play Services가 설치되어 있는지 확인
- 앱 데이터 삭제 후 재설치 시도

### 알림이 발송되지 않음
- Edge Function 로그 확인: `supabase functions logs send-scheduled-notifications`
- Cron 작업 실행 확인: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`
- `get_pending_notifications()`가 결과를 반환하는지 확인
- Firebase 자격증명이 올바른지 확인

### 알림이 발송되었지만 수신되지 않음
- 디바이스에서 앱 알림이 허용되어 있는지 확인
- FCM 토큰이 유효한지 확인 (만료되지 않았는지)
- Firebase Console → Cloud Messaging → 로그 확인
- Firebase Console에서 직접 발송 테스트

### 알림 중복 발송
- `notification_logs` 테이블의 유니크 제약 조건 확인
- 같은 알림이 여러 번 스케줄되지 않았는지 확인
- Cron 작업이 중복 실행되지 않는지 확인

## 프로덕션 체크리스트

- [ ] Firebase 프로젝트 생성 및 설정 완료
- [ ] iOS APNs 키를 Firebase에 업로드
- [ ] Android `google-services.json` 추가
- [ ] 네이티브 코드에 푸시 알림 플러그인 설정
- [ ] 데이터베이스 마이그레이션 실행 (notification_logs, 함수)
- [ ] Edge Function 배포
- [ ] Supabase에 Firebase 시크릿 설정
- [ ] Cron 작업 스케줄 등록 (pg_cron 또는 외부)
- [ ] 실제 디바이스에서 토큰 등록 테스트
- [ ] 예약 알림 E2E 테스트
- [ ] 에러 로깅 및 모니터링 설정
- [ ] 레이트 리미팅 고려 (스팸 방지)

## 참고 자료

- [Capacitor 푸시 알림](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [APNs 설정](https://developer.apple.com/documentation/usernotifications)
- [FCM 설정](https://firebase.google.com/docs/cloud-messaging/android/client)
