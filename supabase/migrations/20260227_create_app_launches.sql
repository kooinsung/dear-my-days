CREATE TABLE IF NOT EXISTS app_launches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  device_model TEXT,
  os_version TEXT,
  app_version TEXT,
  launched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_launches ENABLE ROW LEVEL SECURITY;
