-- 올해 발생일이 지난 이벤트의 알림 설정 및 발송 로그 자동 정리
-- 매일 KST 자정(UTC 15:00)에 실행

-- 1. 정리 함수 생성
CREATE OR REPLACE FUNCTION cleanup_past_notifications()
RETURNS TABLE (
  deleted_settings BIGINT,
  deleted_logs BIGINT
) AS $$
DECLARE
  kst_today DATE := (NOW() AT TIME ZONE 'Asia/Seoul')::date;
  current_year INT := EXTRACT(YEAR FROM kst_today);
  settings_count BIGINT;
  logs_count BIGINT;
BEGIN
  -- 올해 발생일이 지난 이벤트의 알림 설정 삭제
  WITH past_events AS (
    SELECT id FROM events
    WHERE make_date(
      current_year,
      EXTRACT(MONTH FROM solar_date)::INT,
      EXTRACT(DAY FROM solar_date)::INT
    ) < kst_today
  )
  DELETE FROM event_notification_settings
  WHERE event_id IN (SELECT id FROM past_events);

  GET DIAGNOSTICS settings_count = ROW_COUNT;

  -- 올해 발생일이 지난 이벤트의 발송 로그 삭제
  WITH past_events AS (
    SELECT id FROM events
    WHERE make_date(
      current_year,
      EXTRACT(MONTH FROM solar_date)::INT,
      EXTRACT(DAY FROM solar_date)::INT
    ) < kst_today
  )
  DELETE FROM notification_logs
  WHERE event_id IN (SELECT id FROM past_events);

  GET DIAGNOSTICS logs_count = ROW_COUNT;

  RETURN QUERY SELECT settings_count, logs_count;
END;
$$ LANGUAGE plpgsql;

-- 2. pg_cron 스케줄 등록 (매일 UTC 15:00 = KST 자정)
-- 주의: pg_cron 확장이 활성화되어 있어야 합니다
-- SELECT cron.schedule(
--   'cleanup-past-notifications',
--   '0 15 * * *',
--   $$SELECT * FROM cleanup_past_notifications()$$
-- );
