import { parseStringPromise } from 'xml2js'
import type { KasiResponse } from './types'

export async function parseKasiXml<TItem>(
  xml: string,
): Promise<KasiResponse<TItem>> {
  return (await parseStringPromise(xml, {
    explicitArray: false,
    trim: true,
  })) as KasiResponse<TItem>
}
