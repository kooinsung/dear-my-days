-- 1. CASCADE DELETE: event_purchases.user_id
ALTER TABLE event_purchases DROP CONSTRAINT IF EXISTS event_purchases_user_id_fkey;
ALTER TABLE event_purchases
  ADD CONSTRAINT event_purchases_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. CASCADE DELETE: user_plans.user_id
ALTER TABLE user_plans DROP CONSTRAINT IF EXISTS user_plans_user_id_fkey;
ALTER TABLE user_plans
  ADD CONSTRAINT user_plans_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. event_purchases: 환불 관련 컬럼 + purchase_token 추가
ALTER TABLE event_purchases
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS purchase_token TEXT;

CREATE INDEX IF NOT EXISTS idx_event_purchases_purchase_token
ON event_purchases(purchase_token) WHERE purchase_token IS NOT NULL;

-- 4. 프리미엄 월별 제한을 포함하는 이벤트 제한 체크 트리거 함수
CREATE OR REPLACE FUNCTION check_event_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  event_limit INTEGER;
  user_plan_type TEXT;
  subscription_started TIMESTAMPTZ;
  extra_slots INTEGER;
  months_elapsed INTEGER;
BEGIN
  SELECT plan_type, started_at, extra_event_slots
  INTO user_plan_type, subscription_started, extra_slots
  FROM user_plans WHERE user_id = NEW.user_id;

  IF user_plan_type IS NULL OR user_plan_type = 'FREE' THEN
    -- FREE: 전체 이벤트 카운트, 제한 = 3 + extra_slots
    SELECT COUNT(*) INTO current_count FROM events WHERE user_id = NEW.user_id;
    event_limit := 3 + COALESCE(extra_slots, 0);
  ELSE
    -- PREMIUM: 구독 시작 이후 이벤트 카운트, 제한 = 경과월 x 10
    SELECT COUNT(*) INTO current_count FROM events
    WHERE user_id = NEW.user_id AND created_at >= subscription_started;

    months_elapsed := GREATEST(
      (EXTRACT(YEAR FROM age(NOW(), subscription_started)) * 12 +
       EXTRACT(MONTH FROM age(NOW(), subscription_started)))::INTEGER + 1,
      1
    );
    event_limit := months_elapsed * 10;
  END IF;

  IF current_count >= event_limit THEN
    RAISE EXCEPTION 'event_limit_exceeded: current=%, limit=%',
      current_count, event_limit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. get_user_event_limit() 외부 호출용 함수 업데이트 (반환 타입 변경으로 DROP 필요)
DROP FUNCTION IF EXISTS get_user_event_limit(UUID);
CREATE FUNCTION get_user_event_limit(p_user_id UUID)
RETURNS TABLE(event_count INTEGER, event_limit INTEGER) AS $$
DECLARE
  user_plan_type TEXT;
  subscription_started TIMESTAMPTZ;
  extra_slots INTEGER;
  months_elapsed INTEGER;
  cnt INTEGER;
  lim INTEGER;
BEGIN
  SELECT plan_type, started_at, extra_event_slots
  INTO user_plan_type, subscription_started, extra_slots
  FROM user_plans WHERE user_id = p_user_id;

  IF user_plan_type IS NULL OR user_plan_type = 'FREE' THEN
    SELECT COUNT(*) INTO cnt FROM events WHERE user_id = p_user_id;
    lim := 3 + COALESCE(extra_slots, 0);
  ELSE
    SELECT COUNT(*) INTO cnt FROM events
    WHERE user_id = p_user_id AND created_at >= subscription_started;

    months_elapsed := GREATEST(
      (EXTRACT(YEAR FROM age(NOW(), subscription_started)) * 12 +
       EXTRACT(MONTH FROM age(NOW(), subscription_started)))::INTEGER + 1,
      1
    );
    lim := months_elapsed * 10;
  END IF;

  event_count := cnt;
  event_limit := lim;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. service_role용 RLS 정책 (event_purchases UPDATE)
DROP POLICY IF EXISTS "Service role can update purchases" ON event_purchases;
CREATE POLICY "Service role can update purchases"
  ON event_purchases FOR UPDATE WITH CHECK (true);
