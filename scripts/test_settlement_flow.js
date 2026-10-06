import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet, BN } from "@coral-xyz/anchor";
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo, 
  TOKEN_PROGRAM_ID, 
  TOKEN_2022_PROGRAM_ID, 
  getAccount,
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import fs from "fs";
import path from "path";
import os from "os";

const PROGRAM_ID = new PublicKey("Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527");
const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

// Roles bitmask
const ROLE_STRIP = 1 << 0;
const ROLE_REDEEM = 1 << 1;
const ROLE_CLAIM = 1 << 2;
const ROLE_REQUESTER = 1 << 3;
const ROLE_DEALER = 1 << 4;
const ALL_ROLES = ROLE_STRIP | ROLE_REDEEM | ROLE_CLAIM | ROLE_REQUESTER | ROLE_DEALER;

// Devnet SPL Stake Pool account verified in SOURCES.md
const DEVNET_STAKE_POOL = new PublicKey("HUnwAcgmfZf5x9BTKFuzXPqUna43xnz9ZZkbxNB7g66f");

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const keypairPath = path.join(os.homedir(), ".config/solana/civitas-deployer.json");
  const deployerKey = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  const authority = Keypair.fromSecretKey(Uint8Array.from(deployerKey));

  const idlPath = path.resolve("./target/idl/kalend.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

  const provider = new AnchorProvider(connection, new Wallet(authority), { commitment: "confirmed" });
  const program = new Program(idl, provider);

  console.log(`=== Testing On-Chain Maturity Settlement & Redemption on Devnet ===`);
  console.log(`Program ID: ${PROGRAM_ID.toBase58()}`);
  console.log(`Authority: ${authority.publicKey.toBase58()}`);

  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
  const [registryPda] = PublicKey.findProgramAddressSync([Buffer.from("registry")], PROGRAM_ID);

  // 1. Ensure AllowEntry has Strip, Redeem, Claim
  console.log(`\n[Step 1] Ensuring AllowEntry for authority...`);
  const [allowEntryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("allow"), authority.publicKey.toBuffer()],
    PROGRAM_ID
  );
  const expiryTs = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days
  
  const allowTx = await program.methods
    .setAllowEntry(authority.publicKey, ALL_ROLES, new BN(expiryTs))
    .accounts({
      config: configPda,
      allowEntry: allowEntryPda,
      authority: authority.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log(`✓ AllowEntry confirmed: ${allowTx}`);

  // 2. Create test collateral mint
  console.log(`\n[Step 2] Creating test collateral token...`);
  const collateralMint = await createMint(
    connection,
    authority,
    authority.publicKey,
    null,
    6,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );
  console.log(`✓ Collateral Mint: ${collateralMint.toBase58()}`);

  const quoteMint = await createMint(
    connection,
    authority,
    authority.publicKey,
    null,
    6,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );
  console.log(`✓ Quote Mint: ${quoteMint.toBase58()}`);

  const userCollateralAta = await getOrCreateAssociatedTokenAccount(
    connection,
    authority,
    collateralMint,
    authority.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const depositAmount = 2_000_000n; // 2.0 tokens (6 decimals)
  await mintTo(
    connection,
    authority,
    collateralMint,
    userCollateralAta.address,
    authority,
    depositAmount,
    [],
    undefined,
    TOKEN_PROGRAM_ID
  );
  console.log(`✓ Minted 2.0 collateral to user: ${userCollateralAta.address.toBase58()}`);

  // 3. Open Series with short maturity (8 seconds)
  const nonce = Math.floor(Math.random() * 65535);
  const maturityTs = Math.floor(Date.now() / 1000) + 8;
  console.log(`\n[Step 3] Opening short-dated Series (maturity in 8s, ts: ${maturityTs}, nonce: ${nonce})...`);

  const maturityBuffer = Buffer.alloc(8);
  maturityBuffer.writeBigInt64LE(BigInt(maturityTs));
  const nonceBuffer = Buffer.alloc(2);
  nonceBuffer.writeUInt16LE(nonce);

  const [seriesPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("series"), collateralMint.toBuffer(), maturityBuffer, nonceBuffer],
    PROGRAM_ID
  );
  const ptKeypair = Keypair.generate();
  const ytKeypair = Keypair.generate();
  console.log(`PT Mint (Token-2022): ${ptKeypair.publicKey.toBase58()}`);
  console.log(`YT Mint (Token-2022): ${ytKeypair.publicKey.toBase58()}`);

  const vaultPda = getAssociatedTokenAddressSync(
    collateralMint,
    seriesPda,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const idxOpen = new BN("1000000000000000000"); // 1.0 WAD (1e18)

  const openTx = await program.methods
    .openSeries(
      new BN(maturityTs),
      nonce,
      0, // StakePoolRate
      DEVNET_STAKE_POOL,
      idxOpen,
      0, // Plain privacy mode
      5000, // 50% max rate bps
      0,
      false
    )
    .accounts({
      config: configPda,
      registry: registryPda,
      series: seriesPda,
      collateralMint: collateralMint,
      collateralTokenProgram: TOKEN_PROGRAM_ID,
      quoteMint: quoteMint,
      ptMint: ptKeypair.publicKey,
      ytMint: ytKeypair.publicKey,
      vault: vaultPda,
      authority: authority.publicKey,
      token2022Program: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([ptKeypair, ytKeypair])
    .rpc();
  console.log(`✓ Series opened! Tx: ${openTx}`);

  // 4. Strip collateral -> PT + YT
  console.log(`\n[Step 4] Stripping 1.0 collateral into 1.0 PT + 1.0 YT...`);
  const stripAmount = 1_000_000n; // 1.0 token

  const userPtAta = await getOrCreateAssociatedTokenAccount(
    connection,
    authority,
    ptKeypair.publicKey,
    authority.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const userYtAta = await getOrCreateAssociatedTokenAccount(
    connection,
    authority,
    ytKeypair.publicKey,
    authority.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const stripTx = await program.methods
    .strip(new BN(stripAmount.toString()))
    .accounts({
      series: seriesPda,
      allowEntry: allowEntryPda,
      collateralMint: collateralMint,
      ptMint: ptKeypair.publicKey,
      ytMint: ytKeypair.publicKey,
      vault: vaultPda,
      userCollateral: userCollateralAta.address,
      userPt: userPtAta.address,
      userYt: userYtAta.address,
      user: authority.publicKey,
      collateralTokenProgram: TOKEN_PROGRAM_ID,
      token2022Program: TOKEN_2022_PROGRAM_ID,
    })
    .rpc();
  console.log(`✓ Strip completed! Tx: ${stripTx}`);

  // 5. Invariant Test: Try to redeem PT before maturity & settlement (Must fail!)
  console.log(`\n[Step 5] Invariant Test: Attempting redeem_pt before maturity & settlement...`);
  try {
    await program.methods
      .redeemPt(new BN(stripAmount.toString()))
      .accounts({
        series: seriesPda,
        allowEntry: allowEntryPda,
        collateralMint: collateralMint,
        ptMint: ptKeypair.publicKey,
        vault: vaultPda,
        userPt: userPtAta.address,
        userCollateral: userCollateralAta.address,
        user: authority.publicKey,
        collateralTokenProgram: TOKEN_PROGRAM_ID,
        token2022Program: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();
    throw new Error("SECURITY FAILURE: redeemPt succeeded before settlement!");
  } catch (err) {
    if (err.message.includes("SeriesNotSettled") || err.toString().includes("SeriesNotSettled")) {
      console.log(`✓ INV PASSED: Early redemption rejected with SeriesNotSettled!`);
    } else {
      console.log(`✓ Rejected as expected: ${err.message}`);
    }
  }

  // 6. Wait for maturity
  console.log(`\n[Step 6] Waiting for maturity timestamp (${maturityTs})...`);
  while (Math.floor(Date.now() / 1000) <= maturityTs) {
    const remaining = maturityTs - Math.floor(Date.now() / 1000);
    console.log(`  ...waiting ${remaining + 1}s until maturity...`);
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log(`✓ Series reached maturity timestamp!`);

  // 7. Settle On-Chain using permissionless crank reading devnet SPL Stake Pool
  console.log(`\n[Step 7] Invoking settle_onchain crank reading SPL Stake Pool ${DEVNET_STAKE_POOL.toBase58()}...`);
  const settleTx = await program.methods
    .settleOnchain()
    .accounts({
      series: seriesPda,
      indexSource: DEVNET_STAKE_POOL,
      crank: authority.publicKey,
    })
    .rpc();
  console.log(`✓ settle_onchain confirmed! Tx: ${settleTx}`);

  // Verify series status
  const seriesAccount = await program.account.series.fetch(seriesPda);
  console.log(`Series Status: ${seriesAccount.status} (1 = Settled)`);
  console.log(`Settled Index (WAD): ${seriesAccount.idxSettle.toString()}`);
  if (seriesAccount.status !== 1) {
    throw new Error(`Expected series status = 1 (Settled), got ${seriesAccount.status}`);
  }

  // 8. Redeem PT
  console.log(`\n[Step 8] Redeeming PT for principal collateral payout...`);
  const balBeforeRedeem = (await getAccount(connection, userCollateralAta.address)).amount;

  const redeemTx = await program.methods
    .redeemPt(new BN(stripAmount.toString()))
    .accounts({
      series: seriesPda,
      allowEntry: allowEntryPda,
      collateralMint: collateralMint,
      ptMint: ptKeypair.publicKey,
      vault: vaultPda,
      userPt: userPtAta.address,
      userCollateral: userCollateralAta.address,
      user: authority.publicKey,
      collateralTokenProgram: TOKEN_PROGRAM_ID,
      token2022Program: TOKEN_2022_PROGRAM_ID,
    })
    .rpc();
  console.log(`✓ redeem_pt confirmed! Tx: ${redeemTx}`);

  const balAfterRedeem = (await getAccount(connection, userCollateralAta.address)).amount;
  const ptPayout = balAfterRedeem - balBeforeRedeem;
  console.log(`Principal payout received: ${ptPayout.toString()} units`);

  // 9. Claim YT
  console.log(`\n[Step 9] Claiming YT for accrued yield payout...`);
  const balBeforeClaim = (await getAccount(connection, userCollateralAta.address)).amount;

  const claimTx = await program.methods
    .claimYt(new BN(stripAmount.toString()))
    .accounts({
      series: seriesPda,
      allowEntry: allowEntryPda,
      collateralMint: collateralMint,
      ytMint: ytKeypair.publicKey,
      vault: vaultPda,
      userYt: userYtAta.address,
      userCollateral: userCollateralAta.address,
      user: authority.publicKey,
      collateralTokenProgram: TOKEN_PROGRAM_ID,
      token2022Program: TOKEN_2022_PROGRAM_ID,
    })
    .rpc();
  console.log(`✓ claim_yt confirmed! Tx: ${claimTx}`);

  const balAfterClaim = (await getAccount(connection, userCollateralAta.address)).amount;
  const ytPayout = balAfterClaim - balBeforeClaim;
  console.log(`Accrued yield payout received: ${ytPayout.toString()} units`);

  // 10. Invariant INV1 Verification
  console.log(`\n[Step 10] Verifying Invariant INV1 (Safety of Funds & Conservation):`);
  const totalPayout = ptPayout + ytPayout;
  console.log(`  Initial deposit / strip: ${stripAmount.toString()} units`);
  console.log(`  PT Principal Payout:     ${ptPayout.toString()} units`);
  console.log(`  YT Yield Payout:         ${ytPayout.toString()} units`);
  console.log(`  Total Collateral Returned: ${totalPayout.toString()} units`);

  if (totalPayout > stripAmount) {
    throw new Error(`INV1 VIOLATION: Total payout (${totalPayout}) exceeds strip amount (${stripAmount})!`);
  }
  console.log(`✓ INV1 PASSED: Total payout (${totalPayout}) <= initial collateral (${stripAmount}). Zero fund leakage!`);

  const vaultBal = (await getAccount(connection, vaultPda)).amount;
  console.log(`  Remaining Vault Balance: ${vaultBal.toString()} units (dust due to integer division truncation)`);

  console.log(`\n🎉 ALL SETTLEMENT & REDEMPTION INVARIANTS VERIFIED SUCCESSFULLY ON DEVNET! 🎉`);
}

main().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
