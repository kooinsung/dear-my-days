# Database Schema Diagram

## 목차
- [테이블 개요](#테이블-개요)
- [Custom Types (Enums)](#custom-types-enums)
- [테이블 상세 정의](#테이블-상세-정의)
- [주요 함수](#주요-함수)

## 테이블 개요

### 핵심 테이블

#### `events`
사용자가 등록한 이벤트 (생일, 기념일, 기일 등)를 저장합니다.

#### `event_notification_settings`
이벤트별 알림 스케줄 설정 (사용자가 동적으로 추가/삭제 가능).

#### `user_providers`
한 사용자가 여러 OAuth 프로바이더를 연결할 수 있습니다.

### 지원 테이블

#### `user_plans`
사용자의 구독 플랜 정보 (FREE, PREMIUM_MONTHLY, PREMIUM_YEARLY)와 추가 이벤트 슬롯을 저장합니다.

#### `event_purchases`
인앱결제 구매 내역 (구독 또는 이벤트 슬롯)을 저장합니다.

#### `device_tokens`
푸시 알림을 위한 디바이스 토큰을 저장합니다.

#### `notification_logs`
푸시 알림 발송 이력을 저장합니다 (중복 발송 방지).

## Custom Types (Enums)

### `category_type`
이벤트 카테고리

```sql
CREATE TYPE category_type AS ENUM (
  'BIRTHDAY',      -- 생일
  'ANNIVERSARY',   -- 기념일
  'MEMORIAL',      -- 기일
  'HOLIDAY',       -- 공휴일
  'OTHER'          -- 기타
);
```

### `calendar_type`
달력 타입

```sql
CREATE TYPE calendar_type AS ENUM (
  'SOLAR',   -- 양력
  'LUNAR'    -- 음력
);
```

### `plan_type`
사용자 구독 플랜

```sql
CREATE TYPE plan_type AS ENUM (
  'FREE',              -- 무료 (이벤트 3개 + 추가 슬롯)
  'PREMIUM_MONTHLY',   -- 프리미엄 월간 (무제한)
  'PREMIUM_YEARLY'     -- 프리미엄 연간 (무제한)
);
```

### `purchase_type`
구매 타입

```sql
CREATE TYPE purchase_type AS ENUM (
  'SUBSCRIPTION',   -- 구독 (월간/연간)
  'EVENT_SLOT'      -- 이벤트 슬롯 단건 구매
);
```

### `payment_provider`
결제 제공자

```sql
CREATE TYPE payment_provider AS ENUM (
  'APPLE',    -- Apple In-App Purchase
  'GOOGLE',   -- Google Play Billing
  'STRIPE'    -- Stripe (웹 결제, 향후 지원)
);
```

### `auth_provider`
OAuth 인증 제공자

```sql
CREATE TYPE auth_provider AS ENUM (
  'email',   -- 이메일/비밀번호
  'google',  -- Google OAuth
  'kakao',   -- Kakao OAuth
  'naver',   -- Naver OAuth
  'apple'    -- Apple Sign In
);
```

## 테이블 상세 정의

### `events`
사용자 이벤트 정보

```sql
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category category_type NOT NULL,
  title TEXT NOT NULL,
  note TEXT NULL,
  calendar_type calendar_type NOT NULL DEFAULT 'SOLAR',
  solar_date DATE NOT NULL,
  lunar_date DATE NULL,
  is_leap_month BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_solar_date ON events(solar_date);
CREATE INDEX idx_events_category ON events(category);

-- RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events"
  ON events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events"
  ON events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
  ON events FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
  ON events FOR DELETE USING (auth.uid() = user_id);
```

### `user_plans`
사용자 구독 플랜

```sql
CREATE TABLE public.user_plans (
  user_id UUID NOT NULL,
  plan_type plan_type NOT NULL DEFAULT 'FREE',
  started_at TIMESTAMPTZ NULL DEFAULT NOW(),
  expired_at TIMESTAMPTZ NULL,
  extra_event_slots INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT user_plans_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_plans_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_user_plans_plan_type ON user_plans(plan_type);

-- 코멘트
COMMENT ON COLUMN user_plans.extra_event_slots IS
  '단건 구매로 추가된 이벤트 슬롯 수 (FREE 플랜 사용자용)';
```

### `event_purchases`
인앱결제 구매 내역

```sql
CREATE TABLE public.event_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider payment_provider NOT NULL,
  transaction_id TEXT NULL,
  product_id TEXT NULL,
  purchase_type purchase_type NOT NULL DEFAULT 'SUBSCRIPTION',
  amount INTEGER NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'KRW',
  purchased_at TIMESTAMPTZ NOT NULL,

  CONSTRAINT event_purchases_pkey PRIMARY KEY (id),
  CONSTRAINT event_purchases_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_event_purchases_user_id ON event_purchases(user_id);
CREATE INDEX idx_event_purchases_purchase_type ON event_purchases(purchase_type);

-- transaction_id unique 제약 (중복 처리 방지)
CREATE UNIQUE INDEX idx_event_purchases_transaction_id
  ON event_purchases(transaction_id)
  WHERE transaction_id IS NOT NULL;

-- RLS
ALTER TABLE event_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases"
  ON event_purchases FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert purchases"
  ON event_purchases FOR INSERT WITH CHECK (true);

-- 코멘트
COMMENT ON COLUMN event_purchases.purchase_type IS
  '구매 유형: 구독(SUBSCRIPTION) 또는 이벤트 슬롯(EVENT_SLOT)';
COMMENT ON COLUMN event_purchases.transaction_id IS
  'Apple/Google 트랜잭션 ID (중복 방지용)';
COMMENT ON COLUMN event_purchases.product_id IS
  '구매한 상품 ID (예: com.dearmydays.premium.monthly)';
```

### `device_tokens`
푸시 알림 디바이스 토큰

```sql
CREATE TABLE public.device_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ NULL DEFAULT NOW(),

  CONSTRAINT device_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT device_tokens_token_key UNIQUE (token),
  CONSTRAINT device_tokens_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);
```

### `event_notification_settings`
이벤트별 알림 스케줄 설정

```sql
CREATE TABLE public.event_notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  days_before INTEGER NOT NULL,
  notification_hour INTEGER NOT NULL,
  notification_minute INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT event_notification_settings_pkey PRIMARY KEY (id),
  CONSTRAINT event_notification_settings_event_id_fkey FOREIGN KEY (event_id)
    REFERENCES events (id) ON DELETE CASCADE,
  CONSTRAINT event_notification_settings_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT valid_hour CHECK (notification_hour >= 0 AND notification_hour <= 23),
  CONSTRAINT valid_minute CHECK (notification_minute >= 0 AND notification_minute <= 59),
  CONSTRAINT valid_days_before CHECK (days_before >= 0 AND days_before <= 365)
);

-- 인덱스
CREATE INDEX idx_event_notification_settings_event
  ON event_notification_settings(event_id);
CREATE INDEX idx_event_notification_settings_user
  ON event_notification_settings(user_id);

-- 중복 방지
CREATE UNIQUE INDEX idx_event_notification_settings_unique
  ON event_notification_settings(event_id, days_before, notification_hour, notification_minute);

-- RLS
ALTER TABLE event_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification settings"
  ON event_notification_settings USING (auth.uid() = user_id);

-- 코멘트
COMMENT ON TABLE event_notification_settings IS
  '이벤트별 알림 스케줄 설정 (사용자가 동적으로 추가/삭제 가능)';
COMMENT ON COLUMN event_notification_settings.days_before IS
  '이벤트 며칠 전 알림 (0 = 당일, 최대 365)';
COMMENT ON COLUMN event_notification_settings.notification_hour IS
  '알림 시간 (0-23시)';
COMMENT ON COLUMN event_notification_settings.notification_minute IS
  '알림 분 (0-59분)';
```

### `notification_logs`
푸시 알림 발송 이력

```sql
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID NOT NULL,
  device_token TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILED')),
  error_message TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT notification_logs_pkey PRIMARY KEY (id),
  CONSTRAINT notification_logs_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT notification_logs_event_id_fkey FOREIGN KEY (event_id)
    REFERENCES events (id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_notification_logs_event_date
  ON notification_logs(event_id, DATE(sent_at));
CREATE INDEX idx_notification_logs_user
  ON notification_logs(user_id, sent_at DESC);

-- RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification logs"
  ON notification_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notification logs"
  ON notification_logs FOR INSERT WITH CHECK (true);
```

### `user_providers`
사용자 OAuth 연동 정보

```sql
CREATE TABLE public.user_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider auth_provider NOT NULL,
  provider_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NULL DEFAULT NOW(),

  CONSTRAINT user_providers_pkey PRIMARY KEY (id),
  CONSTRAINT user_providers_provider_provider_user_id_key
    UNIQUE (provider, provider_user_id),
  CONSTRAINT user_providers_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX idx_user_providers_user_id ON user_providers(user_id);
```

## 주요 함수

### `get_user_event_limit(user_id_param UUID)`
사용자의 이벤트 등록 가능 개수를 반환합니다.

```sql
CREATE OR REPLACE FUNCTION get_user_event_limit(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  user_plan plan_type;
  extra_slots INTEGER;
  event_limit INTEGER;
BEGIN
  -- 사용자 플랜 정보 조회
  SELECT plan_type, extra_event_slots
  INTO user_plan, extra_slots
  FROM user_plans
  WHERE user_id = user_id_param;

  -- 플랜이 없으면 FREE로 간주
  IF user_plan IS NULL THEN
    user_plan := 'FREE';
    extra_slots := 0;
  END IF;

  -- 플랜별 이벤트 제한
  IF user_plan = 'FREE' THEN
    event_limit := 3 + COALESCE(extra_slots, 0);
  ELSE
    -- PREMIUM_MONTHLY 또는 PREMIUM_YEARLY는 무제한
    event_limit := 999999;
  END IF;

  RETURN event_limit;
END;
$$ LANGUAGE plpgsql;
```

**반환값:**
- FREE 플랜: `3 + extra_event_slots`
- PREMIUM 플랜: `999999` (무제한)

### `check_event_limit()`
이벤트 생성 시 제한을 체크하는 트리거 함수입니다.

```sql
CREATE OR REPLACE FUNCTION check_event_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  event_limit INTEGER;
BEGIN
  -- 현재 이벤트 개수 조회
  SELECT COUNT(*) INTO current_count
  FROM events
  WHERE user_id = NEW.user_id;

  -- 사용자의 이벤트 제한 조회
  event_limit := get_user_event_limit(NEW.user_id);

  -- 제한 초과 체크
  IF current_count >= event_limit THEN
    RAISE EXCEPTION '이벤트 등록 제한을 초과했습니다. 현재: %, 제한: %',
      current_count, event_limit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER enforce_event_limit
  BEFORE INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION check_event_limit();
```

### `increment_event_slots(user_id_param UUID, increment_by INTEGER)`
이벤트 슬롯 단건 구매 시 extra_event_slots를 증가시킵니다.

```sql
CREATE OR REPLACE FUNCTION increment_event_slots(
  user_id_param UUID,
  increment_by INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  -- user_plans 레코드가 없으면 생성
  INSERT INTO user_plans (user_id, plan_type, extra_event_slots)
  VALUES (user_id_param, 'FREE', increment_by)
  ON CONFLICT (user_id)
  DO UPDATE SET
    extra_event_slots = user_plans.extra_event_slots + increment_by;
END;
$$ LANGUAGE plpgsql;
```

### `get_pending_notifications(current_hour INT, current_minute INT)`
현재 시간에 발송해야 할 알림 목록을 반환합니다.

```sql
CREATE OR REPLACE FUNCTION get_pending_notifications(
  current_hour INT,
  current_minute INT
)
RETURNS TABLE (
  user_id UUID,
  event_id UUID,
  event_title TEXT,
  device_tokens JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.user_id,
    e.id AS event_id,
    e.title AS event_title,
    jsonb_agg(
      jsonb_build_object(
        'token', dt.token,
        'platform', dt.platform
      )
    ) AS device_tokens
  FROM events e
  INNER JOIN event_notification_settings ens ON e.id = ens.event_id
  INNER JOIN device_tokens dt ON e.user_id = dt.user_id
  LEFT JOIN notification_logs nl ON (
    nl.event_id = e.id
    AND nl.device_token = dt.token
    AND DATE(nl.sent_at) = CURRENT_DATE
    AND nl.status = 'SUCCESS'
  )
  WHERE
    -- 오늘이 알림 발송일 (이벤트 날짜 - days_before)
    DATE(e.solar_date) - ens.days_before = CURRENT_DATE
    -- 설정된 시간/분과 일치
    AND ens.notification_hour = current_hour
    AND ens.notification_minute = current_minute
    -- 오늘 아직 발송하지 않음
    AND nl.id IS NULL
  GROUP BY e.user_id, e.id, e.title;
END;
$$ LANGUAGE plpgsql;
```

**사용 예시:**
```sql
-- 오전 9시 0분에 발송할 알림 조회
SELECT * FROM get_pending_notifications(9, 0);
```

## 마이그레이션 파일

마이그레이션은 다음 순서로 실행해야 합니다:

1. **기본 스키마** (Supabase 프로젝트 생성 시 자동)
   - `events`, `user_plans`, `device_tokens`, `user_providers` 등

2. **`create_event_notification_settings.sql`**
   - `event_notification_settings` 테이블 생성

3. **`create_notification_system.sql`**
   - `notification_logs` 테이블 생성
   - `get_pending_notifications()` 함수 생성

4. **`20260207_update_subscription_model.sql`**
   - `plan_type` enum 업데이트 (FREE | PREMIUM_MONTHLY | PREMIUM_YEARLY)
   - `user_plans`에 `extra_event_slots` 컬럼 추가
   - `purchase_type` enum 생성
   - `event_purchases` 업데이트 (purchase_type, transaction_id, product_id 추가)
   - `get_user_event_limit()`, `check_event_limit()`, `increment_event_slots()` 함수 생성
   - 이벤트 제한 트리거 생성

---

**마지막 업데이트:** 2026-02-07
**버전:** 2.0.0 (Capacitor IAP + 알림 시스템 포함)
