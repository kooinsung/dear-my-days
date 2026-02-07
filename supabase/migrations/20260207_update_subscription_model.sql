-- 구독 + 단건 구매 모델 업데이트
-- 작성일: 2026-02-07

-- 1. plan_type enum 업데이트
-- 기존: FREE | PRO
-- 변경: FREE | PREMIUM_MONTHLY | PREMIUM_YEARLY

ALTER TYPE plan_type RENAME TO plan_type_old;

CREATE TYPE plan_type AS ENUM (
  'FREE',
  'PREMIUM_MONTHLY',
  'PREMIUM_YEARLY'
);

-- 기존 데이터 마이그레이션 (PRO -> PREMIUM_MONTHLY)
ALTER TABLE user_plans
  ALTER COLUMN plan_type TYPE plan_type
  USING (
    CASE
      WHEN plan_type::text = 'PRO' THEN 'PREMIUM_MONTHLY'::plan_type
      ELSE plan_type::text::plan_type
    END
  );

DROP TYPE plan_type_old;

-- 2. user_plans 테이블에 추가 이벤트 슬롯 컬럼 추가
ALTER TABLE user_plans
ADD COLUMN IF NOT EXISTS extra_event_slots INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN user_plans.extra_event_slots IS '단건 구매로 추가된 이벤트 슬롯 수 (FREE 플랜 사용자용)';

-- 3. purchase_type enum 생성
CREATE TYPE purchase_type AS ENUM (
  'SUBSCRIPTION',
  'EVENT_SLOT'
);

-- 4. event_purchases 테이블 업데이트
ALTER TABLE event_purchases
ADD COLUMN IF NOT EXISTS purchase_type purchase_type NOT NULL DEFAULT 'SUBSCRIPTION',
ADD COLUMN IF NOT EXISTS transaction_id TEXT,
ADD COLUMN IF NOT EXISTS product_id TEXT;

-- transaction_id에 unique 제약 조건 추가 (중복 처리 방지)
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_purchases_transaction_id
ON event_purchases(transaction_id)
WHERE transaction_id IS NOT NULL;

COMMENT ON COLUMN event_purchases.purchase_type IS '구매 유형: 구독(SUBSCRIPTION) 또는 이벤트 슬롯(EVENT_SLOT)';
COMMENT ON COLUMN event_purchases.transaction_id IS 'Apple/Google 트랜잭션 ID (중복 방지용)';
COMMENT ON COLUMN event_purchases.product_id IS '구매한 상품 ID (예: com.dearmydays.premium.monthly)';

-- 5. 이벤트 슬롯 체크 함수 생성
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

COMMENT ON FUNCTION get_user_event_limit IS '사용자의 이벤트 등록 가능 개수 반환 (FREE: 3+추가슬롯, PREMIUM: 무제한)';

-- 11. 이벤트 슬롯 증가 함수 (단건 구매 시)
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

COMMENT ON FUNCTION increment_event_slots IS '사용자의 추가 이벤트 슬롯 증가 (단건 구매 시 사용)';

-- 6. 이벤트 생성 시 제한 체크 함수
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
    RAISE EXCEPTION '이벤트 등록 제한을 초과했습니다. 현재: %, 제한: %', current_count, event_limit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. 이벤트 생성 시 트리거 추가
DROP TRIGGER IF EXISTS enforce_event_limit ON events;
CREATE TRIGGER enforce_event_limit
  BEFORE INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION check_event_limit();

-- 8. RLS 정책 업데이트 (event_purchases)
ALTER TABLE event_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own purchases" ON event_purchases;
CREATE POLICY "Users can view their own purchases"
  ON event_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert purchases" ON event_purchases;
CREATE POLICY "Service role can insert purchases"
  ON event_purchases
  FOR INSERT
  WITH CHECK (true);

-- 9. 권한 부여
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON event_purchases TO postgres, service_role;
GRANT SELECT ON event_purchases TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_event_limit TO authenticated;

-- 10. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_event_purchases_user_id ON event_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_event_purchases_purchase_type ON event_purchases(purchase_type);
CREATE INDEX IF NOT EXISTS idx_user_plans_plan_type ON user_plans(plan_type);
