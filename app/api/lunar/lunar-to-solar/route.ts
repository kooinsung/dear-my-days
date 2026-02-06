import { createLunarApiRoute } from '@/libs/api/lunar-handler'
import { lunarToSolarCandidates } from '@/libs/kasi/lunar-to-solar'

export const GET = createLunarApiRoute(lunarToSolarCandidates)
