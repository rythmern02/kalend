import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

async function auditRateSources() {
  console.log('=== AUDITING DEVNET RATE SOURCES ===');

  // 1. SPL Stake Pool
  const stakePoolPk = new PublicKey('HUnwAcgmfZf5x9BTKFuzXPqUna43xnz9ZZkbxNB7g66f');
  const poolAcc = await connection.getAccountInfo(stakePoolPk);
  console.log('1. SPL Stake Pool:');
  if (poolAcc) {
    console.log(`   Address: ${stakePoolPk.toBase58()}`);
    console.log(`   Owner: ${poolAcc.owner.toBase58()} (SPL Stake Pool Program)`);
    console.log(`   Data length: ${poolAcc.data.length} bytes`);
    console.log(`   Status: ACTIVE on Devnet`);
  } else {
    console.log(`   Status: NOT FOUND on Devnet`);
  }

  // 2. Pyth Treasury Feeds on Devnet
  console.log('\n2. Pyth Price Feeds on Devnet:');
  const solAcc = await connection.getAccountInfo(new PublicKey('J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix'));
  console.log(`   SOL/USD: ${solAcc ? 'ACTIVE on Devnet' : 'NOT FOUND'}`);

  const btcAcc = await connection.getAccountInfo(new PublicKey('HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J'));
  console.log(`   BTC/USD: ${btcAcc ? 'ACTIVE on Devnet' : 'NOT FOUND'}`);

  // Query Pyth Hermes API for Treasury feeds
  console.log('\n3. Pyth Hermes API Treasury Feeds Query:');
  try {
    const res = await fetch('https://hermes.pyth.network/v2/price_feeds?query=Treasury');
    if (res.ok) {
      const feeds = await res.json();
      console.log(`   Found ${feeds.length} Treasury feeds in Pyth directory:`);
      for (const f of feeds.slice(0, 5)) {
        console.log(`     - Feed ID: ${f.id} | Symbol: ${f.attributes?.symbol} | Asset Type: ${f.attributes?.asset_type}`);
      }
    } else {
      console.log(`   Hermes query failed with status ${res.status}`);
    }
  } catch (err) {
    console.log(`   Hermes fetch error: ${err.message}`);
  }

  // Also query Interest Rate / Yield feeds in Pyth
  try {
    const res2 = await fetch('https://hermes.pyth.network/v2/price_feeds?query=US');
    if (res2.ok) {
      const feeds2 = await res2.json();
      const yields = feeds2.filter(f => f.attributes?.asset_type === 'Interest Rate' || f.attributes?.symbol?.includes('Yield') || f.attributes?.symbol?.includes('Rate'));
      console.log(`   Found ${yields.length} Interest Rate / Yield feeds matching US:`);
      for (const f of yields.slice(0, 5)) {
        console.log(`     - Feed ID: ${f.id} | Symbol: ${f.attributes?.symbol}`);
      }
    }
  } catch (err) {}

  // 4. Ondo USDY
  console.log('\n4. Ondo USDY Mint on Devnet:');
  const usdyPk = new PublicKey('A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6');
  const usdyAcc = await connection.getAccountInfo(usdyPk);
  console.log(`   Mainnet USDY Mint (${usdyPk.toBase58()}): ${usdyAcc ? 'EXISTS' : 'NOT DEPLOYED ON DEVNET (Mainnet only)'}`);

  // 5. Backpack Securities API
  console.log('\n5. Backpack Securities API:');
  try {
    const res = await fetch('https://api.backpack.exchange/api/v1/assets');
    if (res.ok) {
      const data = await res.json();
      const count = Array.isArray(data) ? data.length : Object.keys(data).length;
      console.log(`   Backpack Exchange Public API: Reachable (HTTP 200, ${count} assets listed)`);
    } else {
      console.log(`   Backpack API returned status ${res.status}`);
    }
  } catch (err) {
    console.log(`   Backpack API error: ${err.message}`);
  }
}

auditRateSources().catch(console.error);
