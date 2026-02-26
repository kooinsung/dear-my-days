-- Update get_pending_notifications to return days_before and category
-- for better notification message formatting

DROP FUNCTION IF EXISTS get_pending_notifications(INT, INT);

CREATE OR REPLACE FUNCTION get_pending_notifications(
  current_hour INT,
  current_minute INT
)
RETURNS TABLE (
  user_id UUID,
  event_id UUID,
  event_title TEXT,
  event_category TEXT,
  days_before INT,
  device_tokens JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.user_id,
    e.id AS event_id,
    e.title AS event_title,
    e.category::TEXT AS event_category,
    ens.days_before,
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
    AND nl.sent_at >= CURRENT_DATE
    AND nl.sent_at < CURRENT_DATE + INTERVAL '1 day'
    AND nl.status = 'SUCCESS'
  )
  WHERE
    e.solar_date::date - ens.days_before = CURRENT_DATE
    AND ens.notification_hour = current_hour
    AND ens.notification_minute = current_minute
    AND nl.id IS NULL
  GROUP BY e.user_id, e.id, e.title, e.category, ens.days_before;
END;
$$ LANGUAGE plpgsql;
