# OAuth Deep Link Setup Guide

## Overview

This guide explains how to configure OAuth authentication for the Capacitor mobile app using deep links and universal links.

## Architecture

The app uses **Web URL Loading** approach:
- OAuth flows happen in the WebView (no external browser)
- OAuth callbacks go to `https://dearmydays.com/auth/callback`
- The callback route exchanges the code and creates a session
- No additional native code needed!

## 1. Supabase Configuration

### Redirect URLs

Add the following URLs to your Supabase project:

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Add these URLs to **Redirect URLs**:

```
https://dearmydays.com/auth/callback
http://localhost:3000/auth/callback
dearmydays://auth/callback
capacitor://localhost/auth/callback
```

### OAuth Providers

Configure each provider in Supabase:

#### Google OAuth
1. **Supabase Dashboard** → **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. Add your Google Client ID and Secret
4. Authorized redirect URIs in Google Cloud Console:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

#### Kakao OAuth
1. **Supabase Dashboard** → **Authentication** → **Providers** → **Kakao**
2. Enable Kakao provider
3. Add your Kakao REST API Key
4. Redirect URIs in Kakao Developers:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

#### Apple OAuth
1. **Supabase Dashboard** → **Authentication** → **Providers** → **Apple**
2. Enable Apple provider
3. Add your Apple Service ID and Key
4. Redirect URIs in Apple Developer Console:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

#### Naver OAuth
Naver uses custom implementation (not built into Supabase):
1. Add redirect URI in Naver Developers:
   - `https://dearmydays.com/auth/naver/callback`

## 2. iOS Universal Links Setup

Universal Links allow iOS to open your app instead of Safari when clicking links.

### Step 1: Apple Developer Console

1. Go to **Certificates, Identifiers & Profiles**
2. Select your App ID (`com.dearmydays.app`)
3. Enable **Associated Domains** capability
4. Save

### Step 2: Xcode Configuration

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select the **App** target
3. Go to **Signing & Capabilities** tab
4. Click **+ Capability** → **Associated Domains**
5. Add domain:
   ```
   applinks:dearmydays.com
   ```

### Step 3: Deploy apple-app-site-association

The file is already created at:
```
public/.well-known/apple-app-site-association
```

**Important:** Update `TEAM_ID` with your Apple Team ID:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "YOUR_TEAM_ID.com.dearmydays.app",
        "paths": ["/auth/callback", "/event/*", "/calendar"]
      }
    ]
  }
}
```

Deploy this file to your web server so it's accessible at:
```
https://dearmydays.com/.well-known/apple-app-site-association
```

**Note:** This file must be served with `Content-Type: application/json` and must be accessible over HTTPS without redirects.

### Step 4: Verify Universal Links

Test on a real iOS device (not simulator):

```bash
# Open this URL in Safari
https://dearmydays.com/auth/callback?test=1

# Should open your app instead of Safari
```

Or use Apple's validator:
```
https://search.developer.apple.com/appsearch-validation-tool/
```

## 3. Android App Links Setup

App Links allow Android to open your app when clicking links.

### Step 1: Generate SHA256 Certificate Fingerprint

For debug builds:
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

For release builds:
```bash
keytool -list -v -keystore /path/to/your-release-key.keystore -alias your-key-alias
```

Copy the **SHA256** fingerprint.

### Step 2: Update assetlinks.json

Edit `public/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.dearmydays.app",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

Deploy this file to:
```
https://dearmydays.com/.well-known/assetlinks.json
```

### Step 3: Verify App Links

Test on a real Android device:

```bash
# Test with adb
adb shell am start -a android.intent.action.VIEW -d "https://dearmydays.com/auth/callback"

# Should open your app
```

Or use Google's validator:
```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://dearmydays.com&relation=delegate_permission/common.handle_all_urls
```

## 4. Testing OAuth Flow

### Web Browser (Development)
```bash
pnpm dev
# Open http://localhost:3000/login
# Click OAuth button → Works normally
```

### iOS Simulator
```bash
pnpm dev:ios
# Click OAuth button → OAuth opens in WebView
# After auth → Redirects to app
```

### Android Emulator
```bash
pnpm dev:android
# Click OAuth button → OAuth opens in WebView
# After auth → Redirects to app
```

### Test Deep Links

#### iOS
```bash
# Test custom URL scheme
xcrun simctl openurl booted dearmydays://auth/callback?code=test

# Test Universal Link (real device only)
# Send link via Messages or Notes, then tap it
```

#### Android
```bash
# Test custom URL scheme
adb shell am start -a android.intent.action.VIEW -d "dearmydays://auth/callback?code=test"

# Test App Link
adb shell am start -a android.intent.action.VIEW -d "https://dearmydays.com/auth/callback?code=test"
```

## 5. Troubleshooting

### OAuth Opens in External Browser (iOS)
- Check that WebView is allowed in Supabase redirect URLs
- Ensure `capacitor://localhost` is in redirect URLs

### Universal Links Don't Work
- Verify apple-app-site-association is accessible over HTTPS
- Check Content-Type is `application/json`
- Test on real device (simulator doesn't support Universal Links)
- Verify Team ID is correct in the association file

### App Links Don't Work (Android)
- Verify assetlinks.json is accessible
- Check SHA256 fingerprint matches your keystore
- Test with Digital Asset Links API
- Check AndroidManifest.xml has `android:autoVerify="true"`

### OAuth Callback Returns to Web Instead of App
- Check deep link handlers are registered in `deep-link.ts`
- Verify URL schemes are in Info.plist (iOS) and AndroidManifest.xml (Android)
- Check Supabase redirect URL configuration

### Session Not Persisting After OAuth
- Check that `/auth/callback/route.ts` is exchanging code properly
- Verify Supabase cookies are set correctly
- Check browser console for errors

## 6. Production Checklist

Before deploying to production:

- [ ] Update `capacitor.config.ts` server URL to production domain
- [ ] Configure all OAuth providers in Supabase
- [ ] Add all redirect URLs to Supabase
- [ ] Deploy apple-app-site-association with correct Team ID
- [ ] Deploy assetlinks.json with release SHA256 fingerprint
- [ ] Enable Universal Links in Xcode
- [ ] Test OAuth flow on real devices (iOS and Android)
- [ ] Verify deep links work on real devices
- [ ] Test with all OAuth providers (Google, Kakao, Apple, Naver)

## 7. Security Notes

- Always use HTTPS for production
- Never expose OAuth secrets in client code
- Validate OAuth state parameter for Naver
- Use PKCE flow (enabled by default in Supabase)
- Implement rate limiting on auth endpoints
- Monitor for suspicious OAuth attempts

## 8. Resources

- [Capacitor Deep Links](https://capacitorjs.com/docs/guides/deep-links)
- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
