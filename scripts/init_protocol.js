import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction, sendAndConfirmTransaction } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import os from "os";

const PROGRAM_ID = new PublicKey("Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527");
const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

// Ground truth G4 forwarder addresses from docs
const LIVE_FORWARDER_PROGRAM_DEVNET = new PublicKey("CXsKEJcs25TQEYU2e5jZ8QTPE3ffMLZhH6BWHrdcCCB5");
const LIVE_FORWARDER_STATE_DEVNET = new PublicKey("8QoomCQyPSkJ8WopJbX9B4HyvrFzziwvJdU8hZE6DCr9");

const MOCK_FORWARDER_PROGRAM_DEVNET = new PublicKey("7kuEAA3mSC1Tz8gQjnvH7bKFda9xSPRRin9SZbH49cNK");
const MOCK_FORWARDER_STATE_DEVNET = new PublicKey("5Tipz3yhTBdVsDbaBxZkrp7Gjf3brGq5SKkxReefPMP7");

import crypto from "crypto";

// Anchor instruction discriminators (sha256("global:<name>")[..8])
function getAnchorDiscriminator(name) {
  return crypto.createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const keypairPath = path.join(os.homedir(), ".config/solana/civitas-deployer.json");
  const deployerKey = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  const payer = Keypair.fromSecretKey(Uint8Array.from(deployerKey));

  console.log(`=== Kalend Devnet Protocol Initializer ===`);
  console.log(`Program ID: ${PROGRAM_ID.toBase58()}`);
  console.log(`Deployer / Authority: ${payer.publicKey.toBase58()}`);
  
  const balance = await connection.getBalance(payer.publicKey);
  console.log(`Deployer Balance: ${balance / 1e9} SOL`);

  // Derive PDAs
  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
  const [registryPda] = PublicKey.findProgramAddressSync([Buffer.from("registry")], PROGRAM_ID);
  const [rentVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("rent")], PROGRAM_ID);

  console.log(`Config PDA: ${configPda.toBase58()}`);
  console.log(`Registry PDA: ${registryPda.toBase58()}`);
  console.log(`RentVault PDA: ${rentVaultPda.toBase58()}`);

  const configInfo = await connection.getAccountInfo(configPda);

  if (!configInfo) {
    console.log(`Initializing Config, Registry, and RentVault...`);
    const initDiscriminator = crypto.createHash("sha256").update("global:initialize_config").digest().subarray(0, 8);
    
    // Arguments:
    // cluster_mode: u8 (1 = devnet)
    // enclave_key_hash: [u8; 32]
    // fee_bps: u16 (10 bps = 0.1%)
    // treasury: Pubkey (payer.publicKey)
    const enclaveKeyHash = Buffer.alloc(32, 0); // Placeholder until enclave key is sealed
    const buffer = Buffer.alloc(8 + 1 + 32 + 2 + 32);
    let offset = 0;
    initDiscriminator.copy(buffer, offset); offset += 8;
    buffer.writeUInt8(1, offset); offset += 1; // cluster_mode = 1 (Devnet)
    enclaveKeyHash.copy(buffer, offset); offset += 32;
    buffer.writeUInt16LE(10, offset); offset += 2; // fee_bps = 10 (0.1%)
    payer.publicKey.toBuffer().copy(buffer, offset); offset += 32;

    const ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: registryPda, isSigner: false, isWritable: true },
        { pubkey: rentVaultPda, isSigner: false, isWritable: false },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: buffer,
    });

    const tx = new Transaction().add(ix);
    const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
    console.log(`✓ initialize_config confirmed! Signature: ${sig}`);
  } else {
    console.log(`✓ Config already initialized.`);
  }

  // Register Forwarder Entry 0: Live Keystone Forwarder
  console.log(`Configuring Forwarder 0 (Live Devnet Keystone)...`);
  {
    const setForwarderDisc = crypto.createHash("sha256").update("global:set_forwarder_entry").digest().subarray(0, 8);
    // Arguments:
    // index: u8 (0)
    // program: Pubkey (32 bytes)
    // state: Pubkey (32 bytes)
    // allowed_workflow: [u8; 32] (all zeros = allow all workflows for devnet)
    const buffer = Buffer.alloc(8 + 1 + 32 + 32 + 32);
    let offset = 0;
    setForwarderDisc.copy(buffer, offset); offset += 8;
    buffer.writeUInt8(0, offset); offset += 1;
    LIVE_FORWARDER_PROGRAM_DEVNET.toBuffer().copy(buffer, offset); offset += 32;
    LIVE_FORWARDER_STATE_DEVNET.toBuffer().copy(buffer, offset); offset += 32;
    Buffer.alloc(32, 0).copy(buffer, offset); offset += 32;

    const ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      ],
      data: buffer,
    });
    const tx = new Transaction().add(ix);
    const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
    console.log(`✓ Forwarder 0 configured! Signature: ${sig}`);
  }

  // Register Forwarder Entry 1: Mock Forwarder (for CLI simulation & broadcast)
  console.log(`Configuring Forwarder 1 (Mock Devnet Forwarder)...`);
  {
    const setForwarderDisc = crypto.createHash("sha256").update("global:set_forwarder_entry").digest().subarray(0, 8);
    const buffer = Buffer.alloc(8 + 1 + 32 + 32 + 32);
    let offset = 0;
    setForwarderDisc.copy(buffer, offset); offset += 8;
    buffer.writeUInt8(1, offset); offset += 1;
    MOCK_FORWARDER_PROGRAM_DEVNET.toBuffer().copy(buffer, offset); offset += 32;
    MOCK_FORWARDER_STATE_DEVNET.toBuffer().copy(buffer, offset); offset += 32;
    Buffer.alloc(32, 0).copy(buffer, offset); offset += 32;

    const ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      ],
      data: buffer,
    });
    const tx = new Transaction().add(ix);
    const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
    console.log(`✓ Forwarder 1 configured! Signature: ${sig}`);
  }

  // Check RentVault balance and top up if needed
  const rentVaultBalance = await connection.getBalance(rentVaultPda);
  console.log(`RentVault balance: ${rentVaultBalance / 1e9} SOL`);
  if (rentVaultBalance < 0.05 * 1e9) {
    console.log(`Funding RentVault with 0.1 SOL for on_report rent subsidization...`);
    const fundIx = SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: rentVaultPda,
      lamports: 0.1 * 1e9,
    });
    const tx = new Transaction().add(fundIx);
    const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
    console.log(`✓ RentVault funded! Signature: ${sig}`);
  }

  console.log(`\n🎉 Protocol successfully initialized and active on Solana Devnet!`);
}

main().catch((err) => {
  console.error("Initialization failed:", err);
  process.exit(1);
});
