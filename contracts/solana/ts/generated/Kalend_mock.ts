// Code generated — DO NOT EDIT.
import { addSolanaContractMock, type SolanaContractMock, type SolanaMock } from '@chainlink/cre-sdk/test'

import { KALEND_PROGRAM_ID } from './Kalend'

export type KalendMock = SolanaContractMock

/**
 * Registers a Kalend program mock on a SolanaMock instance.
 * The Solana CRE capability is write-only, so the mock routes writeReport
 * calls targeting this program's ID; set the returned mock's writeReport
 * property to define the reply.
 */
export function newKalendMock(
  solanaMock: SolanaMock,
  programId: string | Uint8Array = KALEND_PROGRAM_ID,
): KalendMock {
  return addSolanaContractMock(solanaMock, { programId })
}
