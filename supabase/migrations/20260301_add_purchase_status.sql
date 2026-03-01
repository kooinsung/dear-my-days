-- 환불 처리를 위한 purchase status 및 관련 컬럼 추가
-- 작성일: 2026-03-01

-- 1. purchase_status enum 생성
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_status') THEN
    CREATE TYPE purchase_status AS ENUM ('COMPLETED', 'REFUNDED');
  END IF;
END $$;

-- 2. event_purchases에 status, refunded_at 컬럼 추가
ALTER TABLE event_purchases
ADD COLUMN IF NOT EXISTS status purchase_status NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

COMMENT ON COLUMN event_purchases.status IS '구매 상태: COMPLETED(완료) 또는 REFUNDED(환불됨)';
COMMENT ON COLUMN event_purchases.refunded_at IS '환불 처리 시각';

-- 3. 이벤트 슬롯 감소 함수 (환불 시 사용, 0 미만 방지)
CREATE OR REPLACE FUNCTION decrement_event_slots(
  user_id_param UUID,
  decrement_by INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_plans
  SET extra_event_slots = GREATEST(extra_event_slots - decrement_by, 0)
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION decrement_event_slots IS '사용자의 추가 이벤트 슬롯 감소 (환불 시 사용, 0 미만 방지)';

-- 4. service_role UPDATE 정책 추가 (환불 처리용)
DROP POLICY IF EXISTS "Service role can update purchases" ON event_purchases;
CREATE POLICY "Service role can update purchases"
  ON event_purchases
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 5. 권한 부여
GRANT EXECUTE ON FUNCTION decrement_event_slots TO service_role;

-- 6. 환불 상태 인덱스 (환불 기록 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_event_purchases_status ON event_purchases(status);
