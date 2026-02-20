import { drill } from '@ssgoi/react/view-transitions'

const physics = { inertia: { acceleration: 30, resistance: 1.2 } }

export const transitionConfig = {
  transitions: [
    // Home → Calendar
    {
      from: '/',
      to: '/calendar',
      transition: drill({ direction: 'enter', physics }),
    },
    {
      from: '/calendar',
      to: '/',
      transition: drill({ direction: 'exit', physics }),
    },

    // Home → Event Detail
    {
      from: '/',
      to: '/event/detail*',
      transition: drill({ direction: 'enter', physics }),
    },
    {
      from: '/event/detail*',
      to: '/',
      transition: drill({ direction: 'exit', physics }),
    },

    // Home → Event New
    {
      from: '/',
      to: '/event/new',
      transition: drill({ direction: 'enter', physics }),
    },
    {
      from: '/event/new',
      to: '/',
      transition: drill({ direction: 'exit', physics }),
    },

    // Home → Event Past
    {
      from: '/',
      to: '/event/past',
      transition: drill({ direction: 'enter', physics }),
    },
    {
      from: '/event/past',
      to: '/',
      transition: drill({ direction: 'exit', physics }),
    },

    // Event Detail → Event Edit
    {
      from: '/event/detail*',
      to: '/event/edit/*',
      transition: drill({ direction: 'enter', physics }),
    },
    {
      from: '/event/edit/*',
      to: '/event/detail*',
      transition: drill({ direction: 'exit', physics }),
    },

    // Calendar → Event Detail
    {
      from: '/calendar',
      to: '/event/detail*',
      transition: drill({ direction: 'enter', physics }),
    },
    {
      from: '/event/detail*',
      to: '/calendar',
      transition: drill({ direction: 'exit', physics }),
    },

    // Home → Settings
    {
      from: '/',
      to: '/settings',
      transition: drill({ direction: 'enter', physics }),
    },
    {
      from: '/settings',
      to: '/',
      transition: drill({ direction: 'exit', physics }),
    },

    // Settings → Settings sub-pages
    {
      from: '/settings',
      to: '/settings/*',
      transition: drill({ direction: 'enter', physics }),
    },
    {
      from: '/settings/*',
      to: '/settings',
      transition: drill({ direction: 'exit', physics }),
    },

    // Event Past → Event Detail
    {
      from: '/event/past',
      to: '/event/detail*',
      transition: drill({ direction: 'enter', physics }),
    },
    {
      from: '/event/detail*',
      to: '/event/past',
      transition: drill({ direction: 'exit', physics }),
    },

    // Login → Home
    {
      from: '/login',
      to: '/',
      transition: drill({ direction: 'enter', physics }),
    },

    // Auth pages
    {
      from: '/login',
      to: '/auth/*',
      transition: drill({ direction: 'enter', physics }),
    },
    {
      from: '/auth/*',
      to: '/login',
      transition: drill({ direction: 'exit', physics }),
    },

    // Login ↔ Test
    {
      from: '/login',
      to: '/test',
      transition: drill({ direction: 'enter', physics }),
    },
    {
      from: '/test',
      to: '/login',
      transition: drill({ direction: 'exit', physics }),
    },
  ],
}
