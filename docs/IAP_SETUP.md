# 인앱 결제(IAP) 설정 가이드

## 개요

이 가이드는 Capacitor 앱에서 iOS(Apple)와 Android(Google Play) 인앱 결제를 구현하는 방법을 설명합니다.

## 아키텍처

**현재 구현 상태:**
- ✅ 영수증 검증을 위한 API 라우트 (`/api/iap/verify`, `/api/iap/restore`)
- ✅ 구독 상태 엔드포인트 (`/api/iap/subscription`)
- ✅ 구독 UI 페이지 (`/settings/subscription`)
- ✅ IAP 유틸리티 및 헬퍼 (`libs/capacitor/iap.ts`)
- ⚠️ **네이티브 구현 필요** (아래 참조)

## 상품 ID

App Store Connect와 Google Play Console에서 다음 상품 ID를 설정하세요:

```typescript
{
  PREMIUM_MONTHLY: 'com.dearmydays.premium.monthly',  // ₩4,900/월
  PREMIUM_YEARLY: 'com.dearmydays.premium.yearly',    // ₩49,000/년
  ENTERPRISE: 'com.dearmydays.enterprise',            // ₩99,000/년
}
```

## 1. iOS 설정 (Apple)

### 1단계: App Store Connect 구성

1. [App Store Connect](https://appstoreconnect.apple.com) 접속
2. 앱 선택 → **In-App Purchases**
3. **+** 클릭하여 새 구독 생성

**각 상품별 설정:**
- Product ID: `com.dearmydays.premium.monthly`
- Type: **Auto-Renewable Subscription**
- Subscription Group: "Premium Subscriptions" 생성
- Duration: 1개월 (또는 연간의 경우 1년)
- Price: ₩4,900 (또는 연간의 경우 ₩49,000)
- Localization: 한국어 및 영어 설명 추가

4. 영수증 검증을 위한 **Shared Secret** 생성:
   - App Store Connect → App → In-App Purchases → App-Specific Shared Secret
   - 생성하여 저장

### 2단계: 환경 변수

`.env.local`에 추가:
```env
APPLE_SHARED_SECRET=your_shared_secret_here
```

### 3단계: 네이티브 iOS 구현

현재 구현은 네이티브 StoreKit 2 코드가 필요합니다. iOS 프로젝트에 추가하세요:

**`IAPManager.swift` 생성:**
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

**`Capacitor.config.ts`에 플러그인 등록:**
```typescript
plugins: {
  IAPManager: {
    // iOS IAP configuration
  }
}
```

### 4단계: 테스트

1. **샌드박스 테스트:**
   - App Store Connect에서 샌드박스 테스터 생성
   - 기기에서 실제 Apple ID 로그아웃
   - 결제 시 프롬프트가 표시되면 샌드박스 계정 사용

2. **테스트 플로우:**
   ```bash
   pnpm dev:ios
   # /settings/subscription으로 이동
   # "구독하기" 클릭
   # StoreKit 결제 시트 표시되어야 함
   ```

## 2. Android 설정 (Google Play)

### 1단계: Google Play Console 구성

1. [Google Play Console](https://play.google.com/console) 접속
2. 앱 선택 → **Monetization setup** → **Products** → **Subscriptions**
3. 구독 상품 생성

**각 상품별 설정:**
- Product ID: `com.dearmydays.premium.monthly`
- Name: Premium Monthly
- Description: Monthly premium subscription
- Billing period: Monthly (또는 Yearly)
- Base price: ₩4,900 (또는 ₩49,000)

### 2단계: 서비스 계정 설정

1. **Google Cloud Console:**
   - IAM & Admin → Service Accounts로 이동
   - 앱용 서비스 계정 생성
   - "Owner" 또는 "Editor" 역할 부여
   - JSON 키 생성 및 다운로드

2. **Play Console에 연결:**
   - Play Console → Settings → API access
   - 서비스 계정 연결
   - "View financial data" 권한 부여

3. **액세스 토큰 생성:**
   ```bash
   # gcloud CLI 설치
   gcloud auth activate-service-account --key-file=service-account-key.json
   gcloud auth print-access-token
   ```

### 3단계: 환경 변수

`.env.local`에 추가:
```env
GOOGLE_PACKAGE_NAME=com.dearmydays.app
GOOGLE_SERVICE_ACCOUNT_TOKEN=your_access_token_here
```

**참고:** 액세스 토큰은 1시간 후 만료됩니다. 프로덕션에서는 서비스 계정 키를 사용한 자동 토큰 갱신을 구현하세요.

### 4단계: 네이티브 Android 구현

`android/app/build.gradle`에 Google Play Billing Library 추가:

```gradle
dependencies {
    implementation 'com.android.billingclient:billing:6.0.1'
}
```

**`IAPManager.java` 생성:**
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

### 5단계: 테스트

1. **라이선스 테스터로 테스트:**
   - Play Console → Settings → License Testing
   - 테스트 Google 계정 추가
   - 이 계정들은 실제 청구 없이 테스트 결제 가능

2. **테스트 플로우:**
   ```bash
   pnpm dev:android
   # /settings/subscription으로 이동
   # "구독하기" 클릭
   # Google Play 결제 대화상자가 표시되어야 함
   ```

## 3. 전체 플로우 테스트

### 웹 테스트 (Mock)
```bash
pnpm dev
# http://localhost:3000/settings/subscription 열기
# 모의 가격이 포함된 상품 목록이 표시되어야 함
# "구독하기" 클릭 시 오류 표시 (웹에서는 IAP 사용 불가)
```

### iOS 테스트
```bash
pnpm dev:ios
# 샌드박스 Apple ID 사용
# 결제 완료
# 영수증 검증 로그 확인
```

### Android 테스트
```bash
pnpm dev:android
# 라이선스 테스터 계정 사용
# 결제 완료
# 토큰 검증 로그 확인
```

## 4. 프로덕션 배포

### iOS
1. IAP가 구성된 상태로 앱 심사 제출
2. 모든 상품 ID가 승인되었는지 확인
3. 출시 전 TestFlight로 테스트
4. App Store Connect에서 구독 모니터링

### Android
1. Play Console에서 구독 상품 활성화
2. 내부/비공개 테스트 트랙으로 테스트
3. 프로덕션 출시 제출
4. Play Console에서 구독 모니터링

## 5. 구독 관리

### 사용자 취소

**iOS:**
- 사용자는 설정 앱 → Apple ID → 구독을 통해 취소
- 앱에서 프로그래밍 방식으로 구독 취소 불가
- 사용자를 설정으로 안내하는 UI 구현

**Android:**
- 사용자는 Google Play 스토어 → 구독을 통해 취소
- 구독 관리로 딥링크 가능:
  ```kotlin
  val intent = Intent(Intent.ACTION_VIEW)
  intent.data = Uri.parse("https://play.google.com/store/account/subscriptions")
  startActivity(intent)
  ```

### 구독 상태

- `/api/iap/subscription`을 주기적으로 폴링
- 사용자에게 만료 날짜 표시
- 유예 기간 처리 (결제 재시도)
- 갱신 날짜 표시

### 영수증 검증

- **항상 서버에서 영수증 검증**
- 클라이언트 측 검증을 신뢰하지 말 것
- 재사용 공격을 방지하기 위해 거래 ID 저장
- 만료된 구독을 적절하게 처리

## 6. 보안 모범 사례

- ✅ 비밀 정보는 환경 변수에 저장 (코드에 저장 금지)
- ✅ 모든 영수증을 서버 측에서 검증
- ✅ 모든 API 호출에 HTTPS 사용
- ✅ 멱등성 구현 (중복 거래 확인)
- ✅ 사기 탐지를 위해 모든 결제 시도 로그 기록
- ❌ Apple Shared Secret을 클라이언트에 노출 금지
- ❌ Google Service Account 자격 증명을 클라이언트에 노출 금지
- ❌ 서버 측 검증 건너뛰기 금지

## 7. 일반적인 문제

### iOS: "Cannot connect to iTunes Store"
- 샌드박스 환경 구성 확인
- 샌드박스 테스터 계정 확인
- 앱이 개발 인증서로 서명되었는지 확인

### iOS: "Receipt verification failed"
- `APPLE_SHARED_SECRET`이 올바른지 확인
- 상태 코드가 21007이면 샌드박스 URL 시도
- 영수증 데이터가 base64로 인코딩되었는지 확인

### Android: "Item unavailable"
- Play Console에서 상품 활성화
- 활성화 후 24시간 대기
- 앱 버전이 Play Console과 일치하는지 확인

### Android: "Unable to query purchases"
- Play Console API 액세스 확인
- 서비스 계정 권한 확인
- 결제 라이브러리가 올바르게 초기화되었는지 확인

### 일반: "Transaction already processed"
- 예상되는 동작입니다 (이중 청구 방지)
- 정당한 복원인 경우 user_plans만 업데이트

## 8. 참고 자료

- [Apple StoreKit 2](https://developer.apple.com/storekit/)
- [Google Play Billing](https://developer.android.com/google/play/billing)
- [App Store Server API](https://developer.apple.com/documentation/appstoreserverapi)
- [Google Play Developer API](https://developers.google.com/android-publisher)
- [Capacitor Docs](https://capacitorjs.com/docs)

## 9. 다음 단계

IAP 구현을 완료하려면:

1. 네이티브 코드 구현 (iOS Swift + Android Java)
2. Capacitor에 네이티브 플러그인 등록
3. `libs/capacitor/iap.ts` 업데이트하여 네이티브 메서드 호출
4. 샌드박스/테스트 계정으로 테스트
5. App Store Connect / Play Console에서 상품 구성
6. 환경 변수 추가
7. 프로덕션에 배포 및 테스트

**예상 소요 시간:** 8-12시간 (Phase 4 계획 참조)
