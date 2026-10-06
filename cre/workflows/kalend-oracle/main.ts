import {
  CronCapability,
  HTTPClient,
  Runner,
  SolanaClient,
  consensusIdenticalAggregation,
  handler,
  json,
  ok,
  solanaAccountMeta,
  type HTTPSendRequester,
  type Runtime,
  type SolanaAccountMeta,
} from '@chainlink/cre-sdk'
import { PublicKey } from '@solana/web3.js'
import { address } from '@solana/addresses'
import { Kalend } from '../../../contracts/solana/ts/generated/Kalend.js'

export interface OracleConfig {
  mode: string
  schedule: string
  solanaRpcUrl: string
  mainnetRpcUrl: string
  programId: string
  registryPda: string
  configPda: string
  forwarderState: string
  forwarderProgram: string
  chainSelector: string
}

interface RpcAccountResponse {
  jsonrpc: string
  result?: {
    value?: {
      data: [string, string] // [base64_data, "base64"]
      lamports: number
      owner: string
    } | null
  }
  error?: unknown
}

const WAD = 10n ** 18n

/**
 * HTTP fetch callback with consensus identical aggregation for reading Solana account data
 */
function fetchSolanaAccount(
  sender: HTTPSendRequester,
  rpcUrl: string,
  pubkey: string
): string {
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'getAccountInfo',
    params: [pubkey, { encoding: 'base64', commitment: 'confirmed' }],
  })

  const response = sender
    .sendRequest({
      url: rpcUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: new TextEncoder().encode(payload),
    })
    .result()

  if (!ok(response)) {
    throw new Error(`RPC HTTP error: status ${response.statusCode}`)
  }

  const raw = json(response) as RpcAccountResponse
  if (!raw.result || !raw.result.value || !raw.result.value.data) {
    return ''
  }
  return raw.result.value.data[0]
}

/**
 * Derives the forwarder authority PDA: ["forwarder", forwarderState, receiverProgram]
 */
function deriveForwarderAuthority(
  forwarderProgram: string,
  forwarderState: string,
  receiverProgram: string
): string {
  const [authority] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('forwarder'),
      new PublicKey(forwarderState).toBuffer(),
      new PublicKey(receiverProgram).toBuffer(),
    ],
    new PublicKey(forwarderProgram)
  )
  return authority.toBase58()
}

export const onCronTrigger = (runtime: Runtime<OracleConfig>): string => {
  const config = runtime.config
  const now = Math.floor(runtime.now().getTime() / 1000)
  runtime.log(`[kalend-oracle] Cron triggered at ${runtime.now().toISOString()} (ts: ${now})`)

  const httpClient = new HTTPClient()

  // 1. Read Registry account
  const registryBase64 = httpClient
    .sendRequest(runtime, fetchSolanaAccount, consensusIdenticalAggregation<string>())(
      config.solanaRpcUrl,
      config.registryPda
    )
    .result()

  if (!registryBase64) {
    runtime.log(`[kalend-oracle] Registry account empty or not found: ${config.registryPda}`)
    return JSON.stringify({ status: 'registry_empty', now })
  }

  const registryBytes = Buffer.from(registryBase64, 'base64')
  if (registryBytes.length < 14) {
    return JSON.stringify({ status: 'invalid_registry_data', now })
  }

  // Anchor Discriminator: 8 bytes
  // count: u16 (offset 8..10)
  // vec len: u32 (offset 10..14)
  const seriesCount = registryBytes.readUInt16LE(8)
  const vecLen = registryBytes.readUInt32LE(10)
  runtime.log(`[kalend-oracle] Registry contains ${seriesCount} series entries (vec len: ${vecLen})`)

  let settledAny = false
  const settlementResults: Array<{ series: string; indexWad: string; txHash?: string }> = []

  // 2. Iterate through registered series
  for (let i = 0; i < vecLen; i++) {
    const pubkeyOffset = 14 + i * 32
    if (pubkeyOffset + 32 > registryBytes.length) break

    const seriesPubkeyBytes = registryBytes.subarray(pubkeyOffset, pubkeyOffset + 32)
    const seriesPubkey = new PublicKey(seriesPubkeyBytes).toBase58()

    // Read series account
    const seriesBase64 = httpClient
      .sendRequest(runtime, fetchSolanaAccount, consensusIdenticalAggregation<string>())(
        config.solanaRpcUrl,
        seriesPubkey
      )
      .result()

    if (!seriesBase64) continue
    const seriesBytes = Buffer.from(seriesBase64, 'base64')
    if (seriesBytes.length < 300) continue

    // Series layout offsets (after 8-byte discriminator):
    // index_kind: offset 104 (u8)
    // index_source: offset 105..137 (Pubkey)
    // idx_open: offset 137..153 (u128 LE)
    // maturity_ts: offset 161..169 (i64 LE)
    // status: offset 265 (u8: 0=Open, 1=Settled, 2=Disputed, 3=Paused)
    const indexKind = seriesBytes.readUInt8(104)
    const indexSourcePubkey = new PublicKey(seriesBytes.subarray(105, 137)).toBase58()
    const maturityTs = Number(seriesBytes.readBigInt64LE(161))
    const status = seriesBytes.readUInt8(265)

    runtime.log(
      `[kalend-oracle] Checking series ${seriesPubkey}: status=${status}, maturity=${maturityTs}, now=${now}, indexKind=${indexKind}`
    )

    // Check if open and matured
    if (status === 0 && now >= maturityTs) {
      runtime.log(`[kalend-oracle] Series ${seriesPubkey} is DUE FOR SETTLEMENT!`)

      let calculatedIndexWad = WAD
      let splitNum = 1
      let splitDen = 1

      if (indexKind === 0) {
        // StakePoolRate: Query SPL Liquid Stake Pool (JitoSOL Stake Pool on mainnet or configured source)
        const targetStakePool =
          indexSourcePubkey !== PublicKey.default.toBase58()
            ? indexSourcePubkey
            : 'Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb'

        runtime.log(`[kalend-oracle] Reading stake pool account ${targetStakePool} from ${config.mainnetRpcUrl}...`)
        const poolBase64 = httpClient
          .sendRequest(runtime, fetchSolanaAccount, consensusIdenticalAggregation<string>())(
            config.mainnetRpcUrl,
            targetStakePool
          )
          .result()

        if (poolBase64) {
          const poolBytes = Buffer.from(poolBase64, 'base64')
          if (poolBytes.length >= 274) {
            // total_lamports: offset 258..266 (u64 LE)
            // pool_token_supply: offset 266..274 (u64 LE)
            const totalLamports = poolBytes.readBigUInt64LE(258)
            const poolSupply = poolBytes.readBigUInt64LE(266)
            if (poolSupply > 0n) {
              calculatedIndexWad = (totalLamports * WAD) / poolSupply
              runtime.log(
                `[kalend-oracle] Attested StakePool rate: ${totalLamports} / ${poolSupply} => idx_wad = ${calculatedIndexWad.toString()}`
              )
            }
          }
        }
      } else if (indexKind === 1) {
        // ScaledUiDividendAdjusted (equities)
        // Multiplier defaults to 1.0 WAD if not adjusted, split factor 1/1
        calculatedIndexWad = WAD
        splitNum = 1
        splitDen = 1
      }

      // Build SettleReport struct matching Borsh layout
      const settleReport = {
        kind: 2,
        version: 1,
        series: address(seriesPubkey),
        observedTs: BigInt(now),
        indexWad: calculatedIndexWad,
        splitNum: splitNum,
        splitDen: splitDen,
      }

      // Derive forwarderAuthority PDA
      const forwarderAuthority = deriveForwarderAuthority(
        config.forwarderProgram,
        config.forwarderState,
        config.programId
      )

      // Remaining accounts: [forwarderState, forwarderAuthority, configPda, seriesPubkey]
      const remainingAccounts: SolanaAccountMeta[] = [
        solanaAccountMeta(config.forwarderState, false),
        solanaAccountMeta(forwarderAuthority, false),
        solanaAccountMeta(config.configPda, false),
        solanaAccountMeta(seriesPubkey, true),
      ]

      if (config.mode === 'local-simulation') {
        runtime.log(
          `[kalend-oracle][local-simulation] Dry-run settle report for series ${seriesPubkey}: index_wad=${calculatedIndexWad.toString()}`
        )
        settlementResults.push({
          series: seriesPubkey,
          indexWad: calculatedIndexWad.toString(),
          txHash: 'local-simulation-dry-run',
        })
        settledAny = true
        continue
      }

      // Production / Testnet write path
      const solanaClient = new SolanaClient(BigInt(config.chainSelector))
      const kalend = new Kalend(solanaClient, config.programId)

      runtime.log(`[kalend-oracle] Submitting SettleReport to Solana forwarder...`)
      const writeResult = kalend.writeReportFromSettleReport(
        runtime,
        settleReport,
        remainingAccounts,
        { computeLimit: 300_000 }
      )

      settlementResults.push({
        series: seriesPubkey,
        indexWad: calculatedIndexWad.toString(),
        txHash: writeResult ? JSON.stringify(writeResult) : undefined,
      })
      settledAny = true
    }
  }

  return JSON.stringify({
    status: settledAny ? 'settled' : 'idle',
    now,
    seriesCount,
    settlementResults,
  })
}

export const initWorkflow = (config: OracleConfig) => [
  handler(new CronCapability().trigger({ schedule: config.schedule }), onCronTrigger),
]

export async function main() {
  const runner = await Runner.newRunner<OracleConfig>()
  await runner.run(initWorkflow)
}

if (process.argv[1] && process.argv[1].endsWith('main.ts')) {
  main()
}
