# Deployment Checklist for Dear My Days Mobile App

## Overview

This checklist covers all steps needed to deploy the Dear My Days Capacitor app to production.

## Pre-Deployment Checklist

### 1. Code & Configuration ✅

- [x] All phases implemented (Phase 1-6)
- [x] Capacitor configured (`capacitor.config.ts`)
- [x] Environment variables documented
- [x] Linting passes (`pnpm biome check`)
- [x] Build succeeds (`pnpm build`)

### 2. Environment Variables

#### Required (All Environments)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Web
NEXT_PUBLIC_WEB_BASE_URL=https://dearmydays.com
NEXT_PUBLIC_SITE_URL=https://dearmydays.com

# Email
RESEND_API_KEY=xxx
RESEND_FROM_EMAIL=noreply@dearmydays.com

# KASI (Lunar Calendar)
KASI_SERVICE_KEY=xxx
```

#### Optional (OAuth)
```env
# Naver
NEXT_PUBLIC_NAVER_CLIENT_ID=xxx
NAVER_CLIENT_SECRET=xxx

# Google/Kakao/Apple - Configure in Supabase Dashboard
```

#### Optional (IAP - If Implementing)
```env
APPLE_SHARED_SECRET=xxx
GOOGLE_PACKAGE_NAME=com.dearmydays.app
GOOGLE_SERVICE_ACCOUNT_TOKEN=xxx
```

#### Optional (Push Notifications - If Implementing)
```env
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxx\n-----END PRIVATE KEY-----\n"
```

### 3. Supabase Configuration

#### Database Setup
- [ ] Run all migrations
- [ ] Verify tables exist:
  - `events`
  - `user_plans`
  - `event_purchases` (if using IAP)
  - `device_tokens` (if using push)
  - `event_notification_settings` (if using push)
  - `notification_logs` (if using push)
- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Test RLS policies

#### Authentication Setup
- [ ] Add redirect URLs:
  ```
  https://dearmydays.com/auth/callback
  http://localhost:3000/auth/callback
  dearmydays://auth/callback
  capacitor://localhost/auth/callback
  ```
- [ ] Configure OAuth providers (Google, Kakao, Apple, Naver)
- [ ] Test each OAuth flow

#### Edge Functions (If Using Push Notifications)
- [ ] Deploy Edge Function:
  ```bash
  supabase functions deploy send-scheduled-notifications
  ```
- [ ] Set secrets:
  ```bash
  supabase secrets set FIREBASE_PROJECT_ID=xxx
  supabase secrets set FIREBASE_CLIENT_EMAIL=xxx
  supabase secrets set FIREBASE_PRIVATE_KEY=xxx
  ```
- [ ] Set up pg_cron job (see PUSH_NOTIFICATIONS_SETUP.md)

### 4. Web Deployment (Vercel)

- [ ] Connect GitHub repository to Vercel
- [ ] Configure environment variables in Vercel
- [ ] Set build command: `next build`
- [ ] Set output directory: `.next`
- [ ] Deploy production build
- [ ] Test web app: https://dearmydays.com
- [ ] Verify `.well-known` files accessible:
  - `/.well-known/apple-app-site-association`
  - `/.well-known/assetlinks.json`

### 5. iOS Setup

#### Apple Developer Account
- [ ] Enroll in Apple Developer Program ($99/year)
- [ ] Create App ID: `com.dearmydays.app`
- [ ] Enable capabilities:
  - Associated Domains (for Universal Links)
  - Push Notifications
  - In-App Purchase (if implementing)
  - Sign in with Apple (if implementing)

#### Xcode Configuration
- [ ] Open `ios/App/App.xcworkspace` in Xcode
- [ ] Update Bundle Identifier: `com.dearmydays.app`
- [ ] Configure Signing & Capabilities:
  - Select your development team
  - Enable automatic signing
  - Add Associated Domains: `applinks:dearmydays.com`
  - Add Push Notifications capability
- [ ] Update version and build number
- [ ] Replace app icon (Assets.xcassets)
- [ ] Test on iOS Simulator

#### Firebase Setup (If Using Push Notifications)
- [ ] Add `GoogleService-Info.plist` to `ios/App/App/`
- [ ] Update `Podfile` with Firebase dependencies
- [ ] Run `pod install`
- [ ] Update `AppDelegate.swift` with Firebase initialization
- [ ] Upload APNs key to Firebase Console

#### TestFlight Deployment
- [ ] Archive app (Product → Archive)
- [ ] Distribute to App Store Connect
- [ ] Add to TestFlight
- [ ] Invite internal testers
- [ ] Test on real devices

#### App Store Submission
- [ ] Create app in App Store Connect
- [ ] Upload screenshots (all required sizes)
- [ ] Write app description (Korean + English)
- [ ] Set category and keywords
- [ ] Add privacy policy URL
- [ ] Submit for review

### 6. Android Setup

#### Google Play Console
- [ ] Create Google Play Developer account ($25 one-time)
- [ ] Create application
- [ ] Set up app details:
  - App name: Dear My Days
  - Package name: `com.dearmydays.app`
  - Category: Lifestyle or Productivity

#### Android Studio Configuration
- [ ] Open `android/` in Android Studio
- [ ] Update `applicationId` in `build.gradle`: `com.dearmydays.app`
- [ ] Update version code and version name
- [ ] Replace app icon (res/mipmap)
- [ ] Generate signing key:
  ```bash
  keytool -genkey -v -keystore my-release-key.keystore \
    -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
  ```
- [ ] Configure signing in `build.gradle`
- [ ] Test on Android Emulator

#### Firebase Setup (If Using Push Notifications)
- [ ] Add `google-services.json` to `android/app/`
- [ ] Update `build.gradle` with Firebase dependencies
- [ ] Create `FirebaseMessagingService.java`
- [ ] Update `AndroidManifest.xml` with service

#### App Links Setup
- [ ] Generate SHA-256 fingerprint:
  ```bash
  keytool -list -v -keystore my-release-key.keystore -alias my-key-alias
  ```
- [ ] Update `assetlinks.json` with fingerprint
- [ ] Verify: https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://dearmydays.com

#### Internal Testing
- [ ] Build signed APK/AAB:
  ```bash
  cd android
  ./gradlew bundleRelease
  ```
- [ ] Upload to Internal Testing track
- [ ] Add test users
- [ ] Test on real devices

#### Production Release
- [ ] Create production release
- [ ] Upload signed AAB
- [ ] Fill out store listing:
  - Screenshots (all required sizes)
  - Feature graphic
  - App description
  - Privacy policy URL
- [ ] Set content rating
- [ ] Submit for review

### 7. In-App Purchases Setup (If Implementing)

#### iOS (App Store Connect)
- [ ] Create subscription group: "Premium Subscriptions"
- [ ] Create products:
  - `com.dearmydays.premium.monthly` - ₩4,900/month
  - `com.dearmydays.premium.yearly` - ₩49,000/year
- [ ] Generate App-Specific Shared Secret
- [ ] Add to environment variables: `APPLE_SHARED_SECRET`

#### Android (Google Play Console)
- [ ] Create subscription products:
  - `com.dearmydays.premium.monthly` - ₩4,900/month
  - `com.dearmydays.premium.yearly` - ₩49,000/year
- [ ] Set up billing period and pricing
- [ ] Activate products
- [ ] Set up service account for API access
- [ ] Generate access token
- [ ] Add to environment variables

#### Native Code
- [ ] Implement iOS IAP (see IAP_SETUP.md)
- [ ] Implement Android Billing (see IAP_SETUP.md)
- [ ] Test with sandbox accounts

### 8. Push Notifications Setup (If Implementing)

#### Firebase Configuration
- [ ] Create Firebase project
- [ ] Add iOS app + download config
- [ ] Add Android app + download config
- [ ] Configure Cloud Messaging
- [ ] Upload APNs key (iOS)

#### Database Setup
- [ ] Run notification migrations
- [ ] Create `get_pending_notifications()` function
- [ ] Set up pg_cron job

#### Testing
- [ ] Test token registration
- [ ] Test manual notification send
- [ ] Test scheduled notifications
- [ ] Test notification click → deep link

### 9. Testing Checklist

#### Web Testing
- [ ] All pages load correctly
- [ ] OAuth login works
- [ ] Event CRUD works
- [ ] Calendar view works
- [ ] Lunar date conversion works

#### iOS Testing
- [ ] App launches successfully
- [ ] OAuth login works (all providers)
- [ ] Deep links work (`dearmydays://`)
- [ ] Universal Links work (`https://dearmydays.com/`)
- [ ] Native back gesture works
- [ ] Status bar styling correct
- [ ] Push notifications work (if implemented)
- [ ] IAP works (if implemented)

#### Android Testing
- [ ] App launches successfully
- [ ] OAuth login works (all providers)
- [ ] Deep links work
- [ ] App Links work
- [ ] Native back button works
- [ ] Push notifications work (if implemented)
- [ ] IAP works (if implemented)

### 10. Monitoring & Analytics

#### Error Tracking
- [ ] Set up Sentry or similar
- [ ] Configure error boundaries
- [ ] Test error reporting

#### Analytics (Optional)
- [ ] Set up Google Analytics or similar
- [ ] Track key events:
  - User registration
  - Event creation
  - OAuth login
  - Subscription purchase
  - Notification interactions

#### Performance Monitoring
- [ ] Monitor API response times
- [ ] Monitor Supabase query performance
- [ ] Monitor Edge Function execution

## Post-Deployment Checklist

### Day 1
- [ ] Monitor crash reports
- [ ] Check user feedback
- [ ] Verify analytics tracking
- [ ] Monitor API errors

### Week 1
- [ ] Review app store reviews
- [ ] Fix critical bugs
- [ ] Monitor subscription conversions (if applicable)
- [ ] Check notification delivery rates (if applicable)

### Month 1
- [ ] Analyze user retention
- [ ] Optimize performance bottlenecks
- [ ] Plan feature updates
- [ ] Respond to user feedback

## Maintenance Checklist

### Monthly
- [ ] Review error logs
- [ ] Check for Capacitor updates
- [ ] Check for dependency updates
- [ ] Review app store reviews

### Quarterly
- [ ] Update privacy policy (if needed)
- [ ] Review and optimize database queries
- [ ] Audit security practices
- [ ] Plan major feature releases

### Annually
- [ ] Renew Apple Developer membership
- [ ] Review and update app screenshots
- [ ] Major version updates
- [ ] Security audit

## Emergency Procedures

### Critical Bug Found
1. Identify severity (crashes, data loss, security)
2. Fix in development
3. Test thoroughly
4. Deploy hotfix to production
5. Submit emergency app update

### Server Outage
1. Check Vercel status
2. Check Supabase status
3. Check third-party services (Firebase, etc.)
4. Communicate with users (status page)
5. Implement fallback if possible

### Data Breach
1. Identify scope of breach
2. Notify affected users
3. Reset credentials if needed
4. Review security practices
5. Report to authorities (if required)

## Rollback Procedures

### Web (Vercel)
```bash
# Rollback to previous deployment
vercel rollback
```

### Mobile Apps
- iOS: Cannot rollback (submit new version)
- Android: Use release management in Play Console
- Communicate with users about issues

## Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Apple Developer](https://developer.apple.com)
- [Google Play Console](https://play.google.com/console)
- [Vercel Docs](https://vercel.com/docs)

## Support Contacts

- Technical Support: support@dearmydays.com
- Emergency Contact: emergency@dearmydays.com
- Developer GitHub: https://github.com/dearmydays/app

---

**Last Updated:** 2026-02-07
**Version:** 1.0.0
