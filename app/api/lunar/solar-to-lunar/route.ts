import { createLunarApiRoute } from '@/libs/api/lunar-handler'
import { solarToLunar } from '@/libs/kasi/solar-to-lunar'

export const GET = createLunarApiRoute(solarToLunar)
