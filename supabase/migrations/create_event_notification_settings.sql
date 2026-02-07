-- Event Notification Settings Table
-- 이벤트별 알림 스케줄 설정

-- 1. Create event_notification_settings table
CREATE TABLE IF NOT EXISTS event_notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  days_before INTEGER NOT NULL CHECK (days_before >= 0 AND days_before <= 365),
  notification_hour INTEGER NOT NULL CHECK (notification_hour >= 0 AND notification_hour <= 23),
  notification_minute INTEGER NOT NULL CHECK (notification_minute >= 0 AND notification_minute <= 59),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_notification_settings_event
  ON event_notification_settings(event_id);

CREATE INDEX IF NOT EXISTS idx_event_notification_settings_user
  ON event_notification_settings(user_id);

-- 3. Create unique constraint (prevent duplicate schedules)
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_notification_settings_unique
  ON event_notification_settings(event_id, days_before, notification_hour, notification_minute);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE event_notification_settings ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
CREATE POLICY "Users can view their own notification settings"
  ON event_notification_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
  ON event_notification_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
  ON event_notification_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification settings"
  ON event_notification_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON event_notification_settings TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON event_notification_settings TO authenticated;

-- 7. Comments
COMMENT ON TABLE event_notification_settings IS '이벤트별 알림 스케줄 설정 (사용자가 동적으로 추가/삭제 가능)';
COMMENT ON COLUMN event_notification_settings.days_before IS '이벤트 며칠 전 알림 (0 = 당일, 최대 365)';
COMMENT ON COLUMN event_notification_settings.notification_hour IS '알림 시간 (0-23시)';
COMMENT ON COLUMN event_notification_settings.notification_minute IS '알림 분 (0-59분)';
