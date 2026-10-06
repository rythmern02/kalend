import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  createInitializeMintInstruction,
  createInitializeTransferHookInstruction,
  getMintLen,
  createInitializeConfidentialTransferMintInstruction,
} from '@solana/spl-token';
import fs from 'fs';
import path from 'path';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

// Load deployer keypair
const deployerKeyPath = path.resolve(process.env.HOME || '', '.config/solana/civitas-deployer.json');
let payer;
if (fs.existsSync(deployerKeyPath)) {
  const secretKey = JSON.parse(fs.readFileSync(deployerKeyPath, 'utf8'));
  payer = Keypair.fromSecretKey(Uint8Array.from(secretKey));
} else {
  payer = Keypair.generate();
}

console.log('====================================================');
console.log('       KALEND WP0: PROOF SPIKES AUDIT RUNNER       ');
console.log('====================================================');
console.log(`Cluster: Devnet (${RPC_URL})`);
console.log(`Payer: ${payer.publicKey.toBase58()}`);

async function runSpikes() {
  const results = {
    spikeA: null,
    spikeB: null,
    spikeC: {
      stakePool: null,
      pythTreasury: null,
      ondoUsdy: null,
      backpackSecurities: null,
    },
  };

  // -------------------------------------------------------------------------
  // SPIKE A: Devnet Mint with Both Extensions (ConfidentialTransfer + TransferHook)
  // -------------------------------------------------------------------------
  console.log('\n--- Spike A: Token-2022 Mint with Dual Extensions ---');
  try {
    const mintKeypair = Keypair.generate();
    const extensions = [
      ExtensionType.ConfidentialTransferMint,
      ExtensionType.TransferHook,
    ];
    const mintLen = getMintLen(extensions);
    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

    console.log(`Allocating space for Mint with ${extensions.length} extensions (Len: ${mintLen} bytes)...`);

    const dummyHookProgram = new PublicKey('7RE9DaArhevher2XmPAVVhvE3V3kT3bWRDEevQGSuyRQ');

    const tx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      // Initialize TransferHook extension
      createInitializeTransferHookInstruction(
        mintKeypair.publicKey,
        payer.publicKey,
        dummyHookProgram,
        TOKEN_2022_PROGRAM_ID
      ),
      // Initialize ConfidentialTransferMint extension
      createInitializeConfidentialTransferMintInstruction(
        mintKeypair.publicKey,
        payer.publicKey,
        true, // auto-approve new accounts
        null, // auditor ElGamal public key
        TOKEN_2022_PROGRAM_ID
      ),
      // Initialize Base Mint
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        6,
        payer.publicKey,
        null,
        TOKEN_2022_PROGRAM_ID
      )
    );

    console.log('Sending transaction to initialize dual-extension mint on Devnet...');
    const sig = await sendAndConfirmTransaction(connection, tx, [payer, mintKeypair], {
      commitment: 'confirmed',
    });
    console.log(`✓ Dual-Extension Mint created successfully on Devnet!`);
    console.log(`  Mint Address: ${mintKeypair.publicKey.toBase58()}`);
    console.log(`  Tx Signature: ${sig}`);

    results.spikeA = {
      pass: true,
      mint: mintKeypair.publicKey.toBase58(),
      signature: sig,
      details: 'Token-2022 successfully initialized both ConfidentialTransferMint and TransferHook on a single mint.',
    };
  } catch (err) {
    console.error(`✗ Spike A Failed:`, err.message);
    results.spikeA = {
      pass: false,
      error: err.message,
    };
  }

  // -------------------------------------------------------------------------
  // SPIKE B: Program-Owned Escrow PDA & Confidential Balances (G3 Analysis)
  // -------------------------------------------------------------------------
  console.log('\n--- Spike B: Program-Owned Escrow PDA & Confidential Proofs (G3) ---');
  console.log('Analyzing ZK Token Proof Program requirements:');
  console.log('  Native Program: ZkTokenProof1111111111111111111111111111111');
  console.log('  Instruction: VerifyZeroBalance / VerifyTransfer / VerifyTransferWithFee');
  console.log('  Cryptographic Requirement: Generates ElGamal ciphertext equality proof C = r*P + m*H');
  console.log('  Proof Generation Requires: ElGamal private key scalar (sk in Z_q)');
  console.log('  PDA Escrow Property: Seeds + Bump + ProgramID (No discrete log private key exists)');
  console.log('  Conclusion: A Solana Program Derived Address (PDA) cannot construct zero-knowledge ElGamal transfer proofs.');
  results.spikeB = {
    pdaCanProve: false,
    reason: 'PDA accounts have no ElGamal secret key scalar to compute equality proofs.',
    decisionRequired: 'Choose between (a) Plain Escrow, (b) Two-step signed settlement, or (c) Direct atomic wallet swap.',
  };

  // -------------------------------------------------------------------------
  // SPIKE C: Confirm Rate Sources on Devnet
  // -------------------------------------------------------------------------
  console.log('\n--- Spike C: Audit Available Rate Sources on Devnet ---');

  // 1. SPL Stake Pool
  const devnetPoolAddr = 'HUnwAcgmfZf5x9BTKFuzXPqUna43xnz9ZZkbxNB7g66f';
  try {
    const acc = await connection.getAccountInfo(new PublicKey(devnetPoolAddr));
    if (acc) {
      console.log(`✓ Devnet Stake Pool exists: ${devnetPoolAddr} (${acc.data.length} bytes, owner: ${acc.owner.toBase58()})`);
      results.spikeC.stakePool = {
        exists: true,
        address: devnetPoolAddr,
        owner: acc.owner.toBase58(),
      };
    } else {
      console.log(`✗ Devnet Stake Pool ${devnetPoolAddr} not found on Devnet.`);
      results.spikeC.stakePool = { exists: false };
    }
  } catch (e) {
    results.spikeC.stakePool = { exists: false, error: e.message };
  }

  // 2. Pyth U.S. Treasury Feeds on Devnet
  console.log('Auditing Pyth price feeds on Devnet...');
  const pythFeedsToCheck = [
    { name: 'SOL/USD', addr: 'J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix' },
    { name: 'BTC/USD', addr: 'HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J' },
    // Common Pyth Hermes / Devnet Treasury / Interest Rate Feeds
    { name: 'US3M (U.S. 3-Month T-Bill)', feedId: '0x17cf7b7ca2ee2741d8e13e8e19b5bf46b19a16f272a81878b321eb1ad578b948' },
    { name: 'USDY/USD', feedId: '0xe393441620c5d5d67710c66f4370f1a238692694b7964b4c7407519639537326' },
  ];

  for (const f of pythFeedsToCheck) {
    if (f.addr) {
      const acc = await connection.getAccountInfo(new PublicKey(f.addr));
      console.log(`  Pyth ${f.name} on Devnet: ${acc ? 'EXISTS (Account Active)' : 'MISSING'}`);
    }
  }

  // Check Pyth Hermes API for Devnet Treasury Rates
  try {
    const res = await fetch('https://hermes.pyth.network/v2/price_feeds?query=Treasury');
    if (res.ok) {
      const data = await res.json();
      console.log(`  Pyth Hermes Treasury Feeds found: ${data.length} feeds`);
      results.spikeC.pythTreasury = {
        availableOnHermes: data.length > 0,
        feedCount: data.length,
        feeds: data.slice(0, 3).map((d) => ({ id: d.id, symbol: d.attributes?.symbol })),
      };
    }
  } catch (e) {
    console.log(`  Pyth Hermes query failed: ${e.message}`);
    results.spikeC.pythTreasury = { availableOnHermes: false, error: e.message };
  }

  // 3. Ondo USDY on Devnet
  const ondoUsdyMainnet = 'A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6';
  try {
    const acc = await connection.getAccountInfo(new PublicKey(ondoUsdyMainnet));
    console.log(`  Ondo USDY (${ondoUsdyMainnet}) on Devnet: ${acc ? 'EXISTS' : 'NOT DEPLOYED ON DEVNET (Mainnet only)'}`);
    results.spikeC.ondoUsdy = {
      deployedOnDevnet: !!acc,
      mainnetAddress: ondoUsdyMainnet,
      note: acc ? 'Active' : 'Ondo USDY is not deployed on Devnet by Ondo Finance. Devnet test tokens required for Stage A.',
    };
  } catch (e) {
    results.spikeC.ondoUsdy = { deployedOnDevnet: false, error: e.message };
  }

  // 4. Backpack Securities API
  console.log('Auditing Backpack Exchange Public Securities API...');
  try {
    const res = await fetch('https://api.backpack.exchange/api/v1/assets');
    if (res.ok) {
      const assets = await res.json();
      console.log(`  Backpack Assets API: HTTP 200 OK (${assets.length || Object.keys(assets).length} assets listed)`);
      results.spikeC.backpackSecurities = {
        apiReachable: true,
        note: 'Backpack production API is reachable. No public sandbox/devnet API exists; read-only ticker calls supported.',
      };
    } else {
      results.spikeC.backpackSecurities = { apiReachable: false, status: res.status };
    }
  } catch (e) {
    results.spikeC.backpackSecurities = { apiReachable: false, error: e.message };
  }

  return results;
}

runSpikes().then((res) => {
  console.log('\n====================================================');
  console.log('             WP0 SPIKES COMPLETE SUMMARY            ');
  console.log('====================================================');
  console.log(JSON.stringify(res, null, 2));
});
