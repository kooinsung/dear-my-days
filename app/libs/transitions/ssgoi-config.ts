import { drill, fade, sheet, slide } from '@ssgoi/react/view-transitions'

export const transitionConfig = {
  transitions: [
    // Home ↔ Calendar: 수평 슬라이드
    { from: '/', to: '/calendar', transition: slide({ direction: 'left' }) },
    {
      from: '/calendar',
      to: '/',
      transition: slide({ direction: 'right' }),
    },

    // Home → Event Detail: iOS drill push
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

    // Event Detail → Edit: Drill
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

    // Home → New Event: Sheet modal
    {
      from: '/',
      to: '/event/new',
      transition: sheet({ direction: 'enter' }),
    },
    {
      from: '/event/new',
      to: '/',
      transition: sheet({ direction: 'exit' }),
    },

    // Settings navigation: Drill
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

    // Home ↔ Settings: Slide
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

    // Calendar → Event Detail: Drill
    {
      from: '/calendar',
      to: '/event/detail*',
      transition: drill({ direction: 'enter' }),
    },
    {
      from: '/event/detail*',
      to: '/calendar',
      transition: drill({ direction: 'exit' }),
    },

    // Login → Home: Fade
    { from: '/login', to: '/', transition: fade() },

    // Auth pages: Fade
    { from: '/login', to: '/auth/*', transition: fade() },
    { from: '/auth/*', to: '/login', transition: fade() },

    // Past events: Drill
    {
      from: '/',
      to: '/event/past',
      transition: drill({ direction: 'enter' }),
    },
    {
      from: '/event/past',
      to: '/',
      transition: drill({ direction: 'exit' }),
    },

    // Default: Fade
    { from: '*', to: '*', transition: fade() },
  ],
}
