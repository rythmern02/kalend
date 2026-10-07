# Kalend demo (about 3 minutes)

Everything below runs on Solana devnet against program `Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527`.
Last full rehearsal: 2026-10-07 (round `cb3ea7d0…`, 1.0 PT filled at 0.997, executed on-chain).

## Before recording (10 minutes)

1. Start the relay and the app (two terminals, or the `relay` and `app` entries in `.claude/launch.json`):

   ```bash
   cd relay && set -a && . ./.env && set +a && npx tsx src/index.ts
   ```

   ```bash
   cd app && npx next dev -p 3000
   ```

   `curl localhost:3001/health` must show `"cre":{"mode":"simulator"}` (needs `cre login`, `bun`, `cre/.env`).
2. Create fresh fixtures. Pick a short-series maturity a few minutes after the point in the
   recording where you settle (default 12 minutes):

   ```bash
   npx tsx scripts/setup_demo.ts 12
   ```

   This prints `.demo/demo.json`: TEST mints, a LONG series (30 days) and a SHORT series, and two
   funded, allowlisted wallets whose keys are in `.demo/requester.json` and `.demo/dealer.json`.
3. Load a wallet into the app. In a real wallet (Phantom or Solflare on devnet) import the key
   from `.demo/requester.json`, or use the app's Devnet Local Wallet. Use a second browser profile
   for the dealer.
4. Before the recording, strip about 2 tokens into the SHORT series with the requester, so the
   settlement scene only has to wait for maturity.

## Script

| Time | Screen | Do | Say |
|---|---|---|---|
| 0:00 | Overview | Point at the banner | "Devnet. Matching runs in the Chainlink CRE simulator through the mock forwarder: real signatures and a real Solana write, but not a hardware enclave. Collateral is a test mint; the index is the live devnet stake-pool rate." |
| 0:20 | Overview | Scroll the series table, stake pool, Pyth | "Series come from the on-chain Registry. Pyth prices are read from the Pyth receiver accounts on devnet, for display only. Settlement uses the stake pool rate the program reads itself." |
| 0:40 | Series > Strip (LONG) | Strip 3 tokens as the requester | "One deposit becomes equal principal and yield tokens for one date." |
| 1:00 | Request Quote | LONG series, SellPT, 1.0 PT, 4.95% limit, Seal and Send | "The order is signed by the wallet and HPKE-sealed in the browser. The PT goes into escrow, which is public; the price, the limit and who bids are not." |
| 1:30 | Dealer Desk (dealer profile) | Quote 0.997 for 1000000 | "The dealer escrows a whole-token lot, never the exact quote, and seals the quote to the same key." |
| 1:50 | Round page | Close now and match, wait about 60 s | "The relay holds only ciphertext. The CRE workflow decrypts, checks that every signature matches the wallet the order names, picks the best quote within the limit and writes one fill. Losing quotes go nowhere." |
| 2:30 | Round page | Point at Executed, the FillReceipt and execute_fill links | "The FillReceipt is created once per round, so replays fail. execute_fill is permissionless, and it can only pay the requester and dealer named in the receipt." |
| 2:45 | SHORT series > Maturity | Settle series, then redeem PT and claim YT | "After maturity anyone can settle: the program reads the pool rate on-chain. This series crossed no epoch, so YT honestly gets zero; PT gets full principal." |
| 2:55 | Trust | Point at the custody disclosure | "We hold the decryption key, so we can read orders. Users can't verify attestation yet. Those are the gaps between this devnet build and a mainnet launch." |

## Known limits to state if asked

- RFQ workflow: Confidential Workflows enrollment and Deploy Access are not enabled for this
  account, so both workflows run with `cre workflow simulate --broadcast`.
- The public devnet RPC rate-limits; use a dedicated RPC for a smooth recording (`NEXT_PUBLIC_RPC_URL`
  and `SOLANA_RPC_URL`).
- No external audit. Devnet only.
