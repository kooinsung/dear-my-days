import { drill } from '@ssgoi/react/view-transitions'

export const transitionConfig = {
  transitions: [
    // 모든 forward 네비게이션 (앞으로 가기)
    {
      from: '*',
      to: '*',
      transition: drill({ direction: 'enter' }),
    },
  ],
  back: {
    // 뒤로 가기 애니메이션
    transition: drill({ direction: 'exit' }),
  },
}
