# In-App Purchases (IAP) Setup Guide

## Overview

This guide explains how to implement in-app purchases for iOS (Apple) and Android (Google Play) in the Capacitor app.

## Architecture

**Current Implementation Status:**
- ✅ API routes for receipt verification (`/api/iap/verify`, `/api/iap/restore`)
- ✅ Subscription status endpoint (`/api/iap/subscription`)
- ✅ Subscription UI page (`/settings/subscription`)
- ✅ IAP utilities and helpers (`libs/capacitor/iap.ts`)
- ⚠️ **Native implementation required** (see below)

## Product IDs

Configure these product IDs in App Store Connect and Google Play Console:

```typescript
{
  PREMIUM_MONTHLY: 'com.dearmydays.premium.monthly',  // ₩4,900/month
  PREMIUM_YEARLY: 'com.dearmydays.premium.yearly',    // ₩49,000/year
  ENTERPRISE: 'com.dearmydays.enterprise',            // ₩99,000/year
}
```

## 1. iOS Setup (Apple)

### Step 1: App Store Connect Configuration

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app → **In-App Purchases**
3. Click **+** to create new subscription

**For each product:**
- Product ID: `com.dearmydays.premium.monthly`
- Type: **Auto-Renewable Subscription**
- Subscription Group: Create "Premium Subscriptions"
- Duration: 1 month (or 1 year for yearly)
- Price: ₩4,900 (or ₩49,000 for yearly)
- Localization: Add Korean and English descriptions

4. Create **Shared Secret** for receipt verification:
   - App Store Connect → App → In-App Purchases → App-Specific Shared Secret
   - Generate and save the secret

### Step 2: Environment Variables

Add to `.env.local`:
```env
APPLE_SHARED_SECRET=your_shared_secret_here
```

### Step 3: Native iOS Implementation

The current implementation requires native StoreKit 2 code. Add to your iOS project:

**Create `IAPManager.swift`:**
```swift
import StoreKit
import Capacitor

@objc(IAPManager)
public class IAPManager: CAPPlugin {

    @objc func getProducts(_ call: CAPPluginCall) {
        Task {
            do {
                let productIds = [
                    "com.dearmydays.premium.monthly",
                    "com.dearmydays.premium.yearly"
                ]

                let products = try await Product.products(for: productIds)

                let productsData = products.map { product in
                    return [
                        "id": product.id,
                        "title": product.displayName,
                        "description": product.description,
                        "price": product.displayPrice,
                        "priceValue": product.price as NSDecimalNumber
                    ]
                }

                call.resolve(["products": productsData])
            } catch {
                call.reject("Failed to fetch products: \\(error)")
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("Product ID required")
            return
        }

        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.reject("Product not found")
                    return
                }

                let result = try await product.purchase()

                switch result {
                case .success(let verification):
                    let transaction = try checkVerified(verification)

                    // Get receipt
                    if let appStoreReceiptURL = Bundle.main.appStoreReceiptURL,
                       FileManager.default.fileExists(atPath: appStoreReceiptURL.path) {
                        let receiptData = try Data(contentsOf: appStoreReceiptURL)
                        let receiptString = receiptData.base64EncodedString()

                        call.resolve([
                            "success": true,
                            "transactionId": String(transaction.id),
                            "receipt": receiptString,
                            "platform": "ios"
                        ])
                    }

                    await transaction.finish()

                case .userCancelled:
                    call.reject("User cancelled")

                case .pending:
                    call.reject("Purchase pending")

                @unknown default:
                    call.reject("Unknown result")
                }
            } catch {
                call.reject("Purchase failed: \\(error)")
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()

                var transactions: [[String: Any]] = []

                for await result in Transaction.currentEntitlements {
                    let transaction = try checkVerified(result)

                    if let appStoreReceiptURL = Bundle.main.appStoreReceiptURL,
                       FileManager.default.fileExists(atPath: appStoreReceiptURL.path) {
                        let receiptData = try Data(contentsOf: appStoreReceiptURL)
                        let receiptString = receiptData.base64EncodedString()

                        transactions.append([
                            "transactionId": String(transaction.id),
                            "productId": transaction.productID,
                            "receipt": receiptString
                        ])
                    }
                }

                call.resolve(["transactions": transactions])
            } catch {
                call.reject("Restore failed: \\(error)")
            }
        }
    }

    func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreError.failedVerification
        case .verified(let safe):
            return safe
        }
    }
}

enum StoreError: Error {
    case failedVerification
}
```

**Register plugin in `Capacitor.config.ts`:**
```typescript
plugins: {
  IAPManager: {
    // iOS IAP configuration
  }
}
```

### Step 4: Testing

1. **Sandbox Testing:**
   - Create sandbox tester in App Store Connect
   - Sign out of real Apple ID on device
   - Use sandbox account when prompted during purchase

2. **Test Flow:**
   ```bash
   pnpm dev:ios
   # Navigate to /settings/subscription
   # Click "구독하기"
   # Should show StoreKit payment sheet
   ```

## 2. Android Setup (Google Play)

### Step 1: Google Play Console Configuration

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app → **Monetization setup** → **Products** → **Subscriptions**
3. Create subscription products

**For each product:**
- Product ID: `com.dearmydays.premium.monthly`
- Name: Premium Monthly
- Description: Monthly premium subscription
- Billing period: Monthly (or Yearly)
- Base price: ₩4,900 (or ₩49,000)

### Step 2: Service Account Setup

1. **Google Cloud Console:**
   - Go to IAM & Admin → Service Accounts
   - Create service account for your app
   - Grant "Owner" or "Editor" role
   - Create JSON key and download

2. **Link to Play Console:**
   - Play Console → Settings → API access
   - Link the service account
   - Grant "View financial data" permission

3. **Generate Access Token:**
   ```bash
   # Install gcloud CLI
   gcloud auth activate-service-account --key-file=service-account-key.json
   gcloud auth print-access-token
   ```

### Step 3: Environment Variables

Add to `.env.local`:
```env
GOOGLE_PACKAGE_NAME=com.dearmydays.app
GOOGLE_SERVICE_ACCOUNT_TOKEN=your_access_token_here
```

**Note:** The access token expires after 1 hour. For production, implement automatic token refresh using the service account key.

### Step 4: Native Android Implementation

Add Google Play Billing Library to `android/app/build.gradle`:

```gradle
dependencies {
    implementation 'com.android.billingclient:billing:6.0.1'
}
```

**Create `IAPManager.java`:**
```java
package com.dearmydays.app;

import com.android.billingclient.api.*;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.*;

@CapacitorPlugin(name = "IAPManager")
public class IAPManager extends Plugin {

    private BillingClient billingClient;

    @Override
    public void load() {
        billingClient = BillingClient.newBuilder(getContext())
            .setListener(purchaseUpdatedListener)
            .enablePendingPurchases()
            .build();

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    // Ready
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                // Retry connection
            }
        });
    }

    @PluginMethod
    public void getProducts(PluginCall call) {
        List<QueryProductDetailsParams.Product> productList = Arrays.asList(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId("com.dearmydays.premium.monthly")
                .setProductType(BillingClient.ProductType.SUBS)
                .build(),
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId("com.dearmydays.premium.yearly")
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        );

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(productList)
            .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsList) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                JSArray products = new JSArray();
                for (ProductDetails productDetails : productDetailsList) {
                    JSObject product = new JSObject();
                    product.put("id", productDetails.getProductId());
                    product.put("title", productDetails.getTitle());
                    product.put("description", productDetails.getDescription());

                    ProductDetails.SubscriptionOfferDetails offer =
                        productDetails.getSubscriptionOfferDetails().get(0);
                    ProductDetails.PricingPhase phase =
                        offer.getPricingPhases().getPricingPhaseList().get(0);

                    product.put("price", phase.getFormattedPrice());
                    product.put("priceValue", phase.getPriceAmountMicros() / 1000000);

                    products.put(product);
                }

                JSObject result = new JSObject();
                result.put("products", products);
                call.resolve(result);
            } else {
                call.reject("Failed to fetch products");
            }
        });
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId");

        // Implement purchase flow
        // On success, get purchase token and send to server
    }

    @PluginMethod
    public void restore(PluginCall call) {
        QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.SUBS)
            .build();

        billingClient.queryPurchasesAsync(params, (billingResult, purchases) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                // Process restored purchases
                call.resolve();
            } else {
                call.reject("Restore failed");
            }
        });
    }

    private PurchaseUpdatedListener purchaseUpdatedListener =
        (billingResult, purchases) -> {
            // Handle purchase updates
        };
}
```

### Step 5: Testing

1. **Test with License Testers:**
   - Play Console → Settings → License Testing
   - Add test Google accounts
   - These accounts can make test purchases without being charged

2. **Test Flow:**
   ```bash
   pnpm dev:android
   # Navigate to /settings/subscription
   # Click "구독하기"
   # Should show Google Play billing dialog
   ```

## 3. Testing the Complete Flow

### Web Testing (Mock)
```bash
pnpm dev
# Open http://localhost:3000/settings/subscription
# Should see product list with mock prices
# Clicking "구독하기" shows error (IAP not available in web)
```

### iOS Testing
```bash
pnpm dev:ios
# Use sandbox Apple ID
# Complete purchase
# Check logs for receipt verification
```

### Android Testing
```bash
pnpm dev:android
# Use license tester account
# Complete purchase
# Check logs for token verification
```

## 4. Production Deployment

### iOS
1. Submit app for review with IAP configured
2. Ensure all product IDs are approved
3. Test with TestFlight before release
4. Monitor subscriptions in App Store Connect

### Android
1. Activate subscription products in Play Console
2. Test with internal/closed testing track
3. Submit for production release
4. Monitor subscriptions in Play Console

## 5. Subscription Management

### User Cancellation

**iOS:**
- Users cancel via Settings app → Apple ID → Subscriptions
- App cannot cancel subscriptions programmatically
- Implement UI to direct users to Settings

**Android:**
- Users cancel via Google Play Store → Subscriptions
- Can deep link to subscription management:
  ```kotlin
  val intent = Intent(Intent.ACTION_VIEW)
  intent.data = Uri.parse("https://play.google.com/store/account/subscriptions")
  startActivity(intent)
  ```

### Subscription Status

- Poll `/api/iap/subscription` periodically
- Show expiry date to users
- Handle grace periods (payment retry)
- Show renewal date

### Receipt Validation

- **Always validate receipts on the server**
- Never trust client-side validation
- Store transaction IDs to prevent replay attacks
- Handle expired subscriptions gracefully

## 6. Security Best Practices

- ✅ Store secrets in environment variables (not in code)
- ✅ Validate all receipts server-side
- ✅ Use HTTPS for all API calls
- ✅ Implement idempotency (check for duplicate transactions)
- ✅ Log all purchase attempts for fraud detection
- ❌ Never expose Apple Shared Secret to client
- ❌ Never expose Google Service Account credentials to client
- ❌ Never skip server-side validation

## 7. Common Issues

### iOS: "Cannot connect to iTunes Store"
- Check sandbox environment configuration
- Verify sandbox tester account
- Ensure app is signed with development certificate

### iOS: "Receipt verification failed"
- Check `APPLE_SHARED_SECRET` is correct
- Try sandbox URL if status code is 21007
- Ensure receipt data is base64 encoded

### Android: "Item unavailable"
- Activate products in Play Console
- Wait 24 hours after activation
- Ensure app version matches Play Console

### Android: "Unable to query purchases"
- Check Play Console API access
- Verify service account permissions
- Ensure billing library is properly initialized

### General: "Transaction already processed"
- This is expected behavior (prevents double-charging)
- If legitimate restore, update user_plans only

## 8. Resources

- [Apple StoreKit 2](https://developer.apple.com/storekit/)
- [Google Play Billing](https://developer.android.com/google/play/billing)
- [App Store Server API](https://developer.apple.com/documentation/appstoreserverapi)
- [Google Play Developer API](https://developers.google.com/android-publisher)
- [Capacitor Docs](https://capacitorjs.com/docs)

## 9. Next Steps

To complete IAP implementation:

1. Implement native code (iOS Swift + Android Java)
2. Register native plugins with Capacitor
3. Update `libs/capacitor/iap.ts` to call native methods
4. Test with sandbox/test accounts
5. Configure products in App Store Connect / Play Console
6. Add environment variables
7. Deploy and test in production

**Estimated time:** 8-12 hours (as per Phase 4 plan)
