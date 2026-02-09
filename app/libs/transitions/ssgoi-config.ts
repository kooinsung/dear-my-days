import { drill } from '@ssgoi/react/view-transitions'

export const transitionConfig = {
  transitions: [
    // 모든 forward 네비게이션: Drill enter
    {
      from: '*',
      to: '*',
      transition: drill({ direction: 'enter' }),
    },
  ],
  back: {
    // 뒤로 가기: Drill exit
    transition: drill({ direction: 'exit' }),
  },
}
