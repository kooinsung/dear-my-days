import { drill } from '@ssgoi/react/view-transitions'

export const transitionConfig = {
  transitions: [
    // 모든 forward 네비게이션에 drill 적용 (iOS push)
    {
      from: '*',
      to: '*',
      transition: drill({ direction: 'enter' }),
    },
  ],
  back: {
    // 뒤로 가기는 exit 방향 (iOS pop)
    transition: drill({ direction: 'exit' }),
  },
}
