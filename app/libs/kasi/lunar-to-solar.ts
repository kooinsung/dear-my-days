import { callKasiApi, formatYmdParams } from './client'
import type {
  LunarToSolarCandidate,
  LunarToSolarCandidatesResult,
  LunarToSolarResult,
  SolCalInfoItem,
} from './types'

function toInt(value: string, field: string): number {
  const n = Number.parseInt(value, 10)
  if (!Number.isFinite(n)) {
    throw new Error(`KASI API returned invalid ${field}: ${value}`)
  }
  return n
}

function toCandidate(
  item: SolCalInfoItem,
  isLeapMonth: boolean,
): LunarToSolarCandidate {
  return {
    solarYear: toInt(item.solYear, 'solYear'),
    solarMonth: toInt(item.solMonth, 'solMonth'),
    solarDay: toInt(item.solDay, 'solDay'),
    isLeapMonth,
  }
}

export async function lunarToSolarCandidates(
  year: number,
  month: number,
  day: number,
): Promise<LunarToSolarCandidatesResult> {
  const {
    year: lunYear,
    month: lunMonth,
    day: lunDay,
  } = formatYmdParams({
    year,
    month,
    day,
  })

  // KASI는 윤달 날짜의 경우 item 배열(평/윤)을 내려줄 수 있습니다.
  // 응답에 윤달 여부 필드가 없어 클라/서버에서 직접 구분할 수 없으므로,
  // 배열이 내려오면 1) 첫 번째=평달, 2) 두 번째=윤달로 매핑합니다.
  const raw = await callKasiApi<SolCalInfoItem>('getSolCalInfo', {
    lunYear,
    lunMonth,
    lunDay,
  })
  const items = Array.isArray(raw) ? raw : [raw]

  const candidates: LunarToSolarCandidate[] = []

  if (items.length === 1) {
    candidates.push(toCandidate(items[0], false))
  } else {
    // 보통 2개(평/윤)지만 혹시 더 많아도 방어적으로 처리
    items.forEach((it, idx) => {
      candidates.push(toCandidate(it, idx === 1))
    })
  }

  // 정렬: 평달(false) -> 윤달(true)
  candidates.sort((a, b) => Number(a.isLeapMonth) - Number(b.isLeapMonth))

  return { candidates }
}

/**
 * (호환용) 단일 결과가 필요한 기존 호출부를 위해 유지합니다.
 * 새 흐름에서는 lunarToSolarCandidates를 사용해 후보(평달/윤달)를 UI에서 선택합니다.
 */
export async function lunarToSolar(
  year: number,
  month: number,
  day: number,
  isLeapMonth = false,
): Promise<LunarToSolarResult> {
  // 기존 시그니처 호환 유지: 후보 목록에서 isLeapMonth에 맞는 1개를 선택
  const { candidates } = await lunarToSolarCandidates(year, month, day)

  const picked =
    candidates.find((c) => c.isLeapMonth === isLeapMonth) ?? candidates[0]

  if (!picked) {
    throw new Error('KASI API returned empty response for getSolCalInfo')
  }

  return {
    year: picked.solarYear,
    month: picked.solarMonth,
    day: picked.solarDay,
  }
}
