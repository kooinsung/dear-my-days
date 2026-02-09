import { slide } from '@ssgoi/react/view-transitions'

export const transitionConfig = {
  transitions: [
    // 모든 forward 네비게이션에 slide 적용
    {
      from: '*',
      to: '*',
      transition: slide({ direction: 'left' }),
    },
  ],
  back: {
    // 뒤로 가기는 반대 방향
    transition: slide({ direction: 'right' }),
  },
}
