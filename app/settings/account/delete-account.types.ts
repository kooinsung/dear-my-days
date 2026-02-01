export type AccountDeletionStep = 'storage' | 'public_tables' | 'auth_users'

export interface DeleteAccountResult {
  ok: boolean
  steps: Record<AccountDeletionStep, { ok: boolean; error?: string }>
}
