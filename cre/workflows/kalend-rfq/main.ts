import {
  HTTPCapability,
  Runner,
  SolanaClient,
  handlerInTee,
  solanaAccountMeta,
  type HTTPPayload,
  type SolanaAccountMeta,
  type TeeRuntime,
} from '@chainlink/cre-sdk'
import { PublicKey } from '@solana/web3.js'
import { address } from '@solana/addresses'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { matchRound, type RoundBundle } from './match'
import { Kalend } from '../../../contracts/solana/ts/generated/Kalend.js'

export interface RfqConfig {
  mode: string
  authorizedKeys: string[]
  solanaRpcUrl: string
  programId: string
  configPda: string
  rentVaultPda: string
  forwarderState: string
  forwarderProgram: string
  chainSelector: string
  secretId: string
}

export type { RoundBundle, SealedEnvelope } from './match'

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

/**
 * Derives FillReceipt PDA: ["fill", round_id]
 */
function deriveFillReceiptPda(roundIdBytes: Uint8Array, programId: string): string {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('fill'), roundIdBytes],
    new PublicKey(programId)
  )
  return pda.toBase58()
}

export const onHttpTriggerInTee = (
  runtime: TeeRuntime<RfqConfig>,
  event: HTTPPayload
): string => {
  const config = runtime.config
  const now = Math.floor(runtime.now().getTime() / 1000)

  // 1. Enclave decryption key from the Vault DON (released only to an attested enclave when
  //    deployed; in the local simulator it comes from the simulator's secrets file).
  const secretHex = runtime.getSecret({ id: config.secretId }).result().value
  const enclaveSecret = hexToBytes(secretHex.trim())

  // 2. Round bundle: ciphertexts only (the relay never sees plaintext).
  const bundle = JSON.parse(new TextDecoder().decode(event.input)) as RoundBundle

  // 3. Decrypt, verify wallet signatures + identity binding, match. Nothing is logged.
  const result = matchRound(enclaveSecret, bundle, now)
  if (result.status !== 'filled') {
    return JSON.stringify({ status: 'no_match', round_id: bundle.round_id, reason: result.reason })
  }
  const fill = result.fill

  // 59-byte payload (CRE caps Solana reports at 265 bytes incl. forwarder metadata).
  // Series, requester and dealer go in the account list, which the signed report hashes.
  const fillReport = {
    kind: 1,
    version: 1,
    roundId: Array.from(fill.roundId),
    side: fill.side,
    assetAmount: fill.assetAmount,
    quoteAmount: fill.quoteAmount,
    notAfter: BigInt(fill.notAfter),
  }

  // 4. Accounts for forwarder -> on_report (docs/REPORT_ACCOUNTS.md). The forwarder strips
  //    [0] and [1]; on_report sees [config, series, fill_receipt, rent_vault, system,
  //    requester, dealer].
  const forwarderAuthority = deriveForwarderAuthority(
    config.forwarderProgram,
    config.forwarderState,
    config.programId
  )
  const fillReceiptPda = deriveFillReceiptPda(fill.roundId, config.programId)
  const remainingAccounts: SolanaAccountMeta[] = [
    solanaAccountMeta(config.forwarderState, false),
    solanaAccountMeta(forwarderAuthority, false),
    solanaAccountMeta(config.configPda, false),
    solanaAccountMeta(fill.series, false),
    solanaAccountMeta(fillReceiptPda, true),
    solanaAccountMeta(config.rentVaultPda, true),
    solanaAccountMeta('11111111111111111111111111111111', false),
    solanaAccountMeta(fill.requester, false),
    solanaAccountMeta(fill.dealer, false),
  ]

  // 5. Cross back to the DON for consensus signing + Solana write. Only the fill leaves.
  const don = runtime.usingTheDons()
  const kalend = new Kalend(new SolanaClient(BigInt(config.chainSelector)), config.programId)
  const write = kalend.writeReportFromFillReport(don, fillReport, remainingAccounts, {
    computeLimit: 200_000,
  }) as any

  return JSON.stringify({
    status: 'filled',
    round_id: bundle.round_id,
    fill_receipt: fillReceiptPda,
    tx_status: write?.txStatus ?? null,
    receiver_status: write?.receiverContractExecutionStatus ?? null,
    tx_signature_hex: write?.txSignature ? bytesToHex(write.txSignature) : null,
  })
}

export const initWorkflow = (config: RfqConfig) => [
  handlerInTee(
    new HTTPCapability().trigger({
      authorizedKeys: config.authorizedKeys.map((k) => ({
        type: 'KEY_TYPE_ECDSA_EVM' as const,
        publicKey: k,
      })),
    }),
    onHttpTriggerInTee,
    [{ tee: 'nitro', regions: ['us-west-2'] }]
  ),
]

export async function main() {
  const runner = await Runner.newRunner<RfqConfig>()
  await runner.run(initWorkflow)
}

