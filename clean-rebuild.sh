#!/bin/bash
set -e

echo "🧹 앱 캐시 완전 삭제 시작..."

# 1. 앱 삭제
echo "📱 앱 삭제 중..."
adb uninstall com.dearmydays.app 2>/dev/null || echo "앱이 이미 삭제되었거나 설치되지 않았습니다."

# 2. 캐시 삭제
echo "🗑️  캐시 삭제 중..."
rm -rf .next
rm -rf android/app/src/main/assets/public
rm -rf ios/App/App/public 2>/dev/null || true

# 3. 재빌드
echo "🔨 재빌드 중..."
pnpm build

# 4. Capacitor 동기화
echo "🔄 Capacitor 동기화 중..."
source ~/.nvm/nvm.sh  # nvm 로드
nvm use 22
pnpm cap:sync:prod

echo "✅ 완료! 이제 'pnpm dev:android'로 앱을 실행하세요."
