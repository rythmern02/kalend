// Run: npx tsx --test cre/workflows/kalend-rfq/match.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { x25519, ed25519 } from '@noble/curves/ed25519.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, utf8ToBytes, concatBytes } from '@noble/hashes/utils.js'
import { PublicKey } from '@solana/web3.js'
import { hpkeSeal, hpkeOpen } from './hpke'
import { matchRound, roundInfo, parsePrice6, type RoundBundle } from './match'

const enclaveSk = x25519.utils.randomSecretKey()
const enclavePk = x25519.getPublicKey(enclaveSk)
const KID = 'kid-test'
const SERIES = new PublicKey(new Uint8Array(32).fill(7)).toBase58()
const QUOTE_MINT = new PublicKey(new Uint8Array(32).fill(9)).toBase58()
const NOW = 1_800_000_000

function wallet() {
  const sk = ed25519.utils.randomSecretKey()
  const pk = ed25519.getPublicKey(sk)
  return { sk, pk, addr: new PublicKey(pk).toBase58() }
}

function seal(roundId: string, domain: string, payload: object, signer: ReturnType<typeof wallet>) {
  const digest = sha256(concatBytes(utf8ToBytes(domain), utf8ToBytes(JSON.stringify(payload))))
  const env = { payload, sig: bytesToHex(ed25519.sign(digest, signer.sk)), pubkey: bytesToHex(signer.pk) }
  const { info, aad } = roundInfo(roundId, KID)
  const { enc, ciphertext } = hpkeSeal(enclavePk, info, aad, utf8ToBytes(JSON.stringify(env)))
  return { enc: bytesToHex(enc), ciphertext: bytesToHex(ciphertext), kid: KID }
}

const roundId = bytesToHex(new Uint8Array(32).fill(0x42))
const req = (w: ReturnType<typeof wallet>, o: object = {}) => ({
  v: 1, round_id: roundId, series: SERIES, side: 'SellPT', size: '1000000', limit_price: '0.95',
  quote_mint: QUOTE_MINT, requester: w.addr, nonce: 1, not_after: NOW + 300, ...o,
})
const quote = (w: ReturnType<typeof wallet>, price: string, max = '5000000', o: object = {}) => ({
  v: 1, round_id: roundId, dealer: w.addr, price, max_size: max, nonce: 2, not_after: NOW + 300, ...o,
})
const bundle = (requests: any[], quotes: any[]): RoundBundle => ({ kid: KID, round_id: roundId, series: SERIES, requests, quotes })

test('hpke copies are byte-identical to the canonical module', () => {
  const canon = readFileSync(new URL('../../../packages/crypto/src/hpke.ts', import.meta.url), 'utf8')
  assert.equal(readFileSync(new URL('./hpke.ts', import.meta.url), 'utf8'), canon)
  assert.equal(readFileSync(new URL('../../../app/src/lib/hpke.ts', import.meta.url), 'utf8'), canon)
})

test('hpke rejects tampered ciphertext and wrong info', () => {
  const { info, aad } = roundInfo(roundId, KID)
  const { enc, ciphertext } = hpkeSeal(enclavePk, info, aad, utf8ToBytes('x'))
  const bad = ciphertext.slice(); bad[0] ^= 1
  assert.throws(() => hpkeOpen(enclaveSk, enc, info, aad, bad))
  assert.throws(() => hpkeOpen(enclaveSk, enc, roundInfo(roundId, 'other-kid').info, aad, ciphertext))
})

test('best price wins, size is min(size, max_size)', () => {
  const r = wallet(), d1 = wallet(), d2 = wallet()
  const out = matchRound(enclaveSk, bundle(
    [seal(roundId, 'KALEND/v1/request', req(r), r)],
    [seal(roundId, 'KALEND/v1/quote', quote(d1, '0.96', '400000'), d1), seal(roundId, 'KALEND/v1/quote', quote(d2, '0.955'), d2)],
  ), NOW)
  assert.equal(out.status, 'filled')
  if (out.status !== 'filled') return
  assert.equal(out.fill.dealer, d1.addr)
  assert.equal(out.fill.assetAmount, 400000n)
  assert.equal(out.fill.quoteAmount, 384000n)
  assert.equal(out.fill.requester, r.addr)
})

test('quote below limit does not fill', () => {
  const r = wallet(), d = wallet()
  const out = matchRound(enclaveSk, bundle([seal(roundId, 'KALEND/v1/request', req(r), r)], [seal(roundId, 'KALEND/v1/quote', quote(d, '0.94'), d)]), NOW)
  assert.equal(out.status, 'no_match')
})

test('order signed by a different wallet than it names is rejected', () => {
  const victim = wallet(), attacker = wallet(), d = wallet()
  const out = matchRound(enclaveSk, bundle(
    [seal(roundId, 'KALEND/v1/request', req(victim), attacker)],
    [seal(roundId, 'KALEND/v1/quote', quote(d, '0.99'), d)],
  ), NOW)
  assert.equal(out.status, 'no_match')
})

test('expired, wrong-round and wrong-series orders are rejected', () => {
  const r = wallet(), d = wallet()
  const q = seal(roundId, 'KALEND/v1/quote', quote(d, '0.99'), d)
  for (const o of [{ not_after: NOW - 1 }, { round_id: bytesToHex(new Uint8Array(32)) }, { series: QUOTE_MINT }]) {
    const out = matchRound(enclaveSk, bundle([seal(roundId, 'KALEND/v1/request', req(r, o), r)], [q]), NOW)
    assert.equal(out.status, 'no_match')
  }
})

test('equal prices tie-break by hash, not by arrival order', () => {
  const r = wallet(), d1 = wallet(), d2 = wallet()
  const rq = seal(roundId, 'KALEND/v1/request', req(r), r)
  const q1 = seal(roundId, 'KALEND/v1/quote', quote(d1, '0.97'), d1)
  const q2 = seal(roundId, 'KALEND/v1/quote', quote(d2, '0.97'), d2)
  const a = matchRound(enclaveSk, bundle([rq], [q1, q2]), NOW)
  const b = matchRound(enclaveSk, bundle([rq], [q2, q1]), NOW)
  assert.ok(a.status === 'filled' && b.status === 'filled' && a.fill.dealer === b.fill.dealer)
})

test('price parser rejects floats-as-garbage and >6dp', () => {
  assert.equal(parsePrice6('0.95'), 950000n)
  assert.equal(parsePrice6('1'), 1000000n)
  assert.equal(parsePrice6('0.1234567'), null)
  assert.equal(parsePrice6('1e3'), null)
  assert.equal(parsePrice6('-1'), null)
})
