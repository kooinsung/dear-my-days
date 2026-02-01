export type KasiResultCode = '00' | string

export interface KasiResponseHeader {
  resultCode: KasiResultCode
  resultMsg: string
}

export interface KasiResponseBody<TItem> {
  items?: {
    item?: TItem | TItem[]
  }
}

export interface KasiResponse<TItem> {
  response: {
    header: KasiResponseHeader
    body: KasiResponseBody<TItem>
  }
}

export interface LunCalInfoItem {
  solYear: string
  solMonth: string
  solDay: string

  lunYear: string
  lunMonth: string
  lunDay: string

  lunLeapmonth: '평' | '윤' | string
}

export interface SolCalInfoItem {
  lunYear: string
  lunMonth: string
  lunDay: string

  solYear: string
  solMonth: string
  solDay: string
}

export interface SpcifyLunCalInfoItem {
  solYear: string
  solMonth: string
  solDay: string

  lunYear: string
  lunMonth: string
  lunDay: string

  lunLeapmonth?: '평' | '윤' | string
}

export interface SolarToLunarResult {
  lunarYear: number
  lunarMonth: number
  lunarDay: number
  isLeapMonth: boolean
}

export interface LunarToSolarResult {
  year: number
  month: number
  day: number
}

export interface LunarSpecialResult extends LunarToSolarResult {
  lunarYear: number
  lunarMonth: number
  lunarDay: number
  isLeapMonth: boolean
}
