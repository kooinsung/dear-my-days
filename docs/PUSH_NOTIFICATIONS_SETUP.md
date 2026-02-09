# Push Notifications Setup Guide

## Overview

This guide explains how to set up push notifications for the Capacitor app, including scheduled event reminders.

## Architecture

**Two-Part System:**
1. **Infrastructure (Phase 5-1):** Token registration, permission handling, basic send API
2. **Scheduling (Phase 5-2):** Automated notifications based on event dates and user preferences

## Part 1: Push Notification Infrastructure

### 1.1 Firebase Setup

#### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project or use existing
3. Add iOS app:
   - iOS bundle ID: `com.dearmydays.app`
   - Download `GoogleService-Info.plist`
4. Add Android app:
   - Android package name: `com.dearmydays.app`
   - Download `google-services.json`

#### Configure Firebase Cloud Messaging

**iOS (APNs):**
1. Go to Project Settings → Cloud Messaging
2. Upload APNs Authentication Key:
   - Get from Apple Developer Console → Keys → Create APNs key
   - Upload to Firebase
3. Enter Team ID

**Android (FCM):**
- Automatically configured when you add Android app
- FCM uses the `google-services.json` file

### 1.2 iOS Native Setup

**Add Firebase SDK to iOS project:**

1. Place `GoogleService-Info.plist` in `ios/App/App/`

2. Add to `ios/App/Podfile`:
```ruby
target 'App' do
  capacitor_pods

  # Add Firebase
  pod 'Firebase/Messaging'
end
```

3. Run:
```bash
cd ios/App
pod install
```

4. Update `ios/App/App/AppDelegate.swift`:
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

### 1.3 Android Native Setup

**Add Firebase to Android project:**

1. Place `google-services.json` in `android/app/`

2. Update `android/build.gradle`:
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

3. Update `android/app/build.gradle`:
```gradle
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation 'com.google.firebase:firebase-messaging:23.1.0'
}
```

4. Create `android/app/src/main/java/.../FirebaseMessagingService.java`:
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

5. Update `AndroidManifest.xml`:
```xml
<service
    android:name=".MyFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

### 1.4 Environment Variables

Add to `.env.local`:
```env
# Firebase (for server-side notification sending)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Get Firebase credentials:**
1. Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Download JSON file
4. Extract `project_id`, `client_email`, `private_key`

### 1.5 Testing Push Notifications

**Test token registration:**
```bash
pnpm dev:ios
# Login to app
# Check console logs for "Push token: ..."
# Verify token is saved in device_tokens table
```

**Send test notification:**
```bash
# Use Firebase Console → Cloud Messaging → Send test message
# Or use the API:
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "title": "Test Notification",
    "bodyText": "This is a test",
    "data": {"eventId": "event-uuid"}
  }'
```

## Part 2: Notification Scheduling System

### 2.1 Database Setup

Run the SQL migration in Supabase SQL Editor:
```bash
# File: supabase/migrations/create_notification_system.sql
```

This creates:
- `notification_logs` table
- `get_pending_notifications()` function
- Indexes for performance
- RLS policies

### 2.2 Edge Function Deployment

**Deploy the Edge Function:**
```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy function
supabase functions deploy send-scheduled-notifications

# Set secrets
supabase secrets set FIREBASE_PROJECT_ID=your-project
supabase secrets set FIREBASE_CLIENT_EMAIL=xxx@xxx.iam.gserviceaccount.com
supabase secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxx\n-----END PRIVATE KEY-----\n"
```

### 2.3 Cron Job Setup

**Option 1: Supabase pg_cron (Recommended)**

Run in Supabase SQL Editor:
```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule function to run every minute
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

-- View scheduled jobs
SELECT * FROM cron.job;

-- Unschedule (if needed)
-- SELECT cron.unschedule('send-scheduled-notifications');
```

**Option 2: External Cron (e.g., Vercel Cron, GitHub Actions)**

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/send-notifications",
    "schedule": "* * * * *"
  }]
}
```

Create `/api/cron/send-notifications/route.ts`:
```typescript
export async function GET(req: NextRequest) {
  // Call Supabase Edge Function
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

### 2.4 Configure Event Notification Settings

**User Flow:**
1. User creates/edits event
2. User sees notification settings UI
3. User selects when to be reminded (D-7, D-3, D-1, D-Day)
4. User sets time (hour and minute)
5. Settings saved to `event_notification_settings` table

**Example:**
```typescript
// Event: Birthday on 2025-01-15
// Settings:
[
  { days_before: 7, hour: 9, minute: 0 },  // 2025-01-08 09:00
  { days_before: 1, hour: 9, minute: 0 },  // 2025-01-14 09:00
  { days_before: 0, hour: 9, minute: 0 },  // 2025-01-15 09:00
]
```

### 2.5 Testing Scheduled Notifications

**Test the PostgreSQL function:**
```sql
-- Simulate current time: 9:00 AM
SELECT * FROM get_pending_notifications(9, 0);

-- Should return events scheduled for today at 9:00
```

**Test Edge Function locally:**
```bash
# Start local Supabase
supabase start

# Serve Edge Function
supabase functions serve send-scheduled-notifications --env-file .env.local

# Trigger manually
curl -X POST http://localhost:54321/functions/v1/send-scheduled-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Test in production:**
1. Create event with notification setting (tomorrow at current hour+1 minute)
2. Wait for cron job to run
3. Check `notification_logs` table
4. Verify push received on device

## Troubleshooting

### iOS: No push token received
- Check APNs key is uploaded to Firebase
- Verify bundle ID matches exactly
- Check device has internet connection
- Try restarting app

### Android: No push token received
- Check `google-services.json` is in correct location
- Verify package name matches exactly
- Check Google Play Services is installed on device
- Try clearing app data and reinstalling

### No notifications sent
- Check Edge Function logs: `supabase functions logs send-scheduled-notifications`
- Verify cron job is running: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`
- Check `get_pending_notifications()` returns results
- Verify Firebase credentials are correct

### Notifications sent but not received
- Check device has notifications enabled for app
- Verify FCM token is valid (not expired)
- Check Firebase Console → Cloud Messaging → logs
- Test sending from Firebase Console directly

### Duplicate notifications
- Check `notification_logs` table has proper unique constraints
- Verify same notification isn't scheduled multiple times
- Check cron job isn't running multiple times

## Production Checklist

- [ ] Firebase project created and configured
- [ ] iOS APNs key uploaded to Firebase
- [ ] Android `google-services.json` added
- [ ] Push notification plugin configured in native code
- [ ] Database migration run (notification_logs, functions)
- [ ] Edge Function deployed
- [ ] Firebase secrets set in Supabase
- [ ] Cron job scheduled (pg_cron or external)
- [ ] Token registration tested on real devices
- [ ] Scheduled notifications tested end-to-end
- [ ] Error logging and monitoring set up
- [ ] Rate limiting considered (avoid spam)

## Resources

- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [APNs Setup](https://developer.apple.com/documentation/usernotifications)
- [FCM Setup](https://firebase.google.com/docs/cloud-messaging/android/client)
