-- Migrate notification settings from days_before + notification_hour + notification_minute
-- to a single minutes_before column (minutes before event date 00:00 KST)

-- 1. Add minutes_before column
ALTER TABLE event_notification_settings
  ADD COLUMN minutes_before INTEGER;

-- 2. Migrate existing data
-- 기존 로직: "D-N일 HH:MM에 발송" → 이벤트 날짜 00:00 기준 역산
-- minutes_before = days_before * 1440 - notification_hour * 60 - notification_minute
-- 예: D-1 09:00 → 1440 - 540 - 0 = 900분 전
-- 예: D-0 09:00 → 0 - 540 - 0 = -540 → 이벤트 당일 "이후"이므로 0으로 설정
UPDATE event_notification_settings
SET minutes_before = GREATEST(
  days_before * 1440 - notification_hour * 60 - notification_minute,
  0
);

-- 3. Set NOT NULL and DEFAULT after migration
ALTER TABLE event_notification_settings
  ALTER COLUMN minutes_before SET NOT NULL,
  ALTER COLUMN minutes_before SET DEFAULT 1440;

-- 4. Add CHECK constraint
ALTER TABLE event_notification_settings
  ADD CONSTRAINT chk_minutes_before CHECK (minutes_before >= 0 AND minutes_before <= 20160);
  -- 20160 = 14 days in minutes (max 2 weeks)

-- 5. Drop old unique constraint and create new one
DROP INDEX IF EXISTS idx_event_notification_settings_unique;
CREATE UNIQUE INDEX idx_event_notification_settings_unique
  ON event_notification_settings(event_id, minutes_before);

-- 6. Drop old columns
ALTER TABLE event_notification_settings
  DROP COLUMN days_before,
  DROP COLUMN notification_hour,
  DROP COLUMN notification_minute;

-- 7. Update comments
COMMENT ON COLUMN event_notification_settings.minutes_before
  IS '이벤트 날짜 00:00 KST 기준 N분 전 알림 (0 = 당일 00:00, 1440 = 1일 전, 10080 = 1주 전)';

-- 8. Rewrite get_pending_notifications function (no parameters, uses NOW())
DROP FUNCTION IF EXISTS get_pending_notifications(INT, INT);

CREATE OR REPLACE FUNCTION get_pending_notifications()
RETURNS TABLE (
  user_id UUID,
  event_id UUID,
  event_title TEXT,
  event_category TEXT,
  minutes_before INT,
  device_tokens JSONB
) AS $$
DECLARE
  kst_now TIMESTAMP := (NOW() AT TIME ZONE 'Asia/Seoul');
  current_year INT := EXTRACT(YEAR FROM kst_now);
BEGIN
  RETURN QUERY
  SELECT
    e.user_id,
    e.id AS event_id,
    e.title AS event_title,
    e.category::TEXT AS event_category,
    ens.minutes_before,
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
    AND nl.sent_at >= kst_now::date
    AND nl.sent_at < kst_now::date + INTERVAL '1 day'
    AND nl.status = 'SUCCESS'
  )
  WHERE
    -- solar_date의 월/일을 올해로 변환 → 00:00 KST 기준 → minutes_before 차감
    -- 현재 KST 시각(분 단위)과 일치하면 발송
    date_trunc('minute',
      make_timestamp(
        current_year,
        EXTRACT(MONTH FROM e.solar_date)::INT,
        EXTRACT(DAY FROM e.solar_date)::INT,
        0, 0, 0
      ) - (ens.minutes_before * INTERVAL '1 minute')
    ) = date_trunc('minute', kst_now)
    AND nl.id IS NULL
  GROUP BY e.user_id, e.id, e.title, e.category, ens.minutes_before;
END;
$$ LANGUAGE plpgsql;
