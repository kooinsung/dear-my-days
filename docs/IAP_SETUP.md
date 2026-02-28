# 인앱결제 (IAP) 설정 가이드

## 개요

이 가이드는 Capacitor 앱에서 iOS (Apple) 및 Android (Google Play) 인앱결제를 구현하는 방법을 설명합니다.

## 아키텍처

**현재 구현 상태:**
- ✅ 영수증 검증 API 라우트 (`/api/iap/verify`, `/api/iap/restore`)
- ✅ 구독 상태 엔드포인트 (`/api/iap/subscription`)
- ✅ 구독 관리 UI 페이지 (`/settings/subscription`)
- ✅ IAP 유틸리티 및 헬퍼 (`libs/capacitor/iap.ts`)
- ⚠️ **네이티브 구현 필요** (아래 참조)

## 상품 ID

App Store Connect 및 Google Play Console에 다음 상품 ID를 등록하세요:

```typescript
{
  PREMIUM_MONTHLY: 'com.dearmydays.premium.monthly',  // ₩4,900/월 (자동 갱신 구독)
  PREMIUM_YEARLY: 'com.dearmydays.premium.yearly',    // ₩49,000/년 (자동 갱신 구독)
  EVENT_SLOT: 'com.dearmydays.event.slot',            // ₩1,900 (소모품 단건 구매)
}
```

**상품 유형:**
| 상품 | 유형 | iOS | Android |
|------|------|-----|---------|
| 월간 프리미엄 | 자동 갱신 구독 | Auto-Renewable Subscription | 정기 결제 (Subscription) |
| 연간 프리미엄 | 자동 갱신 구독 | Auto-Renewable Subscription | 정기 결제 (Subscription) |
| 이벤트 슬롯 | 소모품 (단건) | Consumable | 인앱 상품 (One-time product) |

## 1. iOS 설정 (Apple)

### 1단계: App Store Connect 설정

1. [App Store Connect](https://appstoreconnect.apple.com) 접속
2. 앱 선택 → **인앱 구입** 메뉴
3. **+** 버튼을 클릭하여 새 구독 생성

**구독 상품 설정 (월간/연간):**
- 상품 ID: `com.dearmydays.premium.monthly` / `com.dearmydays.premium.yearly`
- 유형: **자동 갱신 구독**
- 구독 그룹: "Premium Subscriptions" 생성
- 기간: 1개월 / 1년
- 가격: ₩4,900 / ₩49,000
- 현지화: 한국어 및 영어 설명 추가

**소모품 상품 설정 (이벤트 슬롯):**
- 상품 ID: `com.dearmydays.event.slot`
- 유형: **소모품 (Consumable)**
- 가격: ₩1,900
- 설명: "이벤트 등록 슬롯 1개 추가"
- 현지화: 한국어 및 영어 설명 추가

4. 영수증 검증용 **Shared Secret** 생성:
   - App Store Connect → 앱 → 인앱 구입 → 앱별 공유 암호
   - 생성 후 저장

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
                    "com.dearmydays.premium.yearly",
                    "com.dearmydays.event.slot"
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
                call.reject("상품 조회 실패: \\(error)")
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("상품 ID가 필요합니다")
            return
        }

        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.reject("상품을 찾을 수 없습니다")
                    return
                }

                let result = try await product.purchase()

                switch result {
                case .success(let verification):
                    let transaction = try checkVerified(verification)

                    // 영수증 가져오기
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
                    call.reject("사용자가 취소했습니다")

                case .pending:
                    call.reject("구매 대기 중")

                @unknown default:
                    call.reject("알 수 없는 결과")
                }
            } catch {
                call.reject("구매 실패: \\(error)")
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
                call.reject("복원 실패: \\(error)")
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
    // iOS IAP 설정
  }
}
```

### 4단계: 테스트

1. **Sandbox 테스트:**
   - App Store Connect에서 Sandbox 테스터 계정 생성
   - 디바이스에서 실제 Apple ID 로그아웃
   - 구매 시 Sandbox 계정으로 로그인

2. **테스트 플로우:**
   ```bash
   pnpm dev:ios
   # /settings/subscription으로 이동
   # "구독하기" 클릭
   # StoreKit 결제 시트가 표시되어야 함
   ```

## 2. Android 설정 (Google Play)

### 1단계: Google Play Console 설정

1. [Google Play Console](https://play.google.com/console) 접속
2. 앱 선택 → **수익 창출 설정** → **제품**

#### 정기 결제 (Subscription) 설정

3. **정기 결제** 탭 → **정기 결제 만들기**

**월간 구독 설정:**
- 상품 ID: `com.dearmydays.premium.monthly`
- 이름: Premium Monthly
- 설명: 월간 프리미엄 구독
- 기본 요금제 추가:
  - 요금제 ID: `monthly-plan`
  - 결제 주기: 1개월
  - 가격: ₩4,900

**연간 구독 설정:**
- 상품 ID: `com.dearmydays.premium.yearly`
- 이름: Premium Yearly
- 설명: 연간 프리미엄 구독 (2개월 무료)
- 기본 요금제 추가:
  - 요금제 ID: `yearly-plan`
  - 결제 주기: 1년
  - 가격: ₩49,000

#### 인앱 상품 (One-time product) 설정

4. **인앱 상품** 탭 → **상품 만들기**

**이벤트 슬롯 설정:**
- 상품 ID: `com.dearmydays.event.slot`
- 이름: 이벤트 슬롯 추가
- 설명: 이벤트 등록 슬롯 1개 추가
- 기본 가격: ₩1,900
- **참고:** 소모품(Consumable)이므로 사용자가 여러 번 구매 가능

### 2단계: 서비스 계정 설정

1. **Google Cloud Console:**
   - IAM 및 관리자 → 서비스 계정
   - 앱용 서비스 계정 생성
   - "소유자" 또는 "편집자" 역할 부여
   - JSON 키 생성 후 다운로드

2. **Play Console에 연결:**
   - Play Console → 설정 → API 액세스
   - 서비스 계정 연결
   - "재무 데이터 보기" 권한 부여

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
                    // 준비 완료
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                // 재연결 시도
            }
        });
    }

    @PluginMethod
    public void getProducts(PluginCall call) {
        JSArray allProducts = new JSArray();

        // 1. 구독 상품 조회 (SUBS)
        List<QueryProductDetailsParams.Product> subsList = Arrays.asList(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId("com.dearmydays.premium.monthly")
                .setProductType(BillingClient.ProductType.SUBS)
                .build(),
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId("com.dearmydays.premium.yearly")
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        );

        // 2. 인앱 상품 조회 (INAPP)
        List<QueryProductDetailsParams.Product> inappList = Arrays.asList(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId("com.dearmydays.event.slot")
                .setProductType(BillingClient.ProductType.INAPP)
                .build()
        );

        // 구독 상품 조회
        QueryProductDetailsParams subsParams = QueryProductDetailsParams.newBuilder()
            .setProductList(subsList)
            .build();

        billingClient.queryProductDetailsAsync(subsParams, (billingResult, productDetailsList) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                for (ProductDetails details : productDetailsList) {
                    JSObject product = new JSObject();
                    product.put("id", details.getProductId());
                    product.put("title", details.getTitle());
                    product.put("description", details.getDescription());
                    product.put("type", "SUBS");

                    // 구독 상품은 SubscriptionOfferDetails에서 가격 가져옴
                    ProductDetails.SubscriptionOfferDetails offer =
                        details.getSubscriptionOfferDetails().get(0);
                    ProductDetails.PricingPhase phase =
                        offer.getPricingPhases().getPricingPhaseList().get(0);

                    product.put("price", phase.getFormattedPrice());
                    product.put("priceValue", phase.getPriceAmountMicros() / 1000000);
                    allProducts.put(product);
                }
            }

            // 인앱 상품 조회
            QueryProductDetailsParams inappParams = QueryProductDetailsParams.newBuilder()
                .setProductList(inappList)
                .build();

            billingClient.queryProductDetailsAsync(inappParams, (inappResult, inappDetailsList) -> {
                if (inappResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    for (ProductDetails details : inappDetailsList) {
                        JSObject product = new JSObject();
                        product.put("id", details.getProductId());
                        product.put("title", details.getTitle());
                        product.put("description", details.getDescription());
                        product.put("type", "INAPP");

                        // 인앱 상품은 OneTimePurchaseOfferDetails에서 가격 가져옴
                        ProductDetails.OneTimePurchaseOfferDetails oneTime =
                            details.getOneTimePurchaseOfferDetails();
                        if (oneTime != null) {
                            product.put("price", oneTime.getFormattedPrice());
                            product.put("priceValue", oneTime.getPriceAmountMicros() / 1000000);
                        }

                        allProducts.put(product);
                    }
                }

                JSObject result = new JSObject();
                result.put("products", allProducts);
                call.resolve(result);
            });
        });
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId");
        if (productId == null) {
            call.reject("상품 ID가 필요합니다");
            return;
        }

        // 상품 유형 판별
        boolean isSubscription = productId.contains("premium");
        String productType = isSubscription
            ? BillingClient.ProductType.SUBS
            : BillingClient.ProductType.INAPP;

        List<QueryProductDetailsParams.Product> productList = Arrays.asList(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(productType)
                .build()
        );

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(productList)
            .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsList) -> {
            if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK
                || productDetailsList.isEmpty()) {
                call.reject("상품을 찾을 수 없습니다");
                return;
            }

            ProductDetails productDetails = productDetailsList.get(0);

            BillingFlowParams.ProductDetailsParams.Builder detailsParamsBuilder =
                BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(productDetails);

            // 구독 상품은 offerToken이 필요
            if (isSubscription && productDetails.getSubscriptionOfferDetails() != null) {
                detailsParamsBuilder.setOfferToken(
                    productDetails.getSubscriptionOfferDetails().get(0).getOfferToken()
                );
            }

            BillingFlowParams billingFlowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(Arrays.asList(detailsParamsBuilder.build()))
                .build();

            billingClient.launchBillingFlow(getActivity(), billingFlowParams);
            // 결과는 purchaseUpdatedListener에서 처리
        });
    }

    @PluginMethod
    public void restore(PluginCall call) {
        JSArray allPurchases = new JSArray();

        // 1. 구독 구매 내역 조회
        QueryPurchasesParams subsParams = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.SUBS)
            .build();

        billingClient.queryPurchasesAsync(subsParams, (subsResult, subsPurchases) -> {
            if (subsResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                for (Purchase purchase : subsPurchases) {
                    JSObject p = new JSObject();
                    p.put("purchaseToken", purchase.getPurchaseToken());
                    p.put("productId", purchase.getProducts().get(0));
                    p.put("type", "SUBS");
                    allPurchases.put(p);
                }
            }

            // 2. 인앱 상품 구매 내역 조회
            QueryPurchasesParams inappParams = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build();

            billingClient.queryPurchasesAsync(inappParams, (inappResult, inappPurchases) -> {
                if (inappResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    for (Purchase purchase : inappPurchases) {
                        JSObject p = new JSObject();
                        p.put("purchaseToken", purchase.getPurchaseToken());
                        p.put("productId", purchase.getProducts().get(0));
                        p.put("type", "INAPP");
                        allPurchases.put(p);
                    }
                }

                JSObject result = new JSObject();
                result.put("purchases", allPurchases);
                call.resolve(result);
            });
        });
    }

    private PurchaseUpdatedListener purchaseUpdatedListener =
        (billingResult, purchases) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK
                && purchases != null) {
                for (Purchase purchase : purchases) {
                    // 구매 토큰을 서버로 전송하여 검증
                    JSObject purchaseData = new JSObject();
                    purchaseData.put("purchaseToken", purchase.getPurchaseToken());
                    purchaseData.put("productId", purchase.getProducts().get(0));
                    purchaseData.put("transactionId", purchase.getOrderId());

                    notifyListeners("purchaseCompleted", purchaseData);

                    // 소모품(INAPP)인 경우 소비 처리 필요
                    if (!purchase.getProducts().get(0).contains("premium")) {
                        ConsumeParams consumeParams = ConsumeParams.newBuilder()
                            .setPurchaseToken(purchase.getPurchaseToken())
                            .build();
                        billingClient.consumeAsync(consumeParams, (result, token) -> {
                            // 소비 완료 - 사용자가 다시 구매 가능
                        });
                    } else {
                        // 구독은 승인 처리
                        AcknowledgePurchaseParams ackParams =
                            AcknowledgePurchaseParams.newBuilder()
                                .setPurchaseToken(purchase.getPurchaseToken())
                                .build();
                        if (!purchase.isAcknowledged()) {
                            billingClient.acknowledgePurchase(ackParams, ackResult -> {
                                // 승인 완료
                            });
                        }
                    }
                }
            }
        };
}
```

### 5단계: 테스트

1. **라이선스 테스터 설정:**
   - Play Console → **설정** → **라이선스 테스트**
   - 테스트용 Google 계정 이메일 추가
   - 해당 계정으로 실제 결제 없이 테스트 구매 가능

2. **구독 테스트:**
   ```bash
   pnpm dev:android
   # /settings/subscription으로 이동
   # "월간 구독" 또는 "연간 구독" 클릭
   # Google Play 결제 다이얼로그가 표시되어야 함
   # 테스트 카드로 결제 → 서버 검증 로그 확인
   ```

3. **이벤트 슬롯 (소모품) 테스트:**
   ```bash
   pnpm dev:android
   # /settings/subscription으로 이동
   # "이벤트 슬롯 추가" 클릭
   # Google Play 결제 다이얼로그가 표시되어야 함
   # 결제 완료 후:
   #   - 소비(consume) 처리가 되었는지 확인
   #   - user_plans.extra_event_slots가 증가했는지 확인
   #   - 동일 상품을 다시 구매할 수 있는지 확인 (소모품)
   ```

4. **주의사항:**
   - 인앱 상품은 Play Console에 등록 후 **활성화까지 최대 24시간** 소요
   - 앱이 내부 테스트 트랙 이상에 **한 번 이상 업로드**되어야 결제 테스트 가능
   - 소모품은 `consumeAsync()` 호출 후에만 재구매 가능

## 3. 전체 플로우 테스트

### 웹 테스트 (Mock)
```bash
pnpm dev
# http://localhost:3000/settings/subscription 접속
# Mock 가격이 포함된 상품 목록이 표시되어야 함
# "구독하기" 클릭 시 에러 표시 (웹에서는 IAP 불가)
```

### iOS 테스트
```bash
pnpm dev:ios
# Sandbox Apple ID 사용
# 구매 완료
# 영수증 검증 로그 확인
```

### Android 테스트
```bash
pnpm dev:android
# 라이선스 테스터 계정 사용
# 구매 완료
# 토큰 검증 로그 확인
```

## 4. 프로덕션 배포

### iOS
1. IAP가 설정된 상태로 앱 심사 제출
2. 모든 상품 ID가 승인되었는지 확인
3. 출시 전 TestFlight으로 테스트
4. App Store Connect에서 구독 모니터링

### Android
1. Play Console에서 구독 상품 활성화
2. 내부/비공개 테스트 트랙에서 테스트
3. 프로덕션 릴리스 제출
4. Play Console에서 구독 모니터링

## 5. 구독 관리

### 사용자 해지

**iOS:**
- 사용자가 설정 앱 → Apple ID → 구독에서 해지
- 앱에서 프로그래밍 방식으로 구독 해지 불가
- 사용자를 설정으로 안내하는 UI 구현

**Android:**
- 사용자가 Google Play 스토어 → 구독에서 해지
- 구독 관리 페이지로 딥링크 가능:
  ```kotlin
  val intent = Intent(Intent.ACTION_VIEW)
  intent.data = Uri.parse("https://play.google.com/store/account/subscriptions")
  startActivity(intent)
  ```

### 구독 상태 확인

- `/api/iap/subscription`을 주기적으로 폴링
- 사용자에게 만료일 표시
- 유예 기간 처리 (결제 재시도)
- 갱신일 표시

### 영수증 검증

- **항상 서버에서 영수증 검증**
- 클라이언트 측 검증을 신뢰하지 말 것
- 재전송 공격 방지를 위해 트랜잭션 ID 저장
- 만료된 구독을 우아하게 처리

## 6. 보안 모범 사례

- ✅ 시크릿을 환경 변수에 저장 (코드에 포함 금지)
- ✅ 모든 영수증을 서버에서 검증
- ✅ 모든 API 호출에 HTTPS 사용
- ✅ 멱등성 구현 (중복 트랜잭션 확인)
- ✅ 사기 탐지를 위해 모든 구매 시도 로깅
- ❌ Apple Shared Secret을 클라이언트에 노출 금지
- ❌ Google 서비스 계정 자격증명을 클라이언트에 노출 금지
- ❌ 서버 측 검증을 건너뛰지 말 것

## 7. 일반적인 문제

### iOS: "iTunes Store에 연결할 수 없습니다"
- Sandbox 환경 설정 확인
- Sandbox 테스터 계정 검증
- 앱이 개발 인증서로 서명되었는지 확인

### iOS: "영수증 검증 실패"
- `APPLE_SHARED_SECRET`이 올바른지 확인
- 상태 코드가 21007이면 Sandbox URL 시도
- 영수증 데이터가 base64 인코딩되었는지 확인

### Android: "상품을 사용할 수 없습니다"
- Play Console에서 상품 활성화 확인
- 활성화 후 24시간 대기
- 앱 버전이 Play Console과 일치하는지 확인

### Android: "구매 정보를 조회할 수 없습니다"
- Play Console API 액세스 확인
- 서비스 계정 권한 검증
- Billing 라이브러리가 올바르게 초기화되었는지 확인

### 공통: "이미 처리된 트랜잭션"
- 정상 동작 (이중 결제 방지)
- 정상적인 복원인 경우 user_plans만 업데이트

## 8. 참고 자료

- [Apple StoreKit 2](https://developer.apple.com/storekit/)
- [Google Play Billing](https://developer.android.com/google/play/billing)
- [App Store Server API](https://developer.apple.com/documentation/appstoreserverapi)
- [Google Play Developer API](https://developers.google.com/android-publisher)
- [Capacitor 문서](https://capacitorjs.com/docs)

## 9. 다음 단계

IAP 구현을 완료하려면:

1. 네이티브 코드 구현 (iOS Swift + Android Java)
2. Capacitor에 네이티브 플러그인 등록
3. `libs/capacitor/iap.ts`를 네이티브 메서드 호출로 업데이트
4. Sandbox/테스트 계정으로 테스트
5. App Store Connect / Play Console에서 상품 설정
6. 환경 변수 추가
7. 프로덕션에 배포 후 테스트

**예상 소요 시간:** 8-12시간 (Phase 4 계획 기준)
