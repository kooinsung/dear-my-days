import { drill } from '@ssgoi/react/view-transitions'

export const transitionConfig = {
  transitions: [
    // Home → Calendar
    {
      from: '/',
      to: '/calendar',
      transition: drill({ direction: 'enter' }),
    },
    {
      from: '/calendar',
      to: '/',
      transition: drill({ direction: 'exit' }),
    },

    // Home → Event Detail
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

    // Home → Event New
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

    // Home → Event Past
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

    // Event Detail → Event Edit
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

    // Calendar → Event Detail
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

    // Home → Settings
    {
      from: '/',
      to: '/settings',
      transition: drill({ direction: 'enter' }),
    },
    {
      from: '/settings',
      to: '/',
      transition: drill({ direction: 'exit' }),
    },

    // Settings → Settings sub-pages
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

    // Event Past → Event Detail
    {
      from: '/event/past',
      to: '/event/detail*',
      transition: drill({ direction: 'enter' }),
    },
    {
      from: '/event/detail*',
      to: '/event/past',
      transition: drill({ direction: 'exit' }),
    },

    // Login → Home
    {
      from: '/login',
      to: '/',
      transition: drill({ direction: 'enter' }),
    },

    // Auth pages
    {
      from: '/login',
      to: '/auth/*',
      transition: drill({ direction: 'enter' }),
    },
    {
      from: '/auth/*',
      to: '/login',
      transition: drill({ direction: 'exit' }),
    },

    // Login ↔ Test
    {
      from: '/login',
      to: '/test',
      transition: drill({ direction: 'enter' }),
    },
    {
      from: '/test',
      to: '/login',
      transition: drill({ direction: 'exit' }),
    },
  ],
}
