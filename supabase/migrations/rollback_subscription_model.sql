-- 구독 모델 업데이트 롤백 스크립트
-- 실패한 마이그레이션을 정리합니다

-- 1. plan_type_old가 존재하면 원래대로 복구
DO $$
BEGIN
  -- plan_type_old가 존재하는지 확인
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type_old') THEN
    -- 현재 plan_type 삭제 (만약 생성되었다면)
    DROP TYPE IF EXISTS plan_type CASCADE;

    -- plan_type_old를 다시 plan_type으로 되돌림
    ALTER TYPE plan_type_old RENAME TO plan_type;

    RAISE NOTICE 'Rolled back plan_type_old to plan_type';
  ELSE
    RAISE NOTICE 'plan_type_old does not exist, no rollback needed';
  END IF;
END $$;

-- 2. DEFAULT 값 복구 (혹시 제거되었다면)
DO $$
BEGIN
  -- user_plans 테이블이 존재하고 plan_type 컬럼에 DEFAULT가 없으면 추가
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'user_plans'
  ) THEN
    -- DEFAULT가 없으면 추가
    ALTER TABLE user_plans
      ALTER COLUMN plan_type SET DEFAULT 'FREE'::plan_type;

    RAISE NOTICE 'Restored DEFAULT value for plan_type';
  END IF;
END $$;

RAISE NOTICE 'Rollback completed. You can now run the migration again.';
