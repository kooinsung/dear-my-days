import { drill, fade, slide } from '@ssgoi/react/view-transitions'

export const transitionConfig = {
  transitions: [
    // 홈 ↔ 캘린더: 슬라이드
    {
      from: '/',
      to: '/calendar',
      transition: slide({ direction: 'left' }),
    },
    {
      from: '/calendar',
      to: '/',
      transition: slide({ direction: 'right' }),
    },

    // 홈 → 상세 페이지: Drill (iOS push)
    {
      from: '/',
      to: '/event/detail*',
      transition: drill({ direction: 'enter' }),
    },
    {
      from: '/event/detail*',
      to: '/',
      transition: drill({ direction: 'exit' }),
    },

    // 상세 → 편집: Drill
    {
      from: '/event/detail*',
      to: '/event/edit/*',
      transition: drill({ direction: 'enter' }),
    },
    {
      from: '/event/edit/*',
      to: '/event/detail*',
      transition: drill({ direction: 'exit' }),
    },

    // 홈 → 새 이벤트: Drill
    {
      from: '/',
      to: '/event/new',
      transition: drill({ direction: 'enter' }),
    },
    {
      from: '/event/new',
      to: '/',
      transition: drill({ direction: 'exit' }),
    },

    // Settings 네비게이션: Drill
    {
      from: '/settings',
      to: '/settings/*',
      transition: drill({ direction: 'enter' }),
    },
    {
      from: '/settings/*',
      to: '/settings',
      transition: drill({ direction: 'exit' }),
    },

    // 홈 ↔ Settings: 슬라이드
    {
      from: '/',
      to: '/settings',
      transition: slide({ direction: 'left' }),
    },
    {
      from: '/settings',
      to: '/',
      transition: slide({ direction: 'right' }),
    },

    // Login → Home: Fade
    {
      from: '/login',
      to: '/',
      transition: fade(),
    },

    // Auth 페이지: Fade
    {
      from: '/auth/*',
      to: '*',
      transition: fade(),
    },
    {
      from: '*',
      to: '/auth/*',
      transition: fade(),
    },

    // 기본: Fade
    {
      from: '*',
      to: '*',
      transition: fade(),
    },
  ],
}
