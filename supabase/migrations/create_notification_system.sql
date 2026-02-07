-- Notification Scheduling System
-- Run this in Supabase SQL Editor

-- 1. Create notification_logs table (if not exists)
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILED')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_event_date
  ON notification_logs(event_id, DATE(sent_at));

CREATE INDEX IF NOT EXISTS idx_notification_logs_user
  ON notification_logs(user_id, sent_at DESC);

-- 3. Create function to get pending notifications
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

-- 4. Enable Row Level Security (RLS) on notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for notification_logs
CREATE POLICY "Users can view their own notification logs"
  ON notification_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notification logs"
  ON notification_logs
  FOR INSERT
  WITH CHECK (true);

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON notification_logs TO postgres, service_role;
GRANT SELECT ON notification_logs TO authenticated;

-- 7. Comment on function
COMMENT ON FUNCTION get_pending_notifications IS
  'Returns list of notifications that need to be sent based on current time';

-- 8. Test the function (optional)
-- SELECT * FROM get_pending_notifications(9, 0);
