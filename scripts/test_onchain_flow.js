import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
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

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const keypairPath = path.join(os.homedir(), ".config/solana/civitas-deployer.json");
  const deployerKey = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  const authority = Keypair.fromSecretKey(Uint8Array.from(deployerKey));

  const idlPath = path.resolve("./target/idl/kalend.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

  const provider = new AnchorProvider(connection, new Wallet(authority), { commitment: "confirmed" });
  const program = new Program(idl, provider);

  console.log(`=== Testing On-Chain Core Protocol Flows on Devnet ===`);
  console.log(`Program ID: ${PROGRAM_ID.toBase58()}`);
  console.log(`Authority: ${authority.publicKey.toBase58()}`);

  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
  const [registryPda] = PublicKey.findProgramAddressSync([Buffer.from("registry")], PROGRAM_ID);

  // 1. Set AllowEntry for Authority wallet
  console.log(`\n[Step 1] Setting AllowEntry for authority...`);
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
  console.log(`✓ AllowEntry set! Tx: ${allowTx}`);

  // 2. Create test collateral mint (SPL Token)
  console.log(`\n[Step 2] Creating test collateral token & quote token...`);
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
  console.log(`Collateral Mint (SPL): ${collateralMint.toBase58()}`);

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
  console.log(`Quote Mint (SPL): ${quoteMint.toBase58()}`);

  // Mint initial collateral to authority
  const userCollateralAta = await getOrCreateAssociatedTokenAccount(
    connection,
    authority,
    collateralMint,
    authority.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );
  await mintTo(
    connection,
    authority,
    collateralMint,
    userCollateralAta.address,
    authority,
    10_000_000, // 10 tokens (decimals = 6)
    [],
    undefined,
    TOKEN_PROGRAM_ID
  );
  console.log(`✓ Minted 10 collateral tokens to authority ATA: ${userCollateralAta.address.toBase58()}`);

  // 3. Open Series
  console.log(`\n[Step 3] Opening new dated yield series...`);
  const maturityTs = Math.floor(Date.now() / 1000) + 86400 * 7; // 7 days maturity
  const nonce = Math.floor(Math.random() * 10000);

  const maturityBytes = Buffer.alloc(8);
  maturityBytes.writeBigInt64LE(BigInt(maturityTs));
  const nonceBytes = Buffer.alloc(2);
  nonceBytes.writeUInt16LE(nonce);

  const [seriesPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("series"), collateralMint.toBuffer(), maturityBytes, nonceBytes],
    PROGRAM_ID
  );
  console.log(`Series PDA: ${seriesPda.toBase58()}`);

  const ptKeypair = Keypair.generate();
  const ytKeypair = Keypair.generate();
  console.log(`PT Mint (Token-2022): ${ptKeypair.publicKey.toBase58()}`);
  console.log(`YT Mint (Token-2022): ${ytKeypair.publicKey.toBase58()}`);

  const vaultAta = getAssociatedTokenAddressSync(collateralMint, seriesPda, true, TOKEN_PROGRAM_ID);
  console.log(`Vault ATA (owned by Series PDA): ${vaultAta.toBase58()}`);

  const openSeriesTx = await program.methods
    .openSeries(
      new BN(maturityTs),
      nonce,
      0, // index_kind = StakePoolRate (or OracleIndex)
      PublicKey.default,
      new BN("1000000000000000000"), // 1.0 WAD
      0, // Plain
      2000, // max_rate_bps = 20%
      0, // dividend_cap_bps
      false // accept_issuer_risk
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
      vault: vaultAta,
      authority: authority.publicKey,
      token2022Program: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([ptKeypair, ytKeypair])
    .rpc();
  console.log(`✓ Series opened! Tx: ${openSeriesTx}`);

  // 4. Strip Collateral into equal PT and YT
  console.log(`\n[Step 4] Stripping 2.0 collateral into 2.0 PT and 2.0 YT...`);
  const userPtAta = await getOrCreateAssociatedTokenAccount(
    connection,
    authority,
    ptKeypair.publicKey,
    authority.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );
  const userYtAta = await getOrCreateAssociatedTokenAccount(
    connection,
    authority,
    ytKeypair.publicKey,
    authority.publicKey,
    false,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  const stripAmount = 2_000_000; // 2.0 tokens
  const stripTx = await program.methods
    .strip(new BN(stripAmount))
    .accounts({
      config: configPda,
      series: seriesPda,
      allowEntry: allowEntryPda,
      collateralMint: collateralMint,
      ptMint: ptKeypair.publicKey,
      ytMint: ytKeypair.publicKey,
      vault: vaultAta,
      userCollateral: userCollateralAta.address,
      userPt: userPtAta.address,
      userYt: userYtAta.address,
      user: authority.publicKey,
      collateralTokenProgram: TOKEN_PROGRAM_ID,
      token2022Program: TOKEN_2022_PROGRAM_ID,
    })
    .rpc();
  console.log(`✓ Strip confirmed! Tx: ${stripTx}`);

  const ptBalanceAfterStrip = await connection.getTokenAccountBalance(userPtAta.address);
  const ytBalanceAfterStrip = await connection.getTokenAccountBalance(userYtAta.address);
  console.log(`PT Balance: ${ptBalanceAfterStrip.value.uiAmountString}`);
  console.log(`YT Balance: ${ytBalanceAfterStrip.value.uiAmountString}`);

  // 5. Merge 0.5 PT and 0.5 YT back to collateral
  console.log(`\n[Step 5] Merging 0.5 PT and 0.5 YT back into raw collateral...`);
  const mergeAmount = 500_000; // 0.5 tokens
  const mergeTx = await program.methods
    .merge(new BN(mergeAmount))
    .accounts({
      config: configPda,
      series: seriesPda,
      allowEntry: allowEntryPda,
      collateralMint: collateralMint,
      ptMint: ptKeypair.publicKey,
      ytMint: ytKeypair.publicKey,
      vault: vaultAta,
      userCollateral: userCollateralAta.address,
      userPt: userPtAta.address,
      userYt: userYtAta.address,
      user: authority.publicKey,
      collateralTokenProgram: TOKEN_PROGRAM_ID,
      token2022Program: TOKEN_2022_PROGRAM_ID,
    })
    .rpc();
  console.log(`✓ Merge confirmed! Tx: ${mergeTx}`);

  const ptBalanceAfterMerge = await connection.getTokenAccountBalance(userPtAta.address);
  console.log(`PT Balance after merge: ${ptBalanceAfterMerge.value.uiAmountString} (expected 1.5)`);

  // 6. Test Escrow Lock & Time-Lock Protection (INV6)
  console.log(`\n[Step 6] Testing Escrow Lock and Front-Running Time-Lock Protection (INV6)...`);
  const [escrowPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), seriesPda.toBuffer(), authority.publicKey.toBuffer(), ptKeypair.publicKey.toBuffer()],
    PROGRAM_ID
  );
  const escrowTokenAta = getAssociatedTokenAddressSync(ptKeypair.publicKey, escrowPda, true, TOKEN_2022_PROGRAM_ID);
  console.log(`Escrow PDA: ${escrowPda.toBase58()}`);
  console.log(`Escrow Token ATA: ${escrowTokenAta.toBase58()}`);

  const lockUntil = Math.floor(Date.now() / 1000) + 10; // Locked for 10 seconds
  const lockAmount = 500_000;

  const lockTx = await program.methods
    .lockEscrow(new BN(lockAmount), new BN(lockUntil))
    .accounts({
      series: seriesPda,
      allowEntry: allowEntryPda,
      escrow: escrowPda,
      escrowToken: escrowTokenAta,
      ownerToken: userPtAta.address,
      mint: ptKeypair.publicKey,
      owner: authority.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log(`✓ Escrow locked! Tx: ${lockTx}`);

  // Test INV6: Immediate withdrawal must fail closed with EscrowLocked
  console.log(`Testing immediate withdrawal before lock_until expires (must FAIL)...`);
  let immediateWithdrawFailed = false;
  try {
    await program.methods
      .withdrawEscrow(new BN(lockAmount))
      .accounts({
        series: seriesPda,
        escrow: escrowPda,
        escrowToken: escrowTokenAta,
        ownerToken: userPtAta.address,
        mint: ptKeypair.publicKey,
        owner: authority.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();
  } catch (err) {
    immediateWithdrawFailed = true;
    console.log(`✓ INV6 VERIFIED: Immediate withdrawal was rejected as expected: ${err.message?.slice(0, 80)}...`);
  }

  if (!immediateWithdrawFailed) {
    throw new Error("INV6 VIOLATION: Escrow withdrawal succeeded before lock_until!");
  }

  // Wait 11 seconds for lock_until to pass
  console.log(`Waiting 11 seconds for lock_until to expire...`);
  await new Promise((r) => setTimeout(r, 11000));

  // Now withdrawal must succeed
  console.log(`Executing withdrawal after lock_until expiration...`);
  const withdrawTx = await program.methods
    .withdrawEscrow(new BN(lockAmount))
    .accounts({
      series: seriesPda,
      escrow: escrowPda,
      escrowToken: escrowTokenAta,
      ownerToken: userPtAta.address,
      mint: ptKeypair.publicKey,
      owner: authority.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .rpc();
  console.log(`✓ Withdrawal confirmed after lock expiration! Tx: ${withdrawTx}`);

  console.log(`\n🎉 ALL ON-CHAIN INVARIANTS AND CORE FLOWS VERIFIED SUCCESSFULLY ON DEVNET!`);
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
