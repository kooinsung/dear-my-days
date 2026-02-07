# Supabase Redirect URLs Configuration

## Quick Setup

Add these URLs to your Supabase project:

**Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**

```
https://dearmydays.com/auth/callback
http://localhost:3000/auth/callback
dearmydays://auth/callback
capacitor://localhost/auth/callback
```

## URL Explanations

| URL | Purpose |
|-----|---------|
| `https://dearmydays.com/auth/callback` | Production web app & Universal Links (iOS) / App Links (Android) |
| `http://localhost:3000/auth/callback` | Local development (web browser) |
| `dearmydays://auth/callback` | Custom URL scheme for mobile app deep links |
| `capacitor://localhost/auth/callback` | Capacitor WebView internal URL |

## Why Multiple URLs?

1. **Production Web**: Users on dearmydays.com in browsers
2. **Local Development**: Testing on localhost
3. **Custom Scheme**: Fallback for mobile deep links
4. **Capacitor Internal**: Required for WebView OAuth flow

## Testing Each URL

### Production
```bash
# Deploy to Vercel
vercel --prod

# Test OAuth in browser
https://dearmydays.com/login
```

### Local Development
```bash
# Run dev server
pnpm dev

# Test OAuth
http://localhost:3000/login
```

### Mobile App (Development)
```bash
# iOS
pnpm dev:ios

# Android
pnpm dev:android

# OAuth will use capacitor://localhost URL internally
```

### Deep Links
```bash
# iOS
xcrun simctl openurl booted dearmydays://auth/callback?code=test

# Android
adb shell am start -a android.intent.action.VIEW -d "dearmydays://auth/callback?code=test"
```

## Common Issues

### "Invalid redirect URL" Error
- Verify URL is added to Supabase exactly as shown above
- Check for trailing slashes (don't add them)
- Ensure URL is in the **Redirect URLs** section, not Site URL

### OAuth Opens Browser Instead of WebView
- Add `capacitor://localhost/auth/callback` to redirect URLs
- Check that Capacitor is configured correctly

### Universal Links Don't Open App
- Ensure `https://dearmydays.com/auth/callback` is in redirect URLs
- Deploy apple-app-site-association file
- Test on real device (not simulator)

## Production Checklist

Before going live:

- [ ] Add production URL to Supabase redirect URLs
- [ ] Remove localhost URLs from production (optional, for security)
- [ ] Test OAuth on production domain
- [ ] Verify Universal Links work on iOS device
- [ ] Verify App Links work on Android device
