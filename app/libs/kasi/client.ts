import { env } from '@/libs/config/env'
import { parseKasiXml } from './parser'
import type { KasiResponse } from './types'

const BASE_URL =
  'http://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService'

const DEFAULT_REVALIDATE_SECONDS = 60 * 60 * 24 * 30

function requireServiceKey(): string {
  return env.KASI_SERVICE_KEY
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatYmdParams(params: {
  year: number
  month: number
  day: number
}): { year: string; month: string; day: string } {
  return {
    year: String(params.year),
    month: pad2(params.month),
    day: pad2(params.day),
  }
}

export interface KasiFetchOptions {
  revalidateSeconds?: number
  cache?: RequestCache
}

function buildQuery(params: Record<string, string>): string {
  const entries = Object.entries(params).sort(([a], [b]) => a.localeCompare(b))
  return new URLSearchParams(entries).toString()
}

export async function callKasiApi<TItem>(
  endpoint: string,
  params: Record<string, string>,
  options: KasiFetchOptions = {},
): Promise<TItem | TItem[]> {
  const query = buildQuery({ ...params, ServiceKey: requireServiceKey() })
  const url = `${BASE_URL}/${endpoint}?${query}`

  const res = await fetch(url, {
    cache: options.cache ?? 'force-cache',
    next: {
      revalidate: options.revalidateSeconds ?? DEFAULT_REVALIDATE_SECONDS,
    },
  })

  if (!res.ok) {
    throw new Error(`KASI API request failed: ${res.status} ${res.statusText}`)
  }

  const xml = await res.text()
  const json = await parseKasiXml<TItem>(xml)

  const header = json.response?.header
  if (header?.resultCode !== '00') {
    throw new Error(header?.resultMsg ?? 'Unknown error')
  }

  return (json as KasiResponse<TItem>).response.body.items?.item as
    | TItem
    | TItem[]
}
