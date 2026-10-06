import { z } from 'zod'

export type VaultTier = 'CONSERVATIVE_ONDO' | 'BALANCED_LST' | 'ALPHA_BACKPACK'

export type VisibilityLevel = 'sealed' | 'enclave_only' | 'public_solana'

export interface VisibilityItem {
  label: string
  value: string
  visibility: VisibilityLevel
  description?: string
}

export type UserRole = 'requester' | 'dealer' | 'compliance_admin' | 'observer'

export const ConfigAccountSchema = z.object({
  authority: z.string(),
  pending_authority: z.string(),
  forwarders: z.array(
    z.object({
      program: z.string(),
      state: z.string(),
      allowed_workflow: z.string(),
    })
  ),
  forwarder_count: z.number(),
  enclave_key_hash: z.string(),
  paused: z.boolean(),
  cluster_mode: z.number(),
  fee_bps: z.number(),
  treasury: z.string(),
})
export type ConfigAccount = z.infer<typeof ConfigAccountSchema>

export const SeriesAccountSchema = z.object({
  pubkey: z.string(),
  collateral_mint: z.string(),
  collateral_program: z.string(),
  quote_mint: z.string(),
  index_kind: z.number(),
  index_source: z.string(),
  idx_open: z.string(),
  open_ts: z.number(),
  maturity_ts: z.number(),
  pt_mint: z.string(),
  yt_mint: z.string(),
  vault: z.string(),
  status: z.number(), // 0 = Open, 1 = Settled, 2 = Disputed, 3 = Paused
  idx_settle: z.string(),
  split_num: z.number(),
  split_den: z.number(),
  settled_ts: z.number(),
  privacy_mode: z.number(), // 0 = Plain, 1 = Confidential
  max_rate_bps: z.number(),
  dividend_cap_bps: z.number(),
  nonce: z.number(),
})
export type SeriesAccount = z.infer<typeof SeriesAccountSchema>

export const AllowEntrySchema = z.object({
  wallet: z.string(),
  expiry_ts: z.number(),
  roles: z.number(),
  is_valid: z.boolean(),
})
export type AllowEntry = z.infer<typeof AllowEntrySchema>

export const FillReceiptSchema = z.object({
  round_id: z.string(),
  series: z.string(),
  requester: z.string(),
  dealer: z.string(),
  side: z.enum(['SellPT', 'SellYT']),
  asset_amount: z.string(),
  quote_amount: z.string(),
  ts: z.number(),
  report_hash: z.string(),
  status: z.enum(['Approved', 'Executed']),
})
export type FillReceipt = z.infer<typeof FillReceiptSchema>

export const PythFeedDataSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  confidence: z.number(),
  publishTime: z.number(),
  source: z.string(),
})
export type PythFeedData = z.infer<typeof PythFeedDataSchema>

export const RfqRoundStatusSchema = z.object({
  round_id: z.string(),
  series: z.string(),
  status: z.enum(['open', 'matching', 'settled', 'expired', 'failed']),
  request_count: z.number(),
  quote_count: z.number(),
  created_at: z.number(),
  not_after: z.number(),
  blended_rate: z.number().optional(),
  fill_receipt: z.string().optional(),
})
export type RfqRoundStatus = z.infer<typeof RfqRoundStatusSchema>
