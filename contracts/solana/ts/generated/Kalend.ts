// Code generated — DO NOT EDIT.
import {
  getArrayCodec,
  getBooleanCodec,
  getI64Codec,
  getStructCodec,
  getU128Codec,
  getU16Codec,
  getU32Codec,
  getU64Codec,
  getU8Codec,
} from '@solana/codecs'
import { getAddressCodec, type Address } from '@solana/addresses'
import {
  adaptTrigger,
  anchorCPILogTriggerConfig,
  bytesToBase64,
  bytesToHex,
  calculateAccountsHash,
  encodeBorshVecU32,
  encodeForwarderReport,
  prepareSolanaReportRequest,
  prepareSubkeyValue,
  type Runtime,
  type SolanaAccountMeta,
  SolanaClient,
  solanaAccountMetasToJson,
  solanaAddressToBytes,
  type SolanaComputeConfig,
  type SolanaDecodedLog,
  type SolanaFilterLogTriggerRequestJson,
  type SolanaLog,
  type SolanaLogTriggerOptions,
  type SolanaSubkeyConfigJson,
  type SolanaValueComparatorJson,
  type Trigger,
} from '@chainlink/cre-sdk'

export const KALEND_PROGRAM_ID = 'Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527'

export const KALEND_IDL = {"address":"Ft4JURMocjXUYn8JspAgs4DkH92HAWFs5JDTMZstf527","metadata":{"name":"kalend","version":"0.1.0","spec":"0.1.0","description":"Private request-for-quote exchange for dated yield on Solana, settled through Chainlink CRE"},"instructions":[{"name":"accept_authority","docs":["Accepts pending governance authority"],"discriminator":[107,86,198,91,33,12,107,160],"accounts":[{"name":"config","writable":true,"pda":{"seeds":[{"kind":"const","value":[99,111,110,102,105,103]}]}},{"name":"pending_authority","signer":true}],"args":[]},{"name":"claim_yt","docs":["Claims accrued yield for settled YT tokens in raw collateral"],"discriminator":[241,29,138,19,166,210,32,191],"accounts":[{"name":"series","writable":true},{"name":"allow_entry","pda":{"seeds":[{"kind":"const","value":[97,108,108,111,119]},{"kind":"account","path":"user"}]}},{"name":"collateral_mint","relations":["series"]},{"name":"yt_mint","writable":true,"relations":["series"]},{"name":"vault","docs":["Raw collateral vault owned by Series PDA"],"writable":true,"relations":["series"]},{"name":"user_yt","docs":["User's YT token account to burn from"],"writable":true},{"name":"user_collateral","docs":["User's raw collateral destination account"],"writable":true},{"name":"user","writable":true,"signer":true},{"name":"collateral_token_program"},{"name":"token_2022_program"}],"args":[{"name":"amount","type":"u64"}]},{"name":"execute_fill","docs":["Permissionlessly executes an approved fill using an Address Lookup Table"],"discriminator":[214,179,24,216,219,100,181,21],"accounts":[{"name":"caller","writable":true,"signer":true},{"name":"requester"},{"name":"dealer"},{"name":"asset_mint"},{"name":"quote_mint","relations":["series"]},{"name":"asset_token_program"},{"name":"quote_token_program"},{"name":"fill_receipt","writable":true,"pda":{"seeds":[{"kind":"const","value":[102,105,108,108]},{"kind":"account","path":"fill_receipt.round_id","account":"FillReceipt"}]}},{"name":"series","relations":["requester_asset_escrow","dealer_quote_escrow"]},{"name":"allow_entry_requester","pda":{"seeds":[{"kind":"const","value":[97,108,108,111,119]},{"kind":"account","path":"requester"}]}},{"name":"allow_entry_dealer","pda":{"seeds":[{"kind":"const","value":[97,108,108,111,119]},{"kind":"account","path":"dealer"}]}},{"name":"requester_asset_escrow","writable":true,"pda":{"seeds":[{"kind":"const","value":[101,115,99,114,111,119]},{"kind":"account","path":"series"},{"kind":"account","path":"requester"},{"kind":"account","path":"asset_mint"}]}},{"name":"requester_asset_escrow_token","writable":true},{"name":"dealer_quote_escrow","writable":true,"pda":{"seeds":[{"kind":"const","value":[101,115,99,114,111,119]},{"kind":"account","path":"series"},{"kind":"account","path":"dealer"},{"kind":"account","path":"quote_mint"}]}},{"name":"dealer_quote_escrow_token","writable":true},{"name":"requester_quote_token","docs":["Requester destination account for quote currency"],"writable":true},{"name":"dealer_asset_token","docs":["Dealer destination account for asset currency (PT or YT)"],"writable":true}],"args":[]},{"name":"initialize_config","docs":["Initializes protocol global Config, Registry, and RentVault PDA"],"discriminator":[208,127,21,1,194,190,196,70],"accounts":[{"name":"config","writable":true,"pda":{"seeds":[{"kind":"const","value":[99,111,110,102,105,103]}]}},{"name":"registry","writable":true,"pda":{"seeds":[{"kind":"const","value":[114,101,103,105,115,116,114,121]}]}},{"name":"rent_vault","pda":{"seeds":[{"kind":"const","value":[114,101,110,116]}]}},{"name":"authority","writable":true,"signer":true},{"name":"system_program","address":"11111111111111111111111111111111"}],"args":[{"name":"cluster_mode","type":"u8"},{"name":"enclave_key_hash","type":{"array":["u8",32]}},{"name":"fee_bps","type":"u16"},{"name":"treasury","type":"pubkey"}]},{"name":"lock_escrow","docs":["Locks tokens into a program-owned Escrow PDA"],"discriminator":[55,16,5,80,13,102,206,104],"accounts":[{"name":"config","pda":{"seeds":[{"kind":"const","value":[99,111,110,102,105,103]}]}},{"name":"series"},{"name":"escrow","writable":true,"pda":{"seeds":[{"kind":"const","value":[101,115,99,114,111,119]},{"kind":"account","path":"series"},{"kind":"account","path":"owner"},{"kind":"account","path":"mint"}]}},{"name":"mint"},{"name":"escrow_token","docs":["Escrow token account owned by Escrow PDA (canonical ATA)"],"writable":true,"pda":{"seeds":[{"kind":"account","path":"escrow"},{"kind":"account","path":"token_program"},{"kind":"account","path":"mint"}],"program":{"kind":"const","value":[140,151,37,143,78,36,137,241,187,61,16,41,20,142,13,131,11,90,19,153,218,255,16,132,4,142,123,216,219,233,248,89]}}},{"name":"owner_token","docs":["Owner token source account"],"writable":true},{"name":"owner","writable":true,"signer":true},{"name":"token_program"},{"name":"associated_token_program","address":"ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"},{"name":"system_program","address":"11111111111111111111111111111111"}],"args":[{"name":"amount","type":"u64"},{"name":"lock_until","type":"i64"}]},{"name":"merge","docs":["Merges equal PT and YT tokens before maturity, releasing 1:1 raw collateral"],"discriminator":[148,141,236,47,174,126,69,111],"accounts":[{"name":"series","writable":true},{"name":"collateral_mint","relations":["series"]},{"name":"pt_mint","writable":true,"relations":["series"]},{"name":"yt_mint","writable":true,"relations":["series"]},{"name":"vault","docs":["Raw collateral vault owned by Series PDA"],"writable":true,"relations":["series"]},{"name":"user_collateral","docs":["User's raw collateral destination account"],"writable":true},{"name":"user_pt","docs":["User's PT source account"],"writable":true},{"name":"user_yt","docs":["User's YT source account"],"writable":true},{"name":"user","writable":true,"signer":true},{"name":"collateral_token_program"},{"name":"token_2022_program"}],"args":[{"name":"amount","type":"u64"}]},{"name":"on_report","docs":["Receives and processes reports from Chainlink Keystone Forwarder CPI"],"discriminator":[214,173,18,221,173,148,151,208],"accounts":[{"name":"state"},{"name":"forwarder_authority","docs":["Signer PDA derived by the forwarder: [\"forwarder\", forwarderState, receiverProgram]"],"signer":true}],"args":[{"name":"metadata","type":"bytes"},{"name":"report","type":"bytes"}]},{"name":"open_series","docs":["Deploys a new dated yield Series with PT/YT Token-2022 mints"],"discriminator":[73,68,8,212,30,76,206,3],"accounts":[{"name":"config","pda":{"seeds":[{"kind":"const","value":[99,111,110,102,105,103]}]}},{"name":"registry","writable":true,"pda":{"seeds":[{"kind":"const","value":[114,101,103,105,115,116,114,121]}]}},{"name":"series","writable":true,"pda":{"seeds":[{"kind":"const","value":[115,101,114,105,101,115]},{"kind":"account","path":"collateral_mint"},{"kind":"arg","path":"maturity_ts"},{"kind":"arg","path":"nonce"}]}},{"name":"collateral_mint","docs":["Raw collateral mint"]},{"name":"collateral_token_program","docs":["Program owning the collateral mint (Token or Token-2022)"]},{"name":"quote_mint","docs":["Quote asset mint"]},{"name":"pt_mint","docs":["Principal Token (PT) Token-2022 mint"],"writable":true,"signer":true},{"name":"yt_mint","docs":["Yield Token (YT) Token-2022 mint"],"writable":true,"signer":true},{"name":"vault","docs":["Vault account holding raw collateral (canonical ATA owned by Series PDA)"],"writable":true,"pda":{"seeds":[{"kind":"account","path":"series"},{"kind":"account","path":"collateral_token_program"},{"kind":"account","path":"collateral_mint"}],"program":{"kind":"const","value":[140,151,37,143,78,36,137,241,187,61,16,41,20,142,13,131,11,90,19,153,218,255,16,132,4,142,123,216,219,233,248,89]}}},{"name":"authority","writable":true,"signer":true,"relations":["config"]},{"name":"token_2022_program"},{"name":"associated_token_program","address":"ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"},{"name":"system_program","address":"11111111111111111111111111111111"}],"args":[{"name":"maturity_ts","type":"i64"},{"name":"nonce","type":"u16"},{"name":"index_kind","type":"u8"},{"name":"index_source","type":"pubkey"},{"name":"idx_open","type":"u128"},{"name":"privacy_mode","type":"u8"},{"name":"max_rate_bps","type":"u32"},{"name":"dividend_cap_bps","type":"u32"},{"name":"accept_issuer_risk","type":"bool"}]},{"name":"pause_global","docs":["Toggles global protocol pause"],"discriminator":[66,34,235,8,99,203,107,161],"accounts":[{"name":"config","writable":true,"pda":{"seeds":[{"kind":"const","value":[99,111,110,102,105,103]}]}},{"name":"authority","signer":true,"relations":["config"]}],"args":[{"name":"paused","type":"bool"}]},{"name":"pause_series","docs":["Toggles pause on an individual Series"],"discriminator":[234,22,6,47,199,248,152,204],"accounts":[{"name":"config","pda":{"seeds":[{"kind":"const","value":[99,111,110,102,105,103]}]}},{"name":"series","writable":true},{"name":"authority","signer":true,"relations":["config"]}],"args":[{"name":"paused","type":"bool"}]},{"name":"propose_authority","docs":["Proposes a new governance authority (two-step transfer)"],"discriminator":[20,148,236,198,76,119,99,142],"accounts":[{"name":"config","writable":true,"pda":{"seeds":[{"kind":"const","value":[99,111,110,102,105,103]}]}},{"name":"authority","signer":true,"relations":["config"]}],"args":[{"name":"new_authority","type":"pubkey"}]},{"name":"redeem_pt","docs":["Redeems settled PT tokens for in-kind raw principal collateral"],"discriminator":[249,183,230,236,7,233,13,212],"accounts":[{"name":"series","writable":true},{"name":"allow_entry","pda":{"seeds":[{"kind":"const","value":[97,108,108,111,119]},{"kind":"account","path":"user"}]}},{"name":"collateral_mint","relations":["series"]},{"name":"pt_mint","writable":true,"relations":["series"]},{"name":"vault","docs":["Raw collateral vault owned by Series PDA"],"writable":true,"relations":["series"]},{"name":"user_pt","docs":["User's PT token account to burn from"],"writable":true},{"name":"user_collateral","docs":["User's raw collateral destination account"],"writable":true},{"name":"user","writable":true,"signer":true},{"name":"collateral_token_program"},{"name":"token_2022_program"}],"args":[{"name":"amount","type":"u64"}]},{"name":"remove_allow_entry","docs":["Closes an AllowEntry account"],"discriminator":[94,199,210,223,195,7,12,164],"accounts":[{"name":"config","pda":{"seeds":[{"kind":"const","value":[99,111,110,102,105,103]}]}},{"name":"allow_entry","writable":true,"pda":{"seeds":[{"kind":"const","value":[97,108,108,111,119]},{"kind":"arg","path":"wallet"}]}},{"name":"authority","writable":true,"signer":true,"relations":["config"]}],"args":[{"name":"wallet","type":"pubkey"}]},{"name":"set_allow_entry","docs":["Sets or updates a wallet's AllowEntry permissions and expiration"],"discriminator":[163,128,74,191,122,89,227,24],"accounts":[{"name":"config","pda":{"seeds":[{"kind":"const","value":[99,111,110,102,105,103]}]}},{"name":"allow_entry","writable":true,"pda":{"seeds":[{"kind":"const","value":[97,108,108,111,119]},{"kind":"arg","path":"wallet"}]}},{"name":"authority","writable":true,"signer":true,"relations":["config"]},{"name":"system_program","address":"11111111111111111111111111111111"}],"args":[{"name":"wallet","type":"pubkey"},{"name":"roles","type":"u8"},{"name":"expiry_ts","type":"i64"}]},{"name":"set_forwarder_entry","docs":["Updates or registers a forwarder entry in Config"],"discriminator":[224,133,157,27,61,56,228,196],"accounts":[{"name":"config","writable":true,"pda":{"seeds":[{"kind":"const","value":[99,111,110,102,105,103]}]}},{"name":"authority","signer":true,"relations":["config"]}],"args":[{"name":"index","type":"u8"},{"name":"program","type":"pubkey"},{"name":"state","type":"pubkey"},{"name":"allowed_workflow","type":{"array":["u8",32]}}]},{"name":"settle_onchain","docs":["Permissionless onchain settlement crank for StakePoolRate series"],"discriminator":[141,28,98,52,171,123,63,233],"accounts":[{"name":"series","writable":true},{"name":"index_source","relations":["series"]},{"name":"crank","writable":true,"signer":true}],"args":[]},{"name":"strip","docs":["Strips raw collateral into equal 1:1 PT and YT tokens"],"discriminator":[246,68,231,141,62,163,189,126],"accounts":[{"name":"config","pda":{"seeds":[{"kind":"const","value":[99,111,110,102,105,103]}]}},{"name":"series","writable":true},{"name":"allow_entry","docs":["AllowEntry validating the user has the Strip role"],"pda":{"seeds":[{"kind":"const","value":[97,108,108,111,119]},{"kind":"account","path":"user"}]}},{"name":"collateral_mint","relations":["series"]},{"name":"pt_mint","writable":true,"relations":["series"]},{"name":"yt_mint","writable":true,"relations":["series"]},{"name":"vault","docs":["Raw collateral vault owned by Series PDA"],"writable":true,"relations":["series"]},{"name":"user_collateral","docs":["User's raw collateral source account"],"writable":true},{"name":"user_pt","docs":["User's PT destination account"],"writable":true},{"name":"user_yt","docs":["User's YT destination account"],"writable":true},{"name":"user","writable":true,"signer":true},{"name":"collateral_token_program"},{"name":"token_2022_program"}],"args":[{"name":"amount","type":"u64"}]},{"name":"withdraw_escrow","docs":["Withdraws tokens from Escrow PDA after lock_until expires"],"discriminator":[81,84,226,128,245,47,96,104],"accounts":[{"name":"series"},{"name":"escrow","writable":true,"pda":{"seeds":[{"kind":"const","value":[101,115,99,114,111,119]},{"kind":"account","path":"series"},{"kind":"account","path":"owner"},{"kind":"account","path":"mint"}]}},{"name":"mint","relations":["escrow"]},{"name":"escrow_token","docs":["Escrow token account owned by Escrow PDA (canonical ATA)"],"writable":true,"pda":{"seeds":[{"kind":"account","path":"escrow"},{"kind":"account","path":"token_program"},{"kind":"account","path":"mint"}],"program":{"kind":"const","value":[140,151,37,143,78,36,137,241,187,61,16,41,20,142,13,131,11,90,19,153,218,255,16,132,4,142,123,216,219,233,248,89]}}},{"name":"owner_token","docs":["Owner destination token account"],"writable":true},{"name":"owner","writable":true,"signer":true,"relations":["escrow"]},{"name":"token_program"}],"args":[{"name":"amount","type":"u64"}]}],"accounts":[{"name":"AllowEntry","discriminator":[3,29,6,254,2,209,219,245]},{"name":"Config","discriminator":[155,12,170,224,30,250,204,130]},{"name":"Escrow","discriminator":[31,213,123,187,186,22,218,155]},{"name":"FillReceipt","discriminator":[8,10,169,84,163,19,167,139]},{"name":"Registry","discriminator":[47,174,110,246,184,182,252,218]},{"name":"Series","discriminator":[240,97,8,183,139,77,250,162]}],"events":[{"name":"AllowEntryRemoved","discriminator":[116,251,75,240,62,90,18,157]},{"name":"AllowEntrySet","discriminator":[167,199,136,57,136,245,22,172]},{"name":"AuthorityTransferAccepted","discriminator":[149,165,140,221,104,203,239,121]},{"name":"AuthorityTransferProposed","discriminator":[103,244,27,116,177,4,100,119]},{"name":"ConfigInitialized","discriminator":[181,49,200,156,19,167,178,91]},{"name":"EscrowLocked","discriminator":[128,116,18,115,200,133,30,120]},{"name":"EscrowWithdrawn","discriminator":[43,206,174,47,105,219,216,239]},{"name":"FillExecuted","discriminator":[130,21,84,56,205,123,241,212]},{"name":"ForwarderUpdated","discriminator":[91,195,248,117,50,125,217,251]},{"name":"GlobalPauseToggled","discriminator":[98,104,111,190,104,173,74,236]},{"name":"PtRedeemed","discriminator":[211,121,97,51,47,225,196,226]},{"name":"ReceivedFillReport","discriminator":[33,25,166,53,204,250,100,221]},{"name":"ReceivedRateReport","discriminator":[144,204,54,24,180,131,122,96]},{"name":"ReceivedSettleReport","discriminator":[166,67,123,98,54,242,171,223]},{"name":"SeriesOpened","discriminator":[203,170,78,184,137,221,220,207]},{"name":"SeriesPauseToggled","discriminator":[209,58,205,83,87,114,26,192]},{"name":"TokensMerged","discriminator":[178,179,160,81,141,143,120,66]},{"name":"TokensStripped","discriminator":[31,89,157,156,133,187,88,16]},{"name":"YtClaimed","discriminator":[34,184,60,58,11,207,243,152]}],"errors":[{"code":6000,"name":"Unauthorized","msg":"Unauthorized: Caller is not the authorized protocol authority"},{"code":6001,"name":"PendingAuthorityMismatch","msg":"PendingAuthorityMismatch: Caller is not the designated pending authority"},{"code":6002,"name":"ProtocolPaused","msg":"ProtocolPaused: Protocol is currently paused by governance"},{"code":6003,"name":"SeriesPaused","msg":"SeriesPaused: Target series is currently paused"},{"code":6004,"name":"SeriesNotOpen","msg":"SeriesNotOpen: Series status is not Open"},{"code":6005,"name":"SeriesAlreadySettled","msg":"SeriesAlreadySettled: Series is already settled"},{"code":6006,"name":"SeriesMaturityNotReached","msg":"SeriesMaturityNotReached: Cannot settle series prior to maturity timestamp"},{"code":6007,"name":"SeriesAlreadyMatured","msg":"SeriesAlreadyMatured: Cannot strip or merge series at or after maturity timestamp"},{"code":6008,"name":"SeriesNotSettled","msg":"SeriesNotSettled: Redemptions and claims require settled series"},{"code":6009,"name":"MaturityInPast","msg":"MaturityInPast: Series maturity timestamp must be in the future"},{"code":6010,"name":"InvalidCollateralMint","msg":"InvalidCollateralMint: Collateral mint does not conform to extension safety policy"},{"code":6011,"name":"DisallowedCollateralExtension","msg":"DisallowedCollateralExtension: Mint carries a forbidden Token-2022 extension"},{"code":6012,"name":"InvalidAllowEntry","msg":"InvalidAllowEntry: Wallet has no valid or active AllowEntry"},{"code":6013,"name":"AllowEntryExpired","msg":"AllowEntryExpired: AllowEntry has passed its expiration timestamp"},{"code":6014,"name":"MissingRole","msg":"MissingRole: Wallet lacks the required role bit for this instruction"},{"code":6015,"name":"EscrowLocked","msg":"EscrowLocked: Escrow funds cannot be withdrawn before lock_until timestamp"},{"code":6016,"name":"InsufficientEscrowBalance","msg":"InsufficientEscrowBalance: Escrow does not hold sufficient tokens"},{"code":6017,"name":"InvalidForwarderProgram","msg":"InvalidForwarderProgram: Forwarder program is not registered in Config"},{"code":6018,"name":"InvalidForwarderState","msg":"InvalidForwarderState: Forwarder state account does not match registered forwarder"},{"code":6019,"name":"InvalidForwarderAuthority","msg":"InvalidForwarderAuthority: forwarder_authority signer does not match PDA derivation"},{"code":6020,"name":"InvalidWorkflowIdentity","msg":"InvalidWorkflowIdentity: Workflow ID or owner does not match allowed forwarder entry"},{"code":6021,"name":"InvalidReportPayload","msg":"InvalidReportPayload: Malformed or unparseable report payload"},{"code":6022,"name":"TrailingReportBytes","msg":"TrailingReportBytes: Trailing bytes detected after decoding report payload"},{"code":6023,"name":"UnsupportedReportVersion","msg":"UnsupportedReportVersion: Report version is not supported"},{"code":6024,"name":"UnknownReportKind","msg":"UnknownReportKind: Report kind must be 1 (Fill), 2 (Settle), or 3 (Rate)"},{"code":6025,"name":"RateExceedsCap","msg":"RateExceedsCap: Implied or observed rate exceeds series max_rate_bps cap"},{"code":6026,"name":"DividendBandExceeded","msg":"DividendBandExceeded: Dividend growth index outside configured band; series disputed"},{"code":6027,"name":"RoundExpired","msg":"RoundExpired: Fill report received after not_after timestamp expiration"},{"code":6028,"name":"FillAlreadyExecuted","msg":"FillAlreadyExecuted: Fill receipt has already been executed"},{"code":6029,"name":"FillNotApproved","msg":"FillNotApproved: Fill receipt is not in Approved status"},{"code":6030,"name":"SeriesMismatch","msg":"SeriesMismatch: Series specified does not match FillReceipt or report"},{"code":6031,"name":"TokenMismatch","msg":"TokenMismatch: Escrow or mint token account does not match series specifications"},{"code":6032,"name":"PartyMismatch","msg":"PartyMismatch: Wallet does not match requester or dealer in FillReceipt"},{"code":6033,"name":"MathOverflow","msg":"MathOverflow: Arithmetic calculation encountered an overflow or division by zero"},{"code":6034,"name":"InvalidIndex","msg":"InvalidIndex: Settlement index must be positive"},{"code":6035,"name":"ZeroAmount","msg":"ZeroAmount: Amount must be greater than zero"},{"code":6036,"name":"RegistryFull","msg":"RegistryFull: Series registry has reached its maximum limit (64 series)"},{"code":6037,"name":"MockForwarderForbidden","msg":"MockForwarderForbidden: Mock forwarder address is strictly rejected in mainnet builds"}],"types":[{"name":"AllowEntry","type":{"kind":"struct","fields":[{"name":"wallet","docs":["Whitelisted wallet address"],"type":"pubkey"},{"name":"expiry_ts","docs":["Unix timestamp when this allow entry expires"],"type":"i64"},{"name":"roles","docs":["Bitmask of permitted actions (see roles module)"],"type":"u8"},{"name":"bump","docs":["PDA bump seed"],"type":"u8"}]}},{"name":"AllowEntryRemoved","type":{"kind":"struct","fields":[{"name":"wallet","type":"pubkey"}]}},{"name":"AllowEntrySet","type":{"kind":"struct","fields":[{"name":"wallet","type":"pubkey"},{"name":"roles","type":"u8"},{"name":"expiry_ts","type":"i64"}]}},{"name":"AuthorityTransferAccepted","type":{"kind":"struct","fields":[{"name":"old_authority","type":"pubkey"},{"name":"new_authority","type":"pubkey"}]}},{"name":"AuthorityTransferProposed","type":{"kind":"struct","fields":[{"name":"current_authority","type":"pubkey"},{"name":"pending_authority","type":"pubkey"}]}},{"name":"Config","type":{"kind":"struct","fields":[{"name":"authority","docs":["Protocol governance authority"],"type":"pubkey"},{"name":"pending_authority","docs":["Pending authority for two-step transfer"],"type":"pubkey"},{"name":"forwarders","docs":["Registered forwarders (up to 2: on Devnet, 1 live Keystone + 1 mock simulator forwarder)"],"type":{"array":[{"defined":{"name":"ForwarderEntry"}},2]}},{"name":"forwarder_count","docs":["Number of active forwarders in the array"],"type":"u8"},{"name":"enclave_key_hash","docs":["Published SHA-256 hash of the TEE enclave X25519 public key"],"type":{"array":["u8",32]}},{"name":"paused","docs":["Global emergency pause flag"],"type":"bool"},{"name":"cluster_mode","docs":["Cluster mode: 0 = Local, 1 = Devnet, 2 = Mainnet"],"type":"u8"},{"name":"fee_bps","docs":["Protocol fee in basis points (0 for v1)"],"type":"u16"},{"name":"treasury","docs":["Protocol fee treasury"],"type":"pubkey"},{"name":"bump","docs":["PDA bump seed"],"type":"u8"}]}},{"name":"ConfigInitialized","type":{"kind":"struct","fields":[{"name":"authority","type":"pubkey"},{"name":"cluster_mode","type":"u8"}]}},{"name":"Escrow","type":{"kind":"struct","fields":[{"name":"owner","docs":["Owner wallet that deposited the escrowed tokens"],"type":"pubkey"},{"name":"series","docs":["Associated series PDA"],"type":"pubkey"},{"name":"mint","docs":["Token mint held in escrow (PT, YT, or quote token)"],"type":"pubkey"},{"name":"lock_until","docs":["Unix timestamp before which the owner cannot withdraw"],"type":"i64"},{"name":"amount","docs":["Current quantity of tokens locked in escrow"],"type":"u64"},{"name":"bump","docs":["PDA bump seed"],"type":"u8"}]}},{"name":"EscrowLocked","type":{"kind":"struct","fields":[{"name":"series","type":"pubkey"},{"name":"owner","type":"pubkey"},{"name":"mint","type":"pubkey"},{"name":"amount","type":"u64"},{"name":"lock_until","type":"i64"}]}},{"name":"EscrowWithdrawn","type":{"kind":"struct","fields":[{"name":"series","type":"pubkey"},{"name":"owner","type":"pubkey"},{"name":"mint","type":"pubkey"},{"name":"amount","type":"u64"}]}},{"name":"FillExecuted","type":{"kind":"struct","fields":[{"name":"round_id","type":{"array":["u8",32]}},{"name":"series","type":"pubkey"},{"name":"requester","type":"pubkey"},{"name":"dealer","type":"pubkey"},{"name":"asset_amount","type":"u64"},{"name":"quote_amount","type":"u64"}]}},{"name":"FillReceipt","type":{"kind":"struct","fields":[{"name":"round_id","docs":["Unique round ID (32 bytes), acts as the global replay guard"],"type":{"array":["u8",32]}},{"name":"series","docs":["Series PDA traded in this fill"],"type":"pubkey"},{"name":"requester","docs":["Requester wallet address"],"type":"pubkey"},{"name":"dealer","docs":["Winning dealer wallet address"],"type":"pubkey"},{"name":"side","docs":["0 = SellPT, 1 = SellYT"],"type":"u8"},{"name":"asset_amount","docs":["Quantity of asset tokens (PT or YT) filled"],"type":"u64"},{"name":"quote_amount","docs":["Quantity of quote tokens paid"],"type":"u64"},{"name":"quote_mint","docs":["Quote currency mint"],"type":"pubkey"},{"name":"ts","docs":["Unix timestamp of receipt creation"],"type":"i64"},{"name":"report_hash","docs":["Hash of the signed forwarder report"],"type":{"array":["u8",32]}},{"name":"status","docs":["Fill lifecycle status: 0 = Approved, 1 = Executed"],"type":"u8"},{"name":"bump","docs":["PDA bump seed"],"type":"u8"}]}},{"name":"FillReport","type":{"kind":"struct","fields":[{"name":"kind","type":"u8"},{"name":"version","type":"u8"},{"name":"round_id","type":{"array":["u8",32]}},{"name":"series","type":"pubkey"},{"name":"side","type":"u8"},{"name":"requester","type":"pubkey"},{"name":"dealer","type":"pubkey"},{"name":"asset_amount","type":"u64"},{"name":"quote_amount","type":"u64"},{"name":"quote_mint","type":"pubkey"},{"name":"not_after","type":"i64"}]}},{"name":"ForwarderEntry","type":{"kind":"struct","fields":[{"name":"program","docs":["Keystone forwarder program address"],"type":"pubkey"},{"name":"state","docs":["Keystone forwarder state account"],"type":"pubkey"},{"name":"allowed_workflow","docs":["Authorized workflow ID (32 bytes) that may submit reports through this forwarder"],"type":{"array":["u8",32]}}]}},{"name":"ForwarderUpdated","type":{"kind":"struct","fields":[{"name":"index","type":"u8"},{"name":"program","type":"pubkey"},{"name":"state","type":"pubkey"},{"name":"allowed_workflow","type":{"array":["u8",32]}}]}},{"name":"GlobalPauseToggled","type":{"kind":"struct","fields":[{"name":"paused","type":"bool"}]}},{"name":"PtRedeemed","type":{"kind":"struct","fields":[{"name":"series","type":"pubkey"},{"name":"user","type":"pubkey"},{"name":"pt_amount","type":"u64"},{"name":"raw_collateral_received","type":"u64"}]}},{"name":"RateReport","type":{"kind":"struct","fields":[{"name":"kind","type":"u8"},{"name":"version","type":"u8"},{"name":"benchmark_id","type":{"array":["u8",8]}},{"name":"rate_bps","type":"i64"},{"name":"window_end","type":"i64"}]}},{"name":"ReceivedFillReport","type":{"kind":"struct","fields":[{"name":"report","type":{"defined":{"name":"FillReport"}}},{"name":"report_hash","type":{"array":["u8",32]}}]}},{"name":"ReceivedRateReport","type":{"kind":"struct","fields":[{"name":"report","type":{"defined":{"name":"RateReport"}}}]}},{"name":"ReceivedSettleReport","type":{"kind":"struct","fields":[{"name":"report","type":{"defined":{"name":"SettleReport"}}},{"name":"series","type":"pubkey"},{"name":"idx_settle","type":"u128"}]}},{"name":"Registry","type":{"kind":"struct","fields":[{"name":"count","docs":["Active series count"],"type":"u16"},{"name":"series","docs":["Up to 64 active series pubkeys"],"type":{"vec":"pubkey"}},{"name":"bump","docs":["PDA bump seed"],"type":"u8"}]}},{"name":"Series","type":{"kind":"struct","fields":[{"name":"collateral_mint","docs":["Collateral token mint (Token or Token-2022)"],"type":"pubkey"},{"name":"collateral_program","docs":["Token program owning the collateral mint (Token or Token-2022)"],"type":"pubkey"},{"name":"quote_mint","docs":["Denominated quote currency mint (e.g. wSOL for staking, USDC for equities)"],"type":"pubkey"},{"name":"index_kind","docs":["Yield index type: 0 = StakePoolRate, 1 = ScaledUiDividendAdjusted, 2 = OracleIndex"],"type":"u8"},{"name":"index_source","docs":["Source account or pubkey for the index (e.g. stake pool account or price feed)"],"type":"pubkey"},{"name":"idx_open","docs":["Index value at series opening, scaled by WAD (1e18)"],"type":"u128"},{"name":"open_ts","docs":["Unix timestamp when the series was created"],"type":"i64"},{"name":"maturity_ts","docs":["Unix timestamp when the series reaches maturity"],"type":"i64"},{"name":"pt_mint","docs":["Principal Token (PT) Token-2022 mint address"],"type":"pubkey"},{"name":"yt_mint","docs":["Yield Token (YT) Token-2022 mint address"],"type":"pubkey"},{"name":"vault","docs":["Vault account (ATA) owned by this Series PDA holding raw collateral"],"type":"pubkey"},{"name":"status","docs":["Current lifecycle status: 0 = Open, 1 = Settled, 2 = Disputed, 3 = Paused"],"type":"u8"},{"name":"idx_settle","docs":["Settled index value scaled by WAD (1e18)"],"type":"u128"},{"name":"split_num","docs":["Cumulative corporate split factor numerator (1 if no split)"],"type":"u32"},{"name":"split_den","docs":["Cumulative corporate split factor denominator (1 if no split)"],"type":"u32"},{"name":"settled_ts","docs":["Unix timestamp when settlement occurred"],"type":"i64"},{"name":"privacy_mode","docs":["Privacy mode: 0 = Plain, 1 = Confidential (immutable)"],"type":"u8"},{"name":"max_rate_bps","docs":["Maximum allowable annualized rate in basis points (sanity cap)"],"type":"u32"},{"name":"dividend_cap_bps","docs":["Maximum allowable dividend increase in basis points (sanity cap for equities)"],"type":"u32"},{"name":"nonce","docs":["Nonce to allow distinct series with the same collateral and maturity"],"type":"u16"},{"name":"bump","docs":["PDA bump seed"],"type":"u8"}]}},{"name":"SeriesOpened","type":{"kind":"struct","fields":[{"name":"series","type":"pubkey"},{"name":"collateral_mint","type":"pubkey"},{"name":"quote_mint","type":"pubkey"},{"name":"pt_mint","type":"pubkey"},{"name":"yt_mint","type":"pubkey"},{"name":"open_ts","type":"i64"},{"name":"maturity_ts","type":"i64"},{"name":"idx_open","type":"u128"}]}},{"name":"SeriesPauseToggled","type":{"kind":"struct","fields":[{"name":"series","type":"pubkey"},{"name":"paused","type":"bool"}]}},{"name":"SettleReport","type":{"kind":"struct","fields":[{"name":"kind","type":"u8"},{"name":"version","type":"u8"},{"name":"series","type":"pubkey"},{"name":"observed_ts","type":"i64"},{"name":"index_wad","type":"u128"},{"name":"split_num","type":"u32"},{"name":"split_den","type":"u32"}]}},{"name":"TokensMerged","type":{"kind":"struct","fields":[{"name":"series","type":"pubkey"},{"name":"user","type":"pubkey"},{"name":"amount","type":"u64"}]}},{"name":"TokensStripped","type":{"kind":"struct","fields":[{"name":"series","type":"pubkey"},{"name":"user","type":"pubkey"},{"name":"amount","type":"u64"}]}},{"name":"YtClaimed","type":{"kind":"struct","fields":[{"name":"series","type":"pubkey"},{"name":"user","type":"pubkey"},{"name":"yt_amount","type":"u64"},{"name":"raw_collateral_received","type":"u64"}]}}]} as const

// Base64 of the compact IDL JSON, passed to log triggers as contractIdlJson.
const KALEND_IDL_BASE64 = 'eyJhZGRyZXNzIjoiRnQ0SlVSTW9jalhVWW44SnNwQWdzNERrSDkySEFXRnM1SkRUTVpzdGY1MjciLCJtZXRhZGF0YSI6eyJuYW1lIjoia2FsZW5kIiwidmVyc2lvbiI6IjAuMS4wIiwic3BlYyI6IjAuMS4wIiwiZGVzY3JpcHRpb24iOiJQcml2YXRlIHJlcXVlc3QtZm9yLXF1b3RlIGV4Y2hhbmdlIGZvciBkYXRlZCB5aWVsZCBvbiBTb2xhbmEsIHNldHRsZWQgdGhyb3VnaCBDaGFpbmxpbmsgQ1JFIn0sImluc3RydWN0aW9ucyI6W3sibmFtZSI6ImFjY2VwdF9hdXRob3JpdHkiLCJkb2NzIjpbIkFjY2VwdHMgcGVuZGluZyBnb3Zlcm5hbmNlIGF1dGhvcml0eSJdLCJkaXNjcmltaW5hdG9yIjpbMTA3LDg2LDE5OCw5MSwzMywxMiwxMDcsMTYwXSwiYWNjb3VudHMiOlt7Im5hbWUiOiJjb25maWciLCJ3cml0YWJsZSI6dHJ1ZSwicGRhIjp7InNlZWRzIjpbeyJraW5kIjoiY29uc3QiLCJ2YWx1ZSI6Wzk5LDExMSwxMTAsMTAyLDEwNSwxMDNdfV19fSx7Im5hbWUiOiJwZW5kaW5nX2F1dGhvcml0eSIsInNpZ25lciI6dHJ1ZX1dLCJhcmdzIjpbXX0seyJuYW1lIjoiY2xhaW1feXQiLCJkb2NzIjpbIkNsYWltcyBhY2NydWVkIHlpZWxkIGZvciBzZXR0bGVkIFlUIHRva2VucyBpbiByYXcgY29sbGF0ZXJhbCJdLCJkaXNjcmltaW5hdG9yIjpbMjQxLDI5LDEzOCwxOSwxNjYsMjEwLDMyLDE5MV0sImFjY291bnRzIjpbeyJuYW1lIjoic2VyaWVzIiwid3JpdGFibGUiOnRydWV9LHsibmFtZSI6ImFsbG93X2VudHJ5IiwicGRhIjp7InNlZWRzIjpbeyJraW5kIjoiY29uc3QiLCJ2YWx1ZSI6Wzk3LDEwOCwxMDgsMTExLDExOV19LHsia2luZCI6ImFjY291bnQiLCJwYXRoIjoidXNlciJ9XX19LHsibmFtZSI6ImNvbGxhdGVyYWxfbWludCIsInJlbGF0aW9ucyI6WyJzZXJpZXMiXX0seyJuYW1lIjoieXRfbWludCIsIndyaXRhYmxlIjp0cnVlLCJyZWxhdGlvbnMiOlsic2VyaWVzIl19LHsibmFtZSI6InZhdWx0IiwiZG9jcyI6WyJSYXcgY29sbGF0ZXJhbCB2YXVsdCBvd25lZCBieSBTZXJpZXMgUERBIl0sIndyaXRhYmxlIjp0cnVlLCJyZWxhdGlvbnMiOlsic2VyaWVzIl19LHsibmFtZSI6InVzZXJfeXQiLCJkb2NzIjpbIlVzZXIncyBZVCB0b2tlbiBhY2NvdW50IHRvIGJ1cm4gZnJvbSJdLCJ3cml0YWJsZSI6dHJ1ZX0seyJuYW1lIjoidXNlcl9jb2xsYXRlcmFsIiwiZG9jcyI6WyJVc2VyJ3MgcmF3IGNvbGxhdGVyYWwgZGVzdGluYXRpb24gYWNjb3VudCJdLCJ3cml0YWJsZSI6dHJ1ZX0seyJuYW1lIjoidXNlciIsIndyaXRhYmxlIjp0cnVlLCJzaWduZXIiOnRydWV9LHsibmFtZSI6ImNvbGxhdGVyYWxfdG9rZW5fcHJvZ3JhbSJ9LHsibmFtZSI6InRva2VuXzIwMjJfcHJvZ3JhbSJ9XSwiYXJncyI6W3sibmFtZSI6ImFtb3VudCIsInR5cGUiOiJ1NjQifV19LHsibmFtZSI6ImV4ZWN1dGVfZmlsbCIsImRvY3MiOlsiUGVybWlzc2lvbmxlc3NseSBleGVjdXRlcyBhbiBhcHByb3ZlZCBmaWxsIHVzaW5nIGFuIEFkZHJlc3MgTG9va3VwIFRhYmxlIl0sImRpc2NyaW1pbmF0b3IiOlsyMTQsMTc5LDI0LDIxNiwyMTksMTAwLDE4MSwyMV0sImFjY291bnRzIjpbeyJuYW1lIjoiY2FsbGVyIiwid3JpdGFibGUiOnRydWUsInNpZ25lciI6dHJ1ZX0seyJuYW1lIjoicmVxdWVzdGVyIn0seyJuYW1lIjoiZGVhbGVyIn0seyJuYW1lIjoiYXNzZXRfbWludCJ9LHsibmFtZSI6InF1b3RlX21pbnQiLCJyZWxhdGlvbnMiOlsic2VyaWVzIl19LHsibmFtZSI6ImFzc2V0X3Rva2VuX3Byb2dyYW0ifSx7Im5hbWUiOiJxdW90ZV90b2tlbl9wcm9ncmFtIn0seyJuYW1lIjoiZmlsbF9yZWNlaXB0Iiwid3JpdGFibGUiOnRydWUsInBkYSI6eyJzZWVkcyI6W3sia2luZCI6ImNvbnN0IiwidmFsdWUiOlsxMDIsMTA1LDEwOCwxMDhdfSx7ImtpbmQiOiJhY2NvdW50IiwicGF0aCI6ImZpbGxfcmVjZWlwdC5yb3VuZF9pZCIsImFjY291bnQiOiJGaWxsUmVjZWlwdCJ9XX19LHsibmFtZSI6InNlcmllcyIsInJlbGF0aW9ucyI6WyJyZXF1ZXN0ZXJfYXNzZXRfZXNjcm93IiwiZGVhbGVyX3F1b3RlX2VzY3JvdyJdfSx7Im5hbWUiOiJhbGxvd19lbnRyeV9yZXF1ZXN0ZXIiLCJwZGEiOnsic2VlZHMiOlt7ImtpbmQiOiJjb25zdCIsInZhbHVlIjpbOTcsMTA4LDEwOCwxMTEsMTE5XX0seyJraW5kIjoiYWNjb3VudCIsInBhdGgiOiJyZXF1ZXN0ZXIifV19fSx7Im5hbWUiOiJhbGxvd19lbnRyeV9kZWFsZXIiLCJwZGEiOnsic2VlZHMiOlt7ImtpbmQiOiJjb25zdCIsInZhbHVlIjpbOTcsMTA4LDEwOCwxMTEsMTE5XX0seyJraW5kIjoiYWNjb3VudCIsInBhdGgiOiJkZWFsZXIifV19fSx7Im5hbWUiOiJyZXF1ZXN0ZXJfYXNzZXRfZXNjcm93Iiwid3JpdGFibGUiOnRydWUsInBkYSI6eyJzZWVkcyI6W3sia2luZCI6ImNvbnN0IiwidmFsdWUiOlsxMDEsMTE1LDk5LDExNCwxMTEsMTE5XX0seyJraW5kIjoiYWNjb3VudCIsInBhdGgiOiJzZXJpZXMifSx7ImtpbmQiOiJhY2NvdW50IiwicGF0aCI6InJlcXVlc3RlciJ9LHsia2luZCI6ImFjY291bnQiLCJwYXRoIjoiYXNzZXRfbWludCJ9XX19LHsibmFtZSI6InJlcXVlc3Rlcl9hc3NldF9lc2Nyb3dfdG9rZW4iLCJ3cml0YWJsZSI6dHJ1ZX0seyJuYW1lIjoiZGVhbGVyX3F1b3RlX2VzY3JvdyIsIndyaXRhYmxlIjp0cnVlLCJwZGEiOnsic2VlZHMiOlt7ImtpbmQiOiJjb25zdCIsInZhbHVlIjpbMTAxLDExNSw5OSwxMTQsMTExLDExOV19LHsia2luZCI6ImFjY291bnQiLCJwYXRoIjoic2VyaWVzIn0seyJraW5kIjoiYWNjb3VudCIsInBhdGgiOiJkZWFsZXIifSx7ImtpbmQiOiJhY2NvdW50IiwicGF0aCI6InF1b3RlX21pbnQifV19fSx7Im5hbWUiOiJkZWFsZXJfcXVvdGVfZXNjcm93X3Rva2VuIiwid3JpdGFibGUiOnRydWV9LHsibmFtZSI6InJlcXVlc3Rlcl9xdW90ZV90b2tlbiIsImRvY3MiOlsiUmVxdWVzdGVyIGRlc3RpbmF0aW9uIGFjY291bnQgZm9yIHF1b3RlIGN1cnJlbmN5Il0sIndyaXRhYmxlIjp0cnVlfSx7Im5hbWUiOiJkZWFsZXJfYXNzZXRfdG9rZW4iLCJkb2NzIjpbIkRlYWxlciBkZXN0aW5hdGlvbiBhY2NvdW50IGZvciBhc3NldCBjdXJyZW5jeSAoUFQgb3IgWVQpIl0sIndyaXRhYmxlIjp0cnVlfV0sImFyZ3MiOltdfSx7Im5hbWUiOiJpbml0aWFsaXplX2NvbmZpZyIsImRvY3MiOlsiSW5pdGlhbGl6ZXMgcHJvdG9jb2wgZ2xvYmFsIENvbmZpZywgUmVnaXN0cnksIGFuZCBSZW50VmF1bHQgUERBIl0sImRpc2NyaW1pbmF0b3IiOlsyMDgsMTI3LDIxLDEsMTk0LDE5MCwxOTYsNzBdLCJhY2NvdW50cyI6W3sibmFtZSI6ImNvbmZpZyIsIndyaXRhYmxlIjp0cnVlLCJwZGEiOnsic2VlZHMiOlt7ImtpbmQiOiJjb25zdCIsInZhbHVlIjpbOTksMTExLDExMCwxMDIsMTA1LDEwM119XX19LHsibmFtZSI6InJlZ2lzdHJ5Iiwid3JpdGFibGUiOnRydWUsInBkYSI6eyJzZWVkcyI6W3sia2luZCI6ImNvbnN0IiwidmFsdWUiOlsxMTQsMTAxLDEwMywxMDUsMTE1LDExNiwxMTQsMTIxXX1dfX0seyJuYW1lIjoicmVudF92YXVsdCIsInBkYSI6eyJzZWVkcyI6W3sia2luZCI6ImNvbnN0IiwidmFsdWUiOlsxMTQsMTAxLDExMCwxMTZdfV19fSx7Im5hbWUiOiJhdXRob3JpdHkiLCJ3cml0YWJsZSI6dHJ1ZSwic2lnbmVyIjp0cnVlfSx7Im5hbWUiOiJzeXN0ZW1fcHJvZ3JhbSIsImFkZHJlc3MiOiIxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMSJ9XSwiYXJncyI6W3sibmFtZSI6ImNsdXN0ZXJfbW9kZSIsInR5cGUiOiJ1OCJ9LHsibmFtZSI6ImVuY2xhdmVfa2V5X2hhc2giLCJ0eXBlIjp7ImFycmF5IjpbInU4IiwzMl19fSx7Im5hbWUiOiJmZWVfYnBzIiwidHlwZSI6InUxNiJ9LHsibmFtZSI6InRyZWFzdXJ5IiwidHlwZSI6InB1YmtleSJ9XX0seyJuYW1lIjoibG9ja19lc2Nyb3ciLCJkb2NzIjpbIkxvY2tzIHRva2VucyBpbnRvIGEgcHJvZ3JhbS1vd25lZCBFc2Nyb3cgUERBIl0sImRpc2NyaW1pbmF0b3IiOls1NSwxNiw1LDgwLDEzLDEwMiwyMDYsMTA0XSwiYWNjb3VudHMiOlt7Im5hbWUiOiJjb25maWciLCJwZGEiOnsic2VlZHMiOlt7ImtpbmQiOiJjb25zdCIsInZhbHVlIjpbOTksMTExLDExMCwxMDIsMTA1LDEwM119XX19LHsibmFtZSI6InNlcmllcyJ9LHsibmFtZSI6ImVzY3JvdyIsIndyaXRhYmxlIjp0cnVlLCJwZGEiOnsic2VlZHMiOlt7ImtpbmQiOiJjb25zdCIsInZhbHVlIjpbMTAxLDExNSw5OSwxMTQsMTExLDExOV19LHsia2luZCI6ImFjY291bnQiLCJwYXRoIjoic2VyaWVzIn0seyJraW5kIjoiYWNjb3VudCIsInBhdGgiOiJvd25lciJ9LHsia2luZCI6ImFjY291bnQiLCJwYXRoIjoibWludCJ9XX19LHsibmFtZSI6Im1pbnQifSx7Im5hbWUiOiJlc2Nyb3dfdG9rZW4iLCJkb2NzIjpbIkVzY3JvdyB0b2tlbiBhY2NvdW50IG93bmVkIGJ5IEVzY3JvdyBQREEgKGNhbm9uaWNhbCBBVEEpIl0sIndyaXRhYmxlIjp0cnVlLCJwZGEiOnsic2VlZHMiOlt7ImtpbmQiOiJhY2NvdW50IiwicGF0aCI6ImVzY3JvdyJ9LHsia2luZCI6ImFjY291bnQiLCJwYXRoIjoidG9rZW5fcHJvZ3JhbSJ9LHsia2luZCI6ImFjY291bnQiLCJwYXRoIjoibWludCJ9XSwicHJvZ3JhbSI6eyJraW5kIjoiY29uc3QiLCJ2YWx1ZSI6WzE0MCwxNTEsMzcsMTQzLDc4LDM2LDEzNywyNDEsMTg3LDYxLDE2LDQxLDIwLDE0MiwxMywxMzEsMTEsOTAsMTksMTUzLDIxOCwyNTUsMTYsMTMyLDQsMTQyLDEyMywyMTYsMjE5LDIzMywyNDgsODldfX19LHsibmFtZSI6Im93bmVyX3Rva2VuIiwiZG9jcyI6WyJPd25lciB0b2tlbiBzb3VyY2UgYWNjb3VudCJdLCJ3cml0YWJsZSI6dHJ1ZX0seyJuYW1lIjoib3duZXIiLCJ3cml0YWJsZSI6dHJ1ZSwic2lnbmVyIjp0cnVlfSx7Im5hbWUiOiJ0b2tlbl9wcm9ncmFtIn0seyJuYW1lIjoiYXNzb2NpYXRlZF90b2tlbl9wcm9ncmFtIiwiYWRkcmVzcyI6IkFUb2tlbkdQdmJkR1Z4cjFiMmh2WmJzaXFXNXhXSDI1ZWZUTnNMSkE4a25MIn0seyJuYW1lIjoic3lzdGVtX3Byb2dyYW0iLCJhZGRyZXNzIjoiMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTEifV0sImFyZ3MiOlt7Im5hbWUiOiJhbW91bnQiLCJ0eXBlIjoidTY0In0seyJuYW1lIjoibG9ja191bnRpbCIsInR5cGUiOiJpNjQifV19LHsibmFtZSI6Im1lcmdlIiwiZG9jcyI6WyJNZXJnZXMgZXF1YWwgUFQgYW5kIFlUIHRva2VucyBiZWZvcmUgbWF0dXJpdHksIHJlbGVhc2luZyAxOjEgcmF3IGNvbGxhdGVyYWwiXSwiZGlzY3JpbWluYXRvciI6WzE0OCwxNDEsMjM2LDQ3LDE3NCwxMjYsNjksMTExXSwiYWNjb3VudHMiOlt7Im5hbWUiOiJzZXJpZXMiLCJ3cml0YWJsZSI6dHJ1ZX0seyJuYW1lIjoiY29sbGF0ZXJhbF9taW50IiwicmVsYXRpb25zIjpbInNlcmllcyJdfSx7Im5hbWUiOiJwdF9taW50Iiwid3JpdGFibGUiOnRydWUsInJlbGF0aW9ucyI6WyJzZXJpZXMiXX0seyJuYW1lIjoieXRfbWludCIsIndyaXRhYmxlIjp0cnVlLCJyZWxhdGlvbnMiOlsic2VyaWVzIl19LHsibmFtZSI6InZhdWx0IiwiZG9jcyI6WyJSYXcgY29sbGF0ZXJhbCB2YXVsdCBvd25lZCBieSBTZXJpZXMgUERBIl0sIndyaXRhYmxlIjp0cnVlLCJyZWxhdGlvbnMiOlsic2VyaWVzIl19LHsibmFtZSI6InVzZXJfY29sbGF0ZXJhbCIsImRvY3MiOlsiVXNlcidzIHJhdyBjb2xsYXRlcmFsIGRlc3RpbmF0aW9uIGFjY291bnQiXSwid3JpdGFibGUiOnRydWV9LHsibmFtZSI6InVzZXJfcHQiLCJkb2NzIjpbIlVzZXIncyBQVCBzb3VyY2UgYWNjb3VudCJdLCJ3cml0YWJsZSI6dHJ1ZX0seyJuYW1lIjoidXNlcl95dCIsImRvY3MiOlsiVXNlcidzIFlUIHNvdXJjZSBhY2NvdW50Il0sIndyaXRhYmxlIjp0cnVlfSx7Im5hbWUiOiJ1c2VyIiwid3JpdGFibGUiOnRydWUsInNpZ25lciI6dHJ1ZX0seyJuYW1lIjoiY29sbGF0ZXJhbF90b2tlbl9wcm9ncmFtIn0seyJuYW1lIjoidG9rZW5fMjAyMl9wcm9ncmFtIn1dLCJhcmdzIjpbeyJuYW1lIjoiYW1vdW50IiwidHlwZSI6InU2NCJ9XX0seyJuYW1lIjoib25fcmVwb3J0IiwiZG9jcyI6WyJSZWNlaXZlcyBhbmQgcHJvY2Vzc2VzIHJlcG9ydHMgZnJvbSBDaGFpbmxpbmsgS2V5c3RvbmUgRm9yd2FyZGVyIENQSSJdLCJkaXNjcmltaW5hdG9yIjpbMjE0LDE3MywxOCwyMjEsMTczLDE0OCwxNTEsMjA4XSwiYWNjb3VudHMiOlt7Im5hbWUiOiJzdGF0ZSJ9LHsibmFtZSI6ImZvcndhcmRlcl9hdXRob3JpdHkiLCJkb2NzIjpbIlNpZ25lciBQREEgZGVyaXZlZCBieSB0aGUgZm9yd2FyZGVyOiBbXCJmb3J3YXJkZXJcIiwgZm9yd2FyZGVyU3RhdGUsIHJlY2VpdmVyUHJvZ3JhbV0iXSwic2lnbmVyIjp0cnVlfV0sImFyZ3MiOlt7Im5hbWUiOiJtZXRhZGF0YSIsInR5cGUiOiJieXRlcyJ9LHsibmFtZSI6InJlcG9ydCIsInR5cGUiOiJieXRlcyJ9XX0seyJuYW1lIjoib3Blbl9zZXJpZXMiLCJkb2NzIjpbIkRlcGxveXMgYSBuZXcgZGF0ZWQgeWllbGQgU2VyaWVzIHdpdGggUFQvWVQgVG9rZW4tMjAyMiBtaW50cyJdLCJkaXNjcmltaW5hdG9yIjpbNzMsNjgsOCwyMTIsMzAsNzYsMjA2LDNdLCJhY2NvdW50cyI6W3sibmFtZSI6ImNvbmZpZyIsInBkYSI6eyJzZWVkcyI6W3sia2luZCI6ImNvbnN0IiwidmFsdWUiOls5OSwxMTEsMTEwLDEwMiwxMDUsMTAzXX1dfX0seyJuYW1lIjoicmVnaXN0cnkiLCJ3cml0YWJsZSI6dHJ1ZSwicGRhIjp7InNlZWRzIjpbeyJraW5kIjoiY29uc3QiLCJ2YWx1ZSI6WzExNCwxMDEsMTAzLDEwNSwxMTUsMTE2LDExNCwxMjFdfV19fSx7Im5hbWUiOiJzZXJpZXMiLCJ3cml0YWJsZSI6dHJ1ZSwicGRhIjp7InNlZWRzIjpbeyJraW5kIjoiY29uc3QiLCJ2YWx1ZSI6WzExNSwxMDEsMTE0LDEwNSwxMDEsMTE1XX0seyJraW5kIjoiYWNjb3VudCIsInBhdGgiOiJjb2xsYXRlcmFsX21pbnQifSx7ImtpbmQiOiJhcmciLCJwYXRoIjoibWF0dXJpdHlfdHMifSx7ImtpbmQiOiJhcmciLCJwYXRoIjoibm9uY2UifV19fSx7Im5hbWUiOiJjb2xsYXRlcmFsX21pbnQiLCJkb2NzIjpbIlJhdyBjb2xsYXRlcmFsIG1pbnQiXX0seyJuYW1lIjoiY29sbGF0ZXJhbF90b2tlbl9wcm9ncmFtIiwiZG9jcyI6WyJQcm9ncmFtIG93bmluZyB0aGUgY29sbGF0ZXJhbCBtaW50IChUb2tlbiBvciBUb2tlbi0yMDIyKSJdfSx7Im5hbWUiOiJxdW90ZV9taW50IiwiZG9jcyI6WyJRdW90ZSBhc3NldCBtaW50Il19LHsibmFtZSI6InB0X21pbnQiLCJkb2NzIjpbIlByaW5jaXBhbCBUb2tlbiAoUFQpIFRva2VuLTIwMjIgbWludCJdLCJ3cml0YWJsZSI6dHJ1ZSwic2lnbmVyIjp0cnVlfSx7Im5hbWUiOiJ5dF9taW50IiwiZG9jcyI6WyJZaWVsZCBUb2tlbiAoWVQpIFRva2VuLTIwMjIgbWludCJdLCJ3cml0YWJsZSI6dHJ1ZSwic2lnbmVyIjp0cnVlfSx7Im5hbWUiOiJ2YXVsdCIsImRvY3MiOlsiVmF1bHQgYWNjb3VudCBob2xkaW5nIHJhdyBjb2xsYXRlcmFsIChjYW5vbmljYWwgQVRBIG93bmVkIGJ5IFNlcmllcyBQREEpIl0sIndyaXRhYmxlIjp0cnVlLCJwZGEiOnsic2VlZHMiOlt7ImtpbmQiOiJhY2NvdW50IiwicGF0aCI6InNlcmllcyJ9LHsia2luZCI6ImFjY291bnQiLCJwYXRoIjoiY29sbGF0ZXJhbF90b2tlbl9wcm9ncmFtIn0seyJraW5kIjoiYWNjb3VudCIsInBhdGgiOiJjb2xsYXRlcmFsX21pbnQifV0sInByb2dyYW0iOnsia2luZCI6ImNvbnN0IiwidmFsdWUiOlsxNDAsMTUxLDM3LDE0Myw3OCwzNiwxMzcsMjQxLDE4Nyw2MSwxNiw0MSwyMCwxNDIsMTMsMTMxLDExLDkwLDE5LDE1MywyMTgsMjU1LDE2LDEzMiw0LDE0MiwxMjMsMjE2LDIxOSwyMzMsMjQ4LDg5XX19fSx7Im5hbWUiOiJhdXRob3JpdHkiLCJ3cml0YWJsZSI6dHJ1ZSwic2lnbmVyIjp0cnVlLCJyZWxhdGlvbnMiOlsiY29uZmlnIl19LHsibmFtZSI6InRva2VuXzIwMjJfcHJvZ3JhbSJ9LHsibmFtZSI6ImFzc29jaWF0ZWRfdG9rZW5fcHJvZ3JhbSIsImFkZHJlc3MiOiJBVG9rZW5HUHZiZEdWeHIxYjJodlpic2lxVzV4V0gyNWVmVE5zTEpBOGtuTCJ9LHsibmFtZSI6InN5c3RlbV9wcm9ncmFtIiwiYWRkcmVzcyI6IjExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExIn1dLCJhcmdzIjpbeyJuYW1lIjoibWF0dXJpdHlfdHMiLCJ0eXBlIjoiaTY0In0seyJuYW1lIjoibm9uY2UiLCJ0eXBlIjoidTE2In0seyJuYW1lIjoiaW5kZXhfa2luZCIsInR5cGUiOiJ1OCJ9LHsibmFtZSI6ImluZGV4X3NvdXJjZSIsInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJpZHhfb3BlbiIsInR5cGUiOiJ1MTI4In0seyJuYW1lIjoicHJpdmFjeV9tb2RlIiwidHlwZSI6InU4In0seyJuYW1lIjoibWF4X3JhdGVfYnBzIiwidHlwZSI6InUzMiJ9LHsibmFtZSI6ImRpdmlkZW5kX2NhcF9icHMiLCJ0eXBlIjoidTMyIn0seyJuYW1lIjoiYWNjZXB0X2lzc3Vlcl9yaXNrIiwidHlwZSI6ImJvb2wifV19LHsibmFtZSI6InBhdXNlX2dsb2JhbCIsImRvY3MiOlsiVG9nZ2xlcyBnbG9iYWwgcHJvdG9jb2wgcGF1c2UiXSwiZGlzY3JpbWluYXRvciI6WzY2LDM0LDIzNSw4LDk5LDIwMywxMDcsMTYxXSwiYWNjb3VudHMiOlt7Im5hbWUiOiJjb25maWciLCJ3cml0YWJsZSI6dHJ1ZSwicGRhIjp7InNlZWRzIjpbeyJraW5kIjoiY29uc3QiLCJ2YWx1ZSI6Wzk5LDExMSwxMTAsMTAyLDEwNSwxMDNdfV19fSx7Im5hbWUiOiJhdXRob3JpdHkiLCJzaWduZXIiOnRydWUsInJlbGF0aW9ucyI6WyJjb25maWciXX1dLCJhcmdzIjpbeyJuYW1lIjoicGF1c2VkIiwidHlwZSI6ImJvb2wifV19LHsibmFtZSI6InBhdXNlX3NlcmllcyIsImRvY3MiOlsiVG9nZ2xlcyBwYXVzZSBvbiBhbiBpbmRpdmlkdWFsIFNlcmllcyJdLCJkaXNjcmltaW5hdG9yIjpbMjM0LDIyLDYsNDcsMTk5LDI0OCwxNTIsMjA0XSwiYWNjb3VudHMiOlt7Im5hbWUiOiJjb25maWciLCJwZGEiOnsic2VlZHMiOlt7ImtpbmQiOiJjb25zdCIsInZhbHVlIjpbOTksMTExLDExMCwxMDIsMTA1LDEwM119XX19LHsibmFtZSI6InNlcmllcyIsIndyaXRhYmxlIjp0cnVlfSx7Im5hbWUiOiJhdXRob3JpdHkiLCJzaWduZXIiOnRydWUsInJlbGF0aW9ucyI6WyJjb25maWciXX1dLCJhcmdzIjpbeyJuYW1lIjoicGF1c2VkIiwidHlwZSI6ImJvb2wifV19LHsibmFtZSI6InByb3Bvc2VfYXV0aG9yaXR5IiwiZG9jcyI6WyJQcm9wb3NlcyBhIG5ldyBnb3Zlcm5hbmNlIGF1dGhvcml0eSAodHdvLXN0ZXAgdHJhbnNmZXIpIl0sImRpc2NyaW1pbmF0b3IiOlsyMCwxNDgsMjM2LDE5OCw3NiwxMTksOTksMTQyXSwiYWNjb3VudHMiOlt7Im5hbWUiOiJjb25maWciLCJ3cml0YWJsZSI6dHJ1ZSwicGRhIjp7InNlZWRzIjpbeyJraW5kIjoiY29uc3QiLCJ2YWx1ZSI6Wzk5LDExMSwxMTAsMTAyLDEwNSwxMDNdfV19fSx7Im5hbWUiOiJhdXRob3JpdHkiLCJzaWduZXIiOnRydWUsInJlbGF0aW9ucyI6WyJjb25maWciXX1dLCJhcmdzIjpbeyJuYW1lIjoibmV3X2F1dGhvcml0eSIsInR5cGUiOiJwdWJrZXkifV19LHsibmFtZSI6InJlZGVlbV9wdCIsImRvY3MiOlsiUmVkZWVtcyBzZXR0bGVkIFBUIHRva2VucyBmb3IgaW4ta2luZCByYXcgcHJpbmNpcGFsIGNvbGxhdGVyYWwiXSwiZGlzY3JpbWluYXRvciI6WzI0OSwxODMsMjMwLDIzNiw3LDIzMywxMywyMTJdLCJhY2NvdW50cyI6W3sibmFtZSI6InNlcmllcyIsIndyaXRhYmxlIjp0cnVlfSx7Im5hbWUiOiJhbGxvd19lbnRyeSIsInBkYSI6eyJzZWVkcyI6W3sia2luZCI6ImNvbnN0IiwidmFsdWUiOls5NywxMDgsMTA4LDExMSwxMTldfSx7ImtpbmQiOiJhY2NvdW50IiwicGF0aCI6InVzZXIifV19fSx7Im5hbWUiOiJjb2xsYXRlcmFsX21pbnQiLCJyZWxhdGlvbnMiOlsic2VyaWVzIl19LHsibmFtZSI6InB0X21pbnQiLCJ3cml0YWJsZSI6dHJ1ZSwicmVsYXRpb25zIjpbInNlcmllcyJdfSx7Im5hbWUiOiJ2YXVsdCIsImRvY3MiOlsiUmF3IGNvbGxhdGVyYWwgdmF1bHQgb3duZWQgYnkgU2VyaWVzIFBEQSJdLCJ3cml0YWJsZSI6dHJ1ZSwicmVsYXRpb25zIjpbInNlcmllcyJdfSx7Im5hbWUiOiJ1c2VyX3B0IiwiZG9jcyI6WyJVc2VyJ3MgUFQgdG9rZW4gYWNjb3VudCB0byBidXJuIGZyb20iXSwid3JpdGFibGUiOnRydWV9LHsibmFtZSI6InVzZXJfY29sbGF0ZXJhbCIsImRvY3MiOlsiVXNlcidzIHJhdyBjb2xsYXRlcmFsIGRlc3RpbmF0aW9uIGFjY291bnQiXSwid3JpdGFibGUiOnRydWV9LHsibmFtZSI6InVzZXIiLCJ3cml0YWJsZSI6dHJ1ZSwic2lnbmVyIjp0cnVlfSx7Im5hbWUiOiJjb2xsYXRlcmFsX3Rva2VuX3Byb2dyYW0ifSx7Im5hbWUiOiJ0b2tlbl8yMDIyX3Byb2dyYW0ifV0sImFyZ3MiOlt7Im5hbWUiOiJhbW91bnQiLCJ0eXBlIjoidTY0In1dfSx7Im5hbWUiOiJyZW1vdmVfYWxsb3dfZW50cnkiLCJkb2NzIjpbIkNsb3NlcyBhbiBBbGxvd0VudHJ5IGFjY291bnQiXSwiZGlzY3JpbWluYXRvciI6Wzk0LDE5OSwyMTAsMjIzLDE5NSw3LDEyLDE2NF0sImFjY291bnRzIjpbeyJuYW1lIjoiY29uZmlnIiwicGRhIjp7InNlZWRzIjpbeyJraW5kIjoiY29uc3QiLCJ2YWx1ZSI6Wzk5LDExMSwxMTAsMTAyLDEwNSwxMDNdfV19fSx7Im5hbWUiOiJhbGxvd19lbnRyeSIsIndyaXRhYmxlIjp0cnVlLCJwZGEiOnsic2VlZHMiOlt7ImtpbmQiOiJjb25zdCIsInZhbHVlIjpbOTcsMTA4LDEwOCwxMTEsMTE5XX0seyJraW5kIjoiYXJnIiwicGF0aCI6IndhbGxldCJ9XX19LHsibmFtZSI6ImF1dGhvcml0eSIsIndyaXRhYmxlIjp0cnVlLCJzaWduZXIiOnRydWUsInJlbGF0aW9ucyI6WyJjb25maWciXX1dLCJhcmdzIjpbeyJuYW1lIjoid2FsbGV0IiwidHlwZSI6InB1YmtleSJ9XX0seyJuYW1lIjoic2V0X2FsbG93X2VudHJ5IiwiZG9jcyI6WyJTZXRzIG9yIHVwZGF0ZXMgYSB3YWxsZXQncyBBbGxvd0VudHJ5IHBlcm1pc3Npb25zIGFuZCBleHBpcmF0aW9uIl0sImRpc2NyaW1pbmF0b3IiOlsxNjMsMTI4LDc0LDE5MSwxMjIsODksMjI3LDI0XSwiYWNjb3VudHMiOlt7Im5hbWUiOiJjb25maWciLCJwZGEiOnsic2VlZHMiOlt7ImtpbmQiOiJjb25zdCIsInZhbHVlIjpbOTksMTExLDExMCwxMDIsMTA1LDEwM119XX19LHsibmFtZSI6ImFsbG93X2VudHJ5Iiwid3JpdGFibGUiOnRydWUsInBkYSI6eyJzZWVkcyI6W3sia2luZCI6ImNvbnN0IiwidmFsdWUiOls5NywxMDgsMTA4LDExMSwxMTldfSx7ImtpbmQiOiJhcmciLCJwYXRoIjoid2FsbGV0In1dfX0seyJuYW1lIjoiYXV0aG9yaXR5Iiwid3JpdGFibGUiOnRydWUsInNpZ25lciI6dHJ1ZSwicmVsYXRpb25zIjpbImNvbmZpZyJdfSx7Im5hbWUiOiJzeXN0ZW1fcHJvZ3JhbSIsImFkZHJlc3MiOiIxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMSJ9XSwiYXJncyI6W3sibmFtZSI6IndhbGxldCIsInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJyb2xlcyIsInR5cGUiOiJ1OCJ9LHsibmFtZSI6ImV4cGlyeV90cyIsInR5cGUiOiJpNjQifV19LHsibmFtZSI6InNldF9mb3J3YXJkZXJfZW50cnkiLCJkb2NzIjpbIlVwZGF0ZXMgb3IgcmVnaXN0ZXJzIGEgZm9yd2FyZGVyIGVudHJ5IGluIENvbmZpZyJdLCJkaXNjcmltaW5hdG9yIjpbMjI0LDEzMywxNTcsMjcsNjEsNTYsMjI4LDE5Nl0sImFjY291bnRzIjpbeyJuYW1lIjoiY29uZmlnIiwid3JpdGFibGUiOnRydWUsInBkYSI6eyJzZWVkcyI6W3sia2luZCI6ImNvbnN0IiwidmFsdWUiOls5OSwxMTEsMTEwLDEwMiwxMDUsMTAzXX1dfX0seyJuYW1lIjoiYXV0aG9yaXR5Iiwic2lnbmVyIjp0cnVlLCJyZWxhdGlvbnMiOlsiY29uZmlnIl19XSwiYXJncyI6W3sibmFtZSI6ImluZGV4IiwidHlwZSI6InU4In0seyJuYW1lIjoicHJvZ3JhbSIsInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJzdGF0ZSIsInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJhbGxvd2VkX3dvcmtmbG93IiwidHlwZSI6eyJhcnJheSI6WyJ1OCIsMzJdfX1dfSx7Im5hbWUiOiJzZXR0bGVfb25jaGFpbiIsImRvY3MiOlsiUGVybWlzc2lvbmxlc3Mgb25jaGFpbiBzZXR0bGVtZW50IGNyYW5rIGZvciBTdGFrZVBvb2xSYXRlIHNlcmllcyJdLCJkaXNjcmltaW5hdG9yIjpbMTQxLDI4LDk4LDUyLDE3MSwxMjMsNjMsMjMzXSwiYWNjb3VudHMiOlt7Im5hbWUiOiJzZXJpZXMiLCJ3cml0YWJsZSI6dHJ1ZX0seyJuYW1lIjoiaW5kZXhfc291cmNlIiwicmVsYXRpb25zIjpbInNlcmllcyJdfSx7Im5hbWUiOiJjcmFuayIsIndyaXRhYmxlIjp0cnVlLCJzaWduZXIiOnRydWV9XSwiYXJncyI6W119LHsibmFtZSI6InN0cmlwIiwiZG9jcyI6WyJTdHJpcHMgcmF3IGNvbGxhdGVyYWwgaW50byBlcXVhbCAxOjEgUFQgYW5kIFlUIHRva2VucyJdLCJkaXNjcmltaW5hdG9yIjpbMjQ2LDY4LDIzMSwxNDEsNjIsMTYzLDE4OSwxMjZdLCJhY2NvdW50cyI6W3sibmFtZSI6ImNvbmZpZyIsInBkYSI6eyJzZWVkcyI6W3sia2luZCI6ImNvbnN0IiwidmFsdWUiOls5OSwxMTEsMTEwLDEwMiwxMDUsMTAzXX1dfX0seyJuYW1lIjoic2VyaWVzIiwid3JpdGFibGUiOnRydWV9LHsibmFtZSI6ImFsbG93X2VudHJ5IiwiZG9jcyI6WyJBbGxvd0VudHJ5IHZhbGlkYXRpbmcgdGhlIHVzZXIgaGFzIHRoZSBTdHJpcCByb2xlIl0sInBkYSI6eyJzZWVkcyI6W3sia2luZCI6ImNvbnN0IiwidmFsdWUiOls5NywxMDgsMTA4LDExMSwxMTldfSx7ImtpbmQiOiJhY2NvdW50IiwicGF0aCI6InVzZXIifV19fSx7Im5hbWUiOiJjb2xsYXRlcmFsX21pbnQiLCJyZWxhdGlvbnMiOlsic2VyaWVzIl19LHsibmFtZSI6InB0X21pbnQiLCJ3cml0YWJsZSI6dHJ1ZSwicmVsYXRpb25zIjpbInNlcmllcyJdfSx7Im5hbWUiOiJ5dF9taW50Iiwid3JpdGFibGUiOnRydWUsInJlbGF0aW9ucyI6WyJzZXJpZXMiXX0seyJuYW1lIjoidmF1bHQiLCJkb2NzIjpbIlJhdyBjb2xsYXRlcmFsIHZhdWx0IG93bmVkIGJ5IFNlcmllcyBQREEiXSwid3JpdGFibGUiOnRydWUsInJlbGF0aW9ucyI6WyJzZXJpZXMiXX0seyJuYW1lIjoidXNlcl9jb2xsYXRlcmFsIiwiZG9jcyI6WyJVc2VyJ3MgcmF3IGNvbGxhdGVyYWwgc291cmNlIGFjY291bnQiXSwid3JpdGFibGUiOnRydWV9LHsibmFtZSI6InVzZXJfcHQiLCJkb2NzIjpbIlVzZXIncyBQVCBkZXN0aW5hdGlvbiBhY2NvdW50Il0sIndyaXRhYmxlIjp0cnVlfSx7Im5hbWUiOiJ1c2VyX3l0IiwiZG9jcyI6WyJVc2VyJ3MgWVQgZGVzdGluYXRpb24gYWNjb3VudCJdLCJ3cml0YWJsZSI6dHJ1ZX0seyJuYW1lIjoidXNlciIsIndyaXRhYmxlIjp0cnVlLCJzaWduZXIiOnRydWV9LHsibmFtZSI6ImNvbGxhdGVyYWxfdG9rZW5fcHJvZ3JhbSJ9LHsibmFtZSI6InRva2VuXzIwMjJfcHJvZ3JhbSJ9XSwiYXJncyI6W3sibmFtZSI6ImFtb3VudCIsInR5cGUiOiJ1NjQifV19LHsibmFtZSI6IndpdGhkcmF3X2VzY3JvdyIsImRvY3MiOlsiV2l0aGRyYXdzIHRva2VucyBmcm9tIEVzY3JvdyBQREEgYWZ0ZXIgbG9ja191bnRpbCBleHBpcmVzIl0sImRpc2NyaW1pbmF0b3IiOls4MSw4NCwyMjYsMTI4LDI0NSw0Nyw5NiwxMDRdLCJhY2NvdW50cyI6W3sibmFtZSI6InNlcmllcyJ9LHsibmFtZSI6ImVzY3JvdyIsIndyaXRhYmxlIjp0cnVlLCJwZGEiOnsic2VlZHMiOlt7ImtpbmQiOiJjb25zdCIsInZhbHVlIjpbMTAxLDExNSw5OSwxMTQsMTExLDExOV19LHsia2luZCI6ImFjY291bnQiLCJwYXRoIjoic2VyaWVzIn0seyJraW5kIjoiYWNjb3VudCIsInBhdGgiOiJvd25lciJ9LHsia2luZCI6ImFjY291bnQiLCJwYXRoIjoibWludCJ9XX19LHsibmFtZSI6Im1pbnQiLCJyZWxhdGlvbnMiOlsiZXNjcm93Il19LHsibmFtZSI6ImVzY3Jvd190b2tlbiIsImRvY3MiOlsiRXNjcm93IHRva2VuIGFjY291bnQgb3duZWQgYnkgRXNjcm93IFBEQSAoY2Fub25pY2FsIEFUQSkiXSwid3JpdGFibGUiOnRydWUsInBkYSI6eyJzZWVkcyI6W3sia2luZCI6ImFjY291bnQiLCJwYXRoIjoiZXNjcm93In0seyJraW5kIjoiYWNjb3VudCIsInBhdGgiOiJ0b2tlbl9wcm9ncmFtIn0seyJraW5kIjoiYWNjb3VudCIsInBhdGgiOiJtaW50In1dLCJwcm9ncmFtIjp7ImtpbmQiOiJjb25zdCIsInZhbHVlIjpbMTQwLDE1MSwzNywxNDMsNzgsMzYsMTM3LDI0MSwxODcsNjEsMTYsNDEsMjAsMTQyLDEzLDEzMSwxMSw5MCwxOSwxNTMsMjE4LDI1NSwxNiwxMzIsNCwxNDIsMTIzLDIxNiwyMTksMjMzLDI0OCw4OV19fX0seyJuYW1lIjoib3duZXJfdG9rZW4iLCJkb2NzIjpbIk93bmVyIGRlc3RpbmF0aW9uIHRva2VuIGFjY291bnQiXSwid3JpdGFibGUiOnRydWV9LHsibmFtZSI6Im93bmVyIiwid3JpdGFibGUiOnRydWUsInNpZ25lciI6dHJ1ZSwicmVsYXRpb25zIjpbImVzY3JvdyJdfSx7Im5hbWUiOiJ0b2tlbl9wcm9ncmFtIn1dLCJhcmdzIjpbeyJuYW1lIjoiYW1vdW50IiwidHlwZSI6InU2NCJ9XX1dLCJhY2NvdW50cyI6W3sibmFtZSI6IkFsbG93RW50cnkiLCJkaXNjcmltaW5hdG9yIjpbMywyOSw2LDI1NCwyLDIwOSwyMTksMjQ1XX0seyJuYW1lIjoiQ29uZmlnIiwiZGlzY3JpbWluYXRvciI6WzE1NSwxMiwxNzAsMjI0LDMwLDI1MCwyMDQsMTMwXX0seyJuYW1lIjoiRXNjcm93IiwiZGlzY3JpbWluYXRvciI6WzMxLDIxMywxMjMsMTg3LDE4NiwyMiwyMTgsMTU1XX0seyJuYW1lIjoiRmlsbFJlY2VpcHQiLCJkaXNjcmltaW5hdG9yIjpbOCwxMCwxNjksODQsMTYzLDE5LDE2NywxMzldfSx7Im5hbWUiOiJSZWdpc3RyeSIsImRpc2NyaW1pbmF0b3IiOls0NywxNzQsMTEwLDI0NiwxODQsMTgyLDI1MiwyMThdfSx7Im5hbWUiOiJTZXJpZXMiLCJkaXNjcmltaW5hdG9yIjpbMjQwLDk3LDgsMTgzLDEzOSw3NywyNTAsMTYyXX1dLCJldmVudHMiOlt7Im5hbWUiOiJBbGxvd0VudHJ5UmVtb3ZlZCIsImRpc2NyaW1pbmF0b3IiOlsxMTYsMjUxLDc1LDI0MCw2Miw5MCwxOCwxNTddfSx7Im5hbWUiOiJBbGxvd0VudHJ5U2V0IiwiZGlzY3JpbWluYXRvciI6WzE2NywxOTksMTM2LDU3LDEzNiwyNDUsMjIsMTcyXX0seyJuYW1lIjoiQXV0aG9yaXR5VHJhbnNmZXJBY2NlcHRlZCIsImRpc2NyaW1pbmF0b3IiOlsxNDksMTY1LDE0MCwyMjEsMTA0LDIwMywyMzksMTIxXX0seyJuYW1lIjoiQXV0aG9yaXR5VHJhbnNmZXJQcm9wb3NlZCIsImRpc2NyaW1pbmF0b3IiOlsxMDMsMjQ0LDI3LDExNiwxNzcsNCwxMDAsMTE5XX0seyJuYW1lIjoiQ29uZmlnSW5pdGlhbGl6ZWQiLCJkaXNjcmltaW5hdG9yIjpbMTgxLDQ5LDIwMCwxNTYsMTksMTY3LDE3OCw5MV19LHsibmFtZSI6IkVzY3Jvd0xvY2tlZCIsImRpc2NyaW1pbmF0b3IiOlsxMjgsMTE2LDE4LDExNSwyMDAsMTMzLDMwLDEyMF19LHsibmFtZSI6IkVzY3Jvd1dpdGhkcmF3biIsImRpc2NyaW1pbmF0b3IiOls0MywyMDYsMTc0LDQ3LDEwNSwyMTksMjE2LDIzOV19LHsibmFtZSI6IkZpbGxFeGVjdXRlZCIsImRpc2NyaW1pbmF0b3IiOlsxMzAsMjEsODQsNTYsMjA1LDEyMywyNDEsMjEyXX0seyJuYW1lIjoiRm9yd2FyZGVyVXBkYXRlZCIsImRpc2NyaW1pbmF0b3IiOls5MSwxOTUsMjQ4LDExNyw1MCwxMjUsMjE3LDI1MV19LHsibmFtZSI6Ikdsb2JhbFBhdXNlVG9nZ2xlZCIsImRpc2NyaW1pbmF0b3IiOls5OCwxMDQsMTExLDE5MCwxMDQsMTczLDc0LDIzNl19LHsibmFtZSI6IlB0UmVkZWVtZWQiLCJkaXNjcmltaW5hdG9yIjpbMjExLDEyMSw5Nyw1MSw0NywyMjUsMTk2LDIyNl19LHsibmFtZSI6IlJlY2VpdmVkRmlsbFJlcG9ydCIsImRpc2NyaW1pbmF0b3IiOlszMywyNSwxNjYsNTMsMjA0LDI1MCwxMDAsMjIxXX0seyJuYW1lIjoiUmVjZWl2ZWRSYXRlUmVwb3J0IiwiZGlzY3JpbWluYXRvciI6WzE0NCwyMDQsNTQsMjQsMTgwLDEzMSwxMjIsOTZdfSx7Im5hbWUiOiJSZWNlaXZlZFNldHRsZVJlcG9ydCIsImRpc2NyaW1pbmF0b3IiOlsxNjYsNjcsMTIzLDk4LDU0LDI0MiwxNzEsMjIzXX0seyJuYW1lIjoiU2VyaWVzT3BlbmVkIiwiZGlzY3JpbWluYXRvciI6WzIwMywxNzAsNzgsMTg0LDEzNywyMjEsMjIwLDIwN119LHsibmFtZSI6IlNlcmllc1BhdXNlVG9nZ2xlZCIsImRpc2NyaW1pbmF0b3IiOlsyMDksNTgsMjA1LDgzLDg3LDExNCwyNiwxOTJdfSx7Im5hbWUiOiJUb2tlbnNNZXJnZWQiLCJkaXNjcmltaW5hdG9yIjpbMTc4LDE3OSwxNjAsODEsMTQxLDE0MywxMjAsNjZdfSx7Im5hbWUiOiJUb2tlbnNTdHJpcHBlZCIsImRpc2NyaW1pbmF0b3IiOlszMSw4OSwxNTcsMTU2LDEzMywxODcsODgsMTZdfSx7Im5hbWUiOiJZdENsYWltZWQiLCJkaXNjcmltaW5hdG9yIjpbMzQsMTg0LDYwLDU4LDExLDIwNywyNDMsMTUyXX1dLCJlcnJvcnMiOlt7ImNvZGUiOjYwMDAsIm5hbWUiOiJVbmF1dGhvcml6ZWQiLCJtc2ciOiJVbmF1dGhvcml6ZWQ6IENhbGxlciBpcyBub3QgdGhlIGF1dGhvcml6ZWQgcHJvdG9jb2wgYXV0aG9yaXR5In0seyJjb2RlIjo2MDAxLCJuYW1lIjoiUGVuZGluZ0F1dGhvcml0eU1pc21hdGNoIiwibXNnIjoiUGVuZGluZ0F1dGhvcml0eU1pc21hdGNoOiBDYWxsZXIgaXMgbm90IHRoZSBkZXNpZ25hdGVkIHBlbmRpbmcgYXV0aG9yaXR5In0seyJjb2RlIjo2MDAyLCJuYW1lIjoiUHJvdG9jb2xQYXVzZWQiLCJtc2ciOiJQcm90b2NvbFBhdXNlZDogUHJvdG9jb2wgaXMgY3VycmVudGx5IHBhdXNlZCBieSBnb3Zlcm5hbmNlIn0seyJjb2RlIjo2MDAzLCJuYW1lIjoiU2VyaWVzUGF1c2VkIiwibXNnIjoiU2VyaWVzUGF1c2VkOiBUYXJnZXQgc2VyaWVzIGlzIGN1cnJlbnRseSBwYXVzZWQifSx7ImNvZGUiOjYwMDQsIm5hbWUiOiJTZXJpZXNOb3RPcGVuIiwibXNnIjoiU2VyaWVzTm90T3BlbjogU2VyaWVzIHN0YXR1cyBpcyBub3QgT3BlbiJ9LHsiY29kZSI6NjAwNSwibmFtZSI6IlNlcmllc0FscmVhZHlTZXR0bGVkIiwibXNnIjoiU2VyaWVzQWxyZWFkeVNldHRsZWQ6IFNlcmllcyBpcyBhbHJlYWR5IHNldHRsZWQifSx7ImNvZGUiOjYwMDYsIm5hbWUiOiJTZXJpZXNNYXR1cml0eU5vdFJlYWNoZWQiLCJtc2ciOiJTZXJpZXNNYXR1cml0eU5vdFJlYWNoZWQ6IENhbm5vdCBzZXR0bGUgc2VyaWVzIHByaW9yIHRvIG1hdHVyaXR5IHRpbWVzdGFtcCJ9LHsiY29kZSI6NjAwNywibmFtZSI6IlNlcmllc0FscmVhZHlNYXR1cmVkIiwibXNnIjoiU2VyaWVzQWxyZWFkeU1hdHVyZWQ6IENhbm5vdCBzdHJpcCBvciBtZXJnZSBzZXJpZXMgYXQgb3IgYWZ0ZXIgbWF0dXJpdHkgdGltZXN0YW1wIn0seyJjb2RlIjo2MDA4LCJuYW1lIjoiU2VyaWVzTm90U2V0dGxlZCIsIm1zZyI6IlNlcmllc05vdFNldHRsZWQ6IFJlZGVtcHRpb25zIGFuZCBjbGFpbXMgcmVxdWlyZSBzZXR0bGVkIHNlcmllcyJ9LHsiY29kZSI6NjAwOSwibmFtZSI6Ik1hdHVyaXR5SW5QYXN0IiwibXNnIjoiTWF0dXJpdHlJblBhc3Q6IFNlcmllcyBtYXR1cml0eSB0aW1lc3RhbXAgbXVzdCBiZSBpbiB0aGUgZnV0dXJlIn0seyJjb2RlIjo2MDEwLCJuYW1lIjoiSW52YWxpZENvbGxhdGVyYWxNaW50IiwibXNnIjoiSW52YWxpZENvbGxhdGVyYWxNaW50OiBDb2xsYXRlcmFsIG1pbnQgZG9lcyBub3QgY29uZm9ybSB0byBleHRlbnNpb24gc2FmZXR5IHBvbGljeSJ9LHsiY29kZSI6NjAxMSwibmFtZSI6IkRpc2FsbG93ZWRDb2xsYXRlcmFsRXh0ZW5zaW9uIiwibXNnIjoiRGlzYWxsb3dlZENvbGxhdGVyYWxFeHRlbnNpb246IE1pbnQgY2FycmllcyBhIGZvcmJpZGRlbiBUb2tlbi0yMDIyIGV4dGVuc2lvbiJ9LHsiY29kZSI6NjAxMiwibmFtZSI6IkludmFsaWRBbGxvd0VudHJ5IiwibXNnIjoiSW52YWxpZEFsbG93RW50cnk6IFdhbGxldCBoYXMgbm8gdmFsaWQgb3IgYWN0aXZlIEFsbG93RW50cnkifSx7ImNvZGUiOjYwMTMsIm5hbWUiOiJBbGxvd0VudHJ5RXhwaXJlZCIsIm1zZyI6IkFsbG93RW50cnlFeHBpcmVkOiBBbGxvd0VudHJ5IGhhcyBwYXNzZWQgaXRzIGV4cGlyYXRpb24gdGltZXN0YW1wIn0seyJjb2RlIjo2MDE0LCJuYW1lIjoiTWlzc2luZ1JvbGUiLCJtc2ciOiJNaXNzaW5nUm9sZTogV2FsbGV0IGxhY2tzIHRoZSByZXF1aXJlZCByb2xlIGJpdCBmb3IgdGhpcyBpbnN0cnVjdGlvbiJ9LHsiY29kZSI6NjAxNSwibmFtZSI6IkVzY3Jvd0xvY2tlZCIsIm1zZyI6IkVzY3Jvd0xvY2tlZDogRXNjcm93IGZ1bmRzIGNhbm5vdCBiZSB3aXRoZHJhd24gYmVmb3JlIGxvY2tfdW50aWwgdGltZXN0YW1wIn0seyJjb2RlIjo2MDE2LCJuYW1lIjoiSW5zdWZmaWNpZW50RXNjcm93QmFsYW5jZSIsIm1zZyI6Ikluc3VmZmljaWVudEVzY3Jvd0JhbGFuY2U6IEVzY3JvdyBkb2VzIG5vdCBob2xkIHN1ZmZpY2llbnQgdG9rZW5zIn0seyJjb2RlIjo2MDE3LCJuYW1lIjoiSW52YWxpZEZvcndhcmRlclByb2dyYW0iLCJtc2ciOiJJbnZhbGlkRm9yd2FyZGVyUHJvZ3JhbTogRm9yd2FyZGVyIHByb2dyYW0gaXMgbm90IHJlZ2lzdGVyZWQgaW4gQ29uZmlnIn0seyJjb2RlIjo2MDE4LCJuYW1lIjoiSW52YWxpZEZvcndhcmRlclN0YXRlIiwibXNnIjoiSW52YWxpZEZvcndhcmRlclN0YXRlOiBGb3J3YXJkZXIgc3RhdGUgYWNjb3VudCBkb2VzIG5vdCBtYXRjaCByZWdpc3RlcmVkIGZvcndhcmRlciJ9LHsiY29kZSI6NjAxOSwibmFtZSI6IkludmFsaWRGb3J3YXJkZXJBdXRob3JpdHkiLCJtc2ciOiJJbnZhbGlkRm9yd2FyZGVyQXV0aG9yaXR5OiBmb3J3YXJkZXJfYXV0aG9yaXR5IHNpZ25lciBkb2VzIG5vdCBtYXRjaCBQREEgZGVyaXZhdGlvbiJ9LHsiY29kZSI6NjAyMCwibmFtZSI6IkludmFsaWRXb3JrZmxvd0lkZW50aXR5IiwibXNnIjoiSW52YWxpZFdvcmtmbG93SWRlbnRpdHk6IFdvcmtmbG93IElEIG9yIG93bmVyIGRvZXMgbm90IG1hdGNoIGFsbG93ZWQgZm9yd2FyZGVyIGVudHJ5In0seyJjb2RlIjo2MDIxLCJuYW1lIjoiSW52YWxpZFJlcG9ydFBheWxvYWQiLCJtc2ciOiJJbnZhbGlkUmVwb3J0UGF5bG9hZDogTWFsZm9ybWVkIG9yIHVucGFyc2VhYmxlIHJlcG9ydCBwYXlsb2FkIn0seyJjb2RlIjo2MDIyLCJuYW1lIjoiVHJhaWxpbmdSZXBvcnRCeXRlcyIsIm1zZyI6IlRyYWlsaW5nUmVwb3J0Qnl0ZXM6IFRyYWlsaW5nIGJ5dGVzIGRldGVjdGVkIGFmdGVyIGRlY29kaW5nIHJlcG9ydCBwYXlsb2FkIn0seyJjb2RlIjo2MDIzLCJuYW1lIjoiVW5zdXBwb3J0ZWRSZXBvcnRWZXJzaW9uIiwibXNnIjoiVW5zdXBwb3J0ZWRSZXBvcnRWZXJzaW9uOiBSZXBvcnQgdmVyc2lvbiBpcyBub3Qgc3VwcG9ydGVkIn0seyJjb2RlIjo2MDI0LCJuYW1lIjoiVW5rbm93blJlcG9ydEtpbmQiLCJtc2ciOiJVbmtub3duUmVwb3J0S2luZDogUmVwb3J0IGtpbmQgbXVzdCBiZSAxIChGaWxsKSwgMiAoU2V0dGxlKSwgb3IgMyAoUmF0ZSkifSx7ImNvZGUiOjYwMjUsIm5hbWUiOiJSYXRlRXhjZWVkc0NhcCIsIm1zZyI6IlJhdGVFeGNlZWRzQ2FwOiBJbXBsaWVkIG9yIG9ic2VydmVkIHJhdGUgZXhjZWVkcyBzZXJpZXMgbWF4X3JhdGVfYnBzIGNhcCJ9LHsiY29kZSI6NjAyNiwibmFtZSI6IkRpdmlkZW5kQmFuZEV4Y2VlZGVkIiwibXNnIjoiRGl2aWRlbmRCYW5kRXhjZWVkZWQ6IERpdmlkZW5kIGdyb3d0aCBpbmRleCBvdXRzaWRlIGNvbmZpZ3VyZWQgYmFuZDsgc2VyaWVzIGRpc3B1dGVkIn0seyJjb2RlIjo2MDI3LCJuYW1lIjoiUm91bmRFeHBpcmVkIiwibXNnIjoiUm91bmRFeHBpcmVkOiBGaWxsIHJlcG9ydCByZWNlaXZlZCBhZnRlciBub3RfYWZ0ZXIgdGltZXN0YW1wIGV4cGlyYXRpb24ifSx7ImNvZGUiOjYwMjgsIm5hbWUiOiJGaWxsQWxyZWFkeUV4ZWN1dGVkIiwibXNnIjoiRmlsbEFscmVhZHlFeGVjdXRlZDogRmlsbCByZWNlaXB0IGhhcyBhbHJlYWR5IGJlZW4gZXhlY3V0ZWQifSx7ImNvZGUiOjYwMjksIm5hbWUiOiJGaWxsTm90QXBwcm92ZWQiLCJtc2ciOiJGaWxsTm90QXBwcm92ZWQ6IEZpbGwgcmVjZWlwdCBpcyBub3QgaW4gQXBwcm92ZWQgc3RhdHVzIn0seyJjb2RlIjo2MDMwLCJuYW1lIjoiU2VyaWVzTWlzbWF0Y2giLCJtc2ciOiJTZXJpZXNNaXNtYXRjaDogU2VyaWVzIHNwZWNpZmllZCBkb2VzIG5vdCBtYXRjaCBGaWxsUmVjZWlwdCBvciByZXBvcnQifSx7ImNvZGUiOjYwMzEsIm5hbWUiOiJUb2tlbk1pc21hdGNoIiwibXNnIjoiVG9rZW5NaXNtYXRjaDogRXNjcm93IG9yIG1pbnQgdG9rZW4gYWNjb3VudCBkb2VzIG5vdCBtYXRjaCBzZXJpZXMgc3BlY2lmaWNhdGlvbnMifSx7ImNvZGUiOjYwMzIsIm5hbWUiOiJQYXJ0eU1pc21hdGNoIiwibXNnIjoiUGFydHlNaXNtYXRjaDogV2FsbGV0IGRvZXMgbm90IG1hdGNoIHJlcXVlc3RlciBvciBkZWFsZXIgaW4gRmlsbFJlY2VpcHQifSx7ImNvZGUiOjYwMzMsIm5hbWUiOiJNYXRoT3ZlcmZsb3ciLCJtc2ciOiJNYXRoT3ZlcmZsb3c6IEFyaXRobWV0aWMgY2FsY3VsYXRpb24gZW5jb3VudGVyZWQgYW4gb3ZlcmZsb3cgb3IgZGl2aXNpb24gYnkgemVybyJ9LHsiY29kZSI6NjAzNCwibmFtZSI6IkludmFsaWRJbmRleCIsIm1zZyI6IkludmFsaWRJbmRleDogU2V0dGxlbWVudCBpbmRleCBtdXN0IGJlIHBvc2l0aXZlIn0seyJjb2RlIjo2MDM1LCJuYW1lIjoiWmVyb0Ftb3VudCIsIm1zZyI6Ilplcm9BbW91bnQ6IEFtb3VudCBtdXN0IGJlIGdyZWF0ZXIgdGhhbiB6ZXJvIn0seyJjb2RlIjo2MDM2LCJuYW1lIjoiUmVnaXN0cnlGdWxsIiwibXNnIjoiUmVnaXN0cnlGdWxsOiBTZXJpZXMgcmVnaXN0cnkgaGFzIHJlYWNoZWQgaXRzIG1heGltdW0gbGltaXQgKDY0IHNlcmllcykifSx7ImNvZGUiOjYwMzcsIm5hbWUiOiJNb2NrRm9yd2FyZGVyRm9yYmlkZGVuIiwibXNnIjoiTW9ja0ZvcndhcmRlckZvcmJpZGRlbjogTW9jayBmb3J3YXJkZXIgYWRkcmVzcyBpcyBzdHJpY3RseSByZWplY3RlZCBpbiBtYWlubmV0IGJ1aWxkcyJ9XSwidHlwZXMiOlt7Im5hbWUiOiJBbGxvd0VudHJ5IiwidHlwZSI6eyJraW5kIjoic3RydWN0IiwiZmllbGRzIjpbeyJuYW1lIjoid2FsbGV0IiwiZG9jcyI6WyJXaGl0ZWxpc3RlZCB3YWxsZXQgYWRkcmVzcyJdLCJ0eXBlIjoicHVia2V5In0seyJuYW1lIjoiZXhwaXJ5X3RzIiwiZG9jcyI6WyJVbml4IHRpbWVzdGFtcCB3aGVuIHRoaXMgYWxsb3cgZW50cnkgZXhwaXJlcyJdLCJ0eXBlIjoiaTY0In0seyJuYW1lIjoicm9sZXMiLCJkb2NzIjpbIkJpdG1hc2sgb2YgcGVybWl0dGVkIGFjdGlvbnMgKHNlZSByb2xlcyBtb2R1bGUpIl0sInR5cGUiOiJ1OCJ9LHsibmFtZSI6ImJ1bXAiLCJkb2NzIjpbIlBEQSBidW1wIHNlZWQiXSwidHlwZSI6InU4In1dfX0seyJuYW1lIjoiQWxsb3dFbnRyeVJlbW92ZWQiLCJ0eXBlIjp7ImtpbmQiOiJzdHJ1Y3QiLCJmaWVsZHMiOlt7Im5hbWUiOiJ3YWxsZXQiLCJ0eXBlIjoicHVia2V5In1dfX0seyJuYW1lIjoiQWxsb3dFbnRyeVNldCIsInR5cGUiOnsia2luZCI6InN0cnVjdCIsImZpZWxkcyI6W3sibmFtZSI6IndhbGxldCIsInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJyb2xlcyIsInR5cGUiOiJ1OCJ9LHsibmFtZSI6ImV4cGlyeV90cyIsInR5cGUiOiJpNjQifV19fSx7Im5hbWUiOiJBdXRob3JpdHlUcmFuc2ZlckFjY2VwdGVkIiwidHlwZSI6eyJraW5kIjoic3RydWN0IiwiZmllbGRzIjpbeyJuYW1lIjoib2xkX2F1dGhvcml0eSIsInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJuZXdfYXV0aG9yaXR5IiwidHlwZSI6InB1YmtleSJ9XX19LHsibmFtZSI6IkF1dGhvcml0eVRyYW5zZmVyUHJvcG9zZWQiLCJ0eXBlIjp7ImtpbmQiOiJzdHJ1Y3QiLCJmaWVsZHMiOlt7Im5hbWUiOiJjdXJyZW50X2F1dGhvcml0eSIsInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJwZW5kaW5nX2F1dGhvcml0eSIsInR5cGUiOiJwdWJrZXkifV19fSx7Im5hbWUiOiJDb25maWciLCJ0eXBlIjp7ImtpbmQiOiJzdHJ1Y3QiLCJmaWVsZHMiOlt7Im5hbWUiOiJhdXRob3JpdHkiLCJkb2NzIjpbIlByb3RvY29sIGdvdmVybmFuY2UgYXV0aG9yaXR5Il0sInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJwZW5kaW5nX2F1dGhvcml0eSIsImRvY3MiOlsiUGVuZGluZyBhdXRob3JpdHkgZm9yIHR3by1zdGVwIHRyYW5zZmVyIl0sInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJmb3J3YXJkZXJzIiwiZG9jcyI6WyJSZWdpc3RlcmVkIGZvcndhcmRlcnMgKHVwIHRvIDI6IG9uIERldm5ldCwgMSBsaXZlIEtleXN0b25lICsgMSBtb2NrIHNpbXVsYXRvciBmb3J3YXJkZXIpIl0sInR5cGUiOnsiYXJyYXkiOlt7ImRlZmluZWQiOnsibmFtZSI6IkZvcndhcmRlckVudHJ5In19LDJdfX0seyJuYW1lIjoiZm9yd2FyZGVyX2NvdW50IiwiZG9jcyI6WyJOdW1iZXIgb2YgYWN0aXZlIGZvcndhcmRlcnMgaW4gdGhlIGFycmF5Il0sInR5cGUiOiJ1OCJ9LHsibmFtZSI6ImVuY2xhdmVfa2V5X2hhc2giLCJkb2NzIjpbIlB1Ymxpc2hlZCBTSEEtMjU2IGhhc2ggb2YgdGhlIFRFRSBlbmNsYXZlIFgyNTUxOSBwdWJsaWMga2V5Il0sInR5cGUiOnsiYXJyYXkiOlsidTgiLDMyXX19LHsibmFtZSI6InBhdXNlZCIsImRvY3MiOlsiR2xvYmFsIGVtZXJnZW5jeSBwYXVzZSBmbGFnIl0sInR5cGUiOiJib29sIn0seyJuYW1lIjoiY2x1c3Rlcl9tb2RlIiwiZG9jcyI6WyJDbHVzdGVyIG1vZGU6IDAgPSBMb2NhbCwgMSA9IERldm5ldCwgMiA9IE1haW5uZXQiXSwidHlwZSI6InU4In0seyJuYW1lIjoiZmVlX2JwcyIsImRvY3MiOlsiUHJvdG9jb2wgZmVlIGluIGJhc2lzIHBvaW50cyAoMCBmb3IgdjEpIl0sInR5cGUiOiJ1MTYifSx7Im5hbWUiOiJ0cmVhc3VyeSIsImRvY3MiOlsiUHJvdG9jb2wgZmVlIHRyZWFzdXJ5Il0sInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJidW1wIiwiZG9jcyI6WyJQREEgYnVtcCBzZWVkIl0sInR5cGUiOiJ1OCJ9XX19LHsibmFtZSI6IkNvbmZpZ0luaXRpYWxpemVkIiwidHlwZSI6eyJraW5kIjoic3RydWN0IiwiZmllbGRzIjpbeyJuYW1lIjoiYXV0aG9yaXR5IiwidHlwZSI6InB1YmtleSJ9LHsibmFtZSI6ImNsdXN0ZXJfbW9kZSIsInR5cGUiOiJ1OCJ9XX19LHsibmFtZSI6IkVzY3JvdyIsInR5cGUiOnsia2luZCI6InN0cnVjdCIsImZpZWxkcyI6W3sibmFtZSI6Im93bmVyIiwiZG9jcyI6WyJPd25lciB3YWxsZXQgdGhhdCBkZXBvc2l0ZWQgdGhlIGVzY3Jvd2VkIHRva2VucyJdLCJ0eXBlIjoicHVia2V5In0seyJuYW1lIjoic2VyaWVzIiwiZG9jcyI6WyJBc3NvY2lhdGVkIHNlcmllcyBQREEiXSwidHlwZSI6InB1YmtleSJ9LHsibmFtZSI6Im1pbnQiLCJkb2NzIjpbIlRva2VuIG1pbnQgaGVsZCBpbiBlc2Nyb3cgKFBULCBZVCwgb3IgcXVvdGUgdG9rZW4pIl0sInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJsb2NrX3VudGlsIiwiZG9jcyI6WyJVbml4IHRpbWVzdGFtcCBiZWZvcmUgd2hpY2ggdGhlIG93bmVyIGNhbm5vdCB3aXRoZHJhdyJdLCJ0eXBlIjoiaTY0In0seyJuYW1lIjoiYW1vdW50IiwiZG9jcyI6WyJDdXJyZW50IHF1YW50aXR5IG9mIHRva2VucyBsb2NrZWQgaW4gZXNjcm93Il0sInR5cGUiOiJ1NjQifSx7Im5hbWUiOiJidW1wIiwiZG9jcyI6WyJQREEgYnVtcCBzZWVkIl0sInR5cGUiOiJ1OCJ9XX19LHsibmFtZSI6IkVzY3Jvd0xvY2tlZCIsInR5cGUiOnsia2luZCI6InN0cnVjdCIsImZpZWxkcyI6W3sibmFtZSI6InNlcmllcyIsInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJvd25lciIsInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJtaW50IiwidHlwZSI6InB1YmtleSJ9LHsibmFtZSI6ImFtb3VudCIsInR5cGUiOiJ1NjQifSx7Im5hbWUiOiJsb2NrX3VudGlsIiwidHlwZSI6Imk2NCJ9XX19LHsibmFtZSI6IkVzY3Jvd1dpdGhkcmF3biIsInR5cGUiOnsia2luZCI6InN0cnVjdCIsImZpZWxkcyI6W3sibmFtZSI6InNlcmllcyIsInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJvd25lciIsInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJtaW50IiwidHlwZSI6InB1YmtleSJ9LHsibmFtZSI6ImFtb3VudCIsInR5cGUiOiJ1NjQifV19fSx7Im5hbWUiOiJGaWxsRXhlY3V0ZWQiLCJ0eXBlIjp7ImtpbmQiOiJzdHJ1Y3QiLCJmaWVsZHMiOlt7Im5hbWUiOiJyb3VuZF9pZCIsInR5cGUiOnsiYXJyYXkiOlsidTgiLDMyXX19LHsibmFtZSI6InNlcmllcyIsInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJyZXF1ZXN0ZXIiLCJ0eXBlIjoicHVia2V5In0seyJuYW1lIjoiZGVhbGVyIiwidHlwZSI6InB1YmtleSJ9LHsibmFtZSI6ImFzc2V0X2Ftb3VudCIsInR5cGUiOiJ1NjQifSx7Im5hbWUiOiJxdW90ZV9hbW91bnQiLCJ0eXBlIjoidTY0In1dfX0seyJuYW1lIjoiRmlsbFJlY2VpcHQiLCJ0eXBlIjp7ImtpbmQiOiJzdHJ1Y3QiLCJmaWVsZHMiOlt7Im5hbWUiOiJyb3VuZF9pZCIsImRvY3MiOlsiVW5pcXVlIHJvdW5kIElEICgzMiBieXRlcyksIGFjdHMgYXMgdGhlIGdsb2JhbCByZXBsYXkgZ3VhcmQiXSwidHlwZSI6eyJhcnJheSI6WyJ1OCIsMzJdfX0seyJuYW1lIjoic2VyaWVzIiwiZG9jcyI6WyJTZXJpZXMgUERBIHRyYWRlZCBpbiB0aGlzIGZpbGwiXSwidHlwZSI6InB1YmtleSJ9LHsibmFtZSI6InJlcXVlc3RlciIsImRvY3MiOlsiUmVxdWVzdGVyIHdhbGxldCBhZGRyZXNzIl0sInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJkZWFsZXIiLCJkb2NzIjpbIldpbm5pbmcgZGVhbGVyIHdhbGxldCBhZGRyZXNzIl0sInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJzaWRlIiwiZG9jcyI6WyIwID0gU2VsbFBULCAxID0gU2VsbFlUIl0sInR5cGUiOiJ1OCJ9LHsibmFtZSI6ImFzc2V0X2Ftb3VudCIsImRvY3MiOlsiUXVhbnRpdHkgb2YgYXNzZXQgdG9rZW5zIChQVCBvciBZVCkgZmlsbGVkIl0sInR5cGUiOiJ1NjQifSx7Im5hbWUiOiJxdW90ZV9hbW91bnQiLCJkb2NzIjpbIlF1YW50aXR5IG9mIHF1b3RlIHRva2VucyBwYWlkIl0sInR5cGUiOiJ1NjQifSx7Im5hbWUiOiJxdW90ZV9taW50IiwiZG9jcyI6WyJRdW90ZSBjdXJyZW5jeSBtaW50Il0sInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJ0cyIsImRvY3MiOlsiVW5peCB0aW1lc3RhbXAgb2YgcmVjZWlwdCBjcmVhdGlvbiJdLCJ0eXBlIjoiaTY0In0seyJuYW1lIjoicmVwb3J0X2hhc2giLCJkb2NzIjpbIkhhc2ggb2YgdGhlIHNpZ25lZCBmb3J3YXJkZXIgcmVwb3J0Il0sInR5cGUiOnsiYXJyYXkiOlsidTgiLDMyXX19LHsibmFtZSI6InN0YXR1cyIsImRvY3MiOlsiRmlsbCBsaWZlY3ljbGUgc3RhdHVzOiAwID0gQXBwcm92ZWQsIDEgPSBFeGVjdXRlZCJdLCJ0eXBlIjoidTgifSx7Im5hbWUiOiJidW1wIiwiZG9jcyI6WyJQREEgYnVtcCBzZWVkIl0sInR5cGUiOiJ1OCJ9XX19LHsibmFtZSI6IkZpbGxSZXBvcnQiLCJ0eXBlIjp7ImtpbmQiOiJzdHJ1Y3QiLCJmaWVsZHMiOlt7Im5hbWUiOiJraW5kIiwidHlwZSI6InU4In0seyJuYW1lIjoidmVyc2lvbiIsInR5cGUiOiJ1OCJ9LHsibmFtZSI6InJvdW5kX2lkIiwidHlwZSI6eyJhcnJheSI6WyJ1OCIsMzJdfX0seyJuYW1lIjoic2VyaWVzIiwidHlwZSI6InB1YmtleSJ9LHsibmFtZSI6InNpZGUiLCJ0eXBlIjoidTgifSx7Im5hbWUiOiJyZXF1ZXN0ZXIiLCJ0eXBlIjoicHVia2V5In0seyJuYW1lIjoiZGVhbGVyIiwidHlwZSI6InB1YmtleSJ9LHsibmFtZSI6ImFzc2V0X2Ftb3VudCIsInR5cGUiOiJ1NjQifSx7Im5hbWUiOiJxdW90ZV9hbW91bnQiLCJ0eXBlIjoidTY0In0seyJuYW1lIjoicXVvdGVfbWludCIsInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJub3RfYWZ0ZXIiLCJ0eXBlIjoiaTY0In1dfX0seyJuYW1lIjoiRm9yd2FyZGVyRW50cnkiLCJ0eXBlIjp7ImtpbmQiOiJzdHJ1Y3QiLCJmaWVsZHMiOlt7Im5hbWUiOiJwcm9ncmFtIiwiZG9jcyI6WyJLZXlzdG9uZSBmb3J3YXJkZXIgcHJvZ3JhbSBhZGRyZXNzIl0sInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJzdGF0ZSIsImRvY3MiOlsiS2V5c3RvbmUgZm9yd2FyZGVyIHN0YXRlIGFjY291bnQiXSwidHlwZSI6InB1YmtleSJ9LHsibmFtZSI6ImFsbG93ZWRfd29ya2Zsb3ciLCJkb2NzIjpbIkF1dGhvcml6ZWQgd29ya2Zsb3cgSUQgKDMyIGJ5dGVzKSB0aGF0IG1heSBzdWJtaXQgcmVwb3J0cyB0aHJvdWdoIHRoaXMgZm9yd2FyZGVyIl0sInR5cGUiOnsiYXJyYXkiOlsidTgiLDMyXX19XX19LHsibmFtZSI6IkZvcndhcmRlclVwZGF0ZWQiLCJ0eXBlIjp7ImtpbmQiOiJzdHJ1Y3QiLCJmaWVsZHMiOlt7Im5hbWUiOiJpbmRleCIsInR5cGUiOiJ1OCJ9LHsibmFtZSI6InByb2dyYW0iLCJ0eXBlIjoicHVia2V5In0seyJuYW1lIjoic3RhdGUiLCJ0eXBlIjoicHVia2V5In0seyJuYW1lIjoiYWxsb3dlZF93b3JrZmxvdyIsInR5cGUiOnsiYXJyYXkiOlsidTgiLDMyXX19XX19LHsibmFtZSI6Ikdsb2JhbFBhdXNlVG9nZ2xlZCIsInR5cGUiOnsia2luZCI6InN0cnVjdCIsImZpZWxkcyI6W3sibmFtZSI6InBhdXNlZCIsInR5cGUiOiJib29sIn1dfX0seyJuYW1lIjoiUHRSZWRlZW1lZCIsInR5cGUiOnsia2luZCI6InN0cnVjdCIsImZpZWxkcyI6W3sibmFtZSI6InNlcmllcyIsInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJ1c2VyIiwidHlwZSI6InB1YmtleSJ9LHsibmFtZSI6InB0X2Ftb3VudCIsInR5cGUiOiJ1NjQifSx7Im5hbWUiOiJyYXdfY29sbGF0ZXJhbF9yZWNlaXZlZCIsInR5cGUiOiJ1NjQifV19fSx7Im5hbWUiOiJSYXRlUmVwb3J0IiwidHlwZSI6eyJraW5kIjoic3RydWN0IiwiZmllbGRzIjpbeyJuYW1lIjoia2luZCIsInR5cGUiOiJ1OCJ9LHsibmFtZSI6InZlcnNpb24iLCJ0eXBlIjoidTgifSx7Im5hbWUiOiJiZW5jaG1hcmtfaWQiLCJ0eXBlIjp7ImFycmF5IjpbInU4Iiw4XX19LHsibmFtZSI6InJhdGVfYnBzIiwidHlwZSI6Imk2NCJ9LHsibmFtZSI6IndpbmRvd19lbmQiLCJ0eXBlIjoiaTY0In1dfX0seyJuYW1lIjoiUmVjZWl2ZWRGaWxsUmVwb3J0IiwidHlwZSI6eyJraW5kIjoic3RydWN0IiwiZmllbGRzIjpbeyJuYW1lIjoicmVwb3J0IiwidHlwZSI6eyJkZWZpbmVkIjp7Im5hbWUiOiJGaWxsUmVwb3J0In19fSx7Im5hbWUiOiJyZXBvcnRfaGFzaCIsInR5cGUiOnsiYXJyYXkiOlsidTgiLDMyXX19XX19LHsibmFtZSI6IlJlY2VpdmVkUmF0ZVJlcG9ydCIsInR5cGUiOnsia2luZCI6InN0cnVjdCIsImZpZWxkcyI6W3sibmFtZSI6InJlcG9ydCIsInR5cGUiOnsiZGVmaW5lZCI6eyJuYW1lIjoiUmF0ZVJlcG9ydCJ9fX1dfX0seyJuYW1lIjoiUmVjZWl2ZWRTZXR0bGVSZXBvcnQiLCJ0eXBlIjp7ImtpbmQiOiJzdHJ1Y3QiLCJmaWVsZHMiOlt7Im5hbWUiOiJyZXBvcnQiLCJ0eXBlIjp7ImRlZmluZWQiOnsibmFtZSI6IlNldHRsZVJlcG9ydCJ9fX0seyJuYW1lIjoic2VyaWVzIiwidHlwZSI6InB1YmtleSJ9LHsibmFtZSI6ImlkeF9zZXR0bGUiLCJ0eXBlIjoidTEyOCJ9XX19LHsibmFtZSI6IlJlZ2lzdHJ5IiwidHlwZSI6eyJraW5kIjoic3RydWN0IiwiZmllbGRzIjpbeyJuYW1lIjoiY291bnQiLCJkb2NzIjpbIkFjdGl2ZSBzZXJpZXMgY291bnQiXSwidHlwZSI6InUxNiJ9LHsibmFtZSI6InNlcmllcyIsImRvY3MiOlsiVXAgdG8gNjQgYWN0aXZlIHNlcmllcyBwdWJrZXlzIl0sInR5cGUiOnsidmVjIjoicHVia2V5In19LHsibmFtZSI6ImJ1bXAiLCJkb2NzIjpbIlBEQSBidW1wIHNlZWQiXSwidHlwZSI6InU4In1dfX0seyJuYW1lIjoiU2VyaWVzIiwidHlwZSI6eyJraW5kIjoic3RydWN0IiwiZmllbGRzIjpbeyJuYW1lIjoiY29sbGF0ZXJhbF9taW50IiwiZG9jcyI6WyJDb2xsYXRlcmFsIHRva2VuIG1pbnQgKFRva2VuIG9yIFRva2VuLTIwMjIpIl0sInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJjb2xsYXRlcmFsX3Byb2dyYW0iLCJkb2NzIjpbIlRva2VuIHByb2dyYW0gb3duaW5nIHRoZSBjb2xsYXRlcmFsIG1pbnQgKFRva2VuIG9yIFRva2VuLTIwMjIpIl0sInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJxdW90ZV9taW50IiwiZG9jcyI6WyJEZW5vbWluYXRlZCBxdW90ZSBjdXJyZW5jeSBtaW50IChlLmcuIHdTT0wgZm9yIHN0YWtpbmcsIFVTREMgZm9yIGVxdWl0aWVzKSJdLCJ0eXBlIjoicHVia2V5In0seyJuYW1lIjoiaW5kZXhfa2luZCIsImRvY3MiOlsiWWllbGQgaW5kZXggdHlwZTogMCA9IFN0YWtlUG9vbFJhdGUsIDEgPSBTY2FsZWRVaURpdmlkZW5kQWRqdXN0ZWQsIDIgPSBPcmFjbGVJbmRleCJdLCJ0eXBlIjoidTgifSx7Im5hbWUiOiJpbmRleF9zb3VyY2UiLCJkb2NzIjpbIlNvdXJjZSBhY2NvdW50IG9yIHB1YmtleSBmb3IgdGhlIGluZGV4IChlLmcuIHN0YWtlIHBvb2wgYWNjb3VudCBvciBwcmljZSBmZWVkKSJdLCJ0eXBlIjoicHVia2V5In0seyJuYW1lIjoiaWR4X29wZW4iLCJkb2NzIjpbIkluZGV4IHZhbHVlIGF0IHNlcmllcyBvcGVuaW5nLCBzY2FsZWQgYnkgV0FEICgxZTE4KSJdLCJ0eXBlIjoidTEyOCJ9LHsibmFtZSI6Im9wZW5fdHMiLCJkb2NzIjpbIlVuaXggdGltZXN0YW1wIHdoZW4gdGhlIHNlcmllcyB3YXMgY3JlYXRlZCJdLCJ0eXBlIjoiaTY0In0seyJuYW1lIjoibWF0dXJpdHlfdHMiLCJkb2NzIjpbIlVuaXggdGltZXN0YW1wIHdoZW4gdGhlIHNlcmllcyByZWFjaGVzIG1hdHVyaXR5Il0sInR5cGUiOiJpNjQifSx7Im5hbWUiOiJwdF9taW50IiwiZG9jcyI6WyJQcmluY2lwYWwgVG9rZW4gKFBUKSBUb2tlbi0yMDIyIG1pbnQgYWRkcmVzcyJdLCJ0eXBlIjoicHVia2V5In0seyJuYW1lIjoieXRfbWludCIsImRvY3MiOlsiWWllbGQgVG9rZW4gKFlUKSBUb2tlbi0yMDIyIG1pbnQgYWRkcmVzcyJdLCJ0eXBlIjoicHVia2V5In0seyJuYW1lIjoidmF1bHQiLCJkb2NzIjpbIlZhdWx0IGFjY291bnQgKEFUQSkgb3duZWQgYnkgdGhpcyBTZXJpZXMgUERBIGhvbGRpbmcgcmF3IGNvbGxhdGVyYWwiXSwidHlwZSI6InB1YmtleSJ9LHsibmFtZSI6InN0YXR1cyIsImRvY3MiOlsiQ3VycmVudCBsaWZlY3ljbGUgc3RhdHVzOiAwID0gT3BlbiwgMSA9IFNldHRsZWQsIDIgPSBEaXNwdXRlZCwgMyA9IFBhdXNlZCJdLCJ0eXBlIjoidTgifSx7Im5hbWUiOiJpZHhfc2V0dGxlIiwiZG9jcyI6WyJTZXR0bGVkIGluZGV4IHZhbHVlIHNjYWxlZCBieSBXQUQgKDFlMTgpIl0sInR5cGUiOiJ1MTI4In0seyJuYW1lIjoic3BsaXRfbnVtIiwiZG9jcyI6WyJDdW11bGF0aXZlIGNvcnBvcmF0ZSBzcGxpdCBmYWN0b3IgbnVtZXJhdG9yICgxIGlmIG5vIHNwbGl0KSJdLCJ0eXBlIjoidTMyIn0seyJuYW1lIjoic3BsaXRfZGVuIiwiZG9jcyI6WyJDdW11bGF0aXZlIGNvcnBvcmF0ZSBzcGxpdCBmYWN0b3IgZGVub21pbmF0b3IgKDEgaWYgbm8gc3BsaXQpIl0sInR5cGUiOiJ1MzIifSx7Im5hbWUiOiJzZXR0bGVkX3RzIiwiZG9jcyI6WyJVbml4IHRpbWVzdGFtcCB3aGVuIHNldHRsZW1lbnQgb2NjdXJyZWQiXSwidHlwZSI6Imk2NCJ9LHsibmFtZSI6InByaXZhY3lfbW9kZSIsImRvY3MiOlsiUHJpdmFjeSBtb2RlOiAwID0gUGxhaW4sIDEgPSBDb25maWRlbnRpYWwgKGltbXV0YWJsZSkiXSwidHlwZSI6InU4In0seyJuYW1lIjoibWF4X3JhdGVfYnBzIiwiZG9jcyI6WyJNYXhpbXVtIGFsbG93YWJsZSBhbm51YWxpemVkIHJhdGUgaW4gYmFzaXMgcG9pbnRzIChzYW5pdHkgY2FwKSJdLCJ0eXBlIjoidTMyIn0seyJuYW1lIjoiZGl2aWRlbmRfY2FwX2JwcyIsImRvY3MiOlsiTWF4aW11bSBhbGxvd2FibGUgZGl2aWRlbmQgaW5jcmVhc2UgaW4gYmFzaXMgcG9pbnRzIChzYW5pdHkgY2FwIGZvciBlcXVpdGllcykiXSwidHlwZSI6InUzMiJ9LHsibmFtZSI6Im5vbmNlIiwiZG9jcyI6WyJOb25jZSB0byBhbGxvdyBkaXN0aW5jdCBzZXJpZXMgd2l0aCB0aGUgc2FtZSBjb2xsYXRlcmFsIGFuZCBtYXR1cml0eSJdLCJ0eXBlIjoidTE2In0seyJuYW1lIjoiYnVtcCIsImRvY3MiOlsiUERBIGJ1bXAgc2VlZCJdLCJ0eXBlIjoidTgifV19fSx7Im5hbWUiOiJTZXJpZXNPcGVuZWQiLCJ0eXBlIjp7ImtpbmQiOiJzdHJ1Y3QiLCJmaWVsZHMiOlt7Im5hbWUiOiJzZXJpZXMiLCJ0eXBlIjoicHVia2V5In0seyJuYW1lIjoiY29sbGF0ZXJhbF9taW50IiwidHlwZSI6InB1YmtleSJ9LHsibmFtZSI6InF1b3RlX21pbnQiLCJ0eXBlIjoicHVia2V5In0seyJuYW1lIjoicHRfbWludCIsInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJ5dF9taW50IiwidHlwZSI6InB1YmtleSJ9LHsibmFtZSI6Im9wZW5fdHMiLCJ0eXBlIjoiaTY0In0seyJuYW1lIjoibWF0dXJpdHlfdHMiLCJ0eXBlIjoiaTY0In0seyJuYW1lIjoiaWR4X29wZW4iLCJ0eXBlIjoidTEyOCJ9XX19LHsibmFtZSI6IlNlcmllc1BhdXNlVG9nZ2xlZCIsInR5cGUiOnsia2luZCI6InN0cnVjdCIsImZpZWxkcyI6W3sibmFtZSI6InNlcmllcyIsInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJwYXVzZWQiLCJ0eXBlIjoiYm9vbCJ9XX19LHsibmFtZSI6IlNldHRsZVJlcG9ydCIsInR5cGUiOnsia2luZCI6InN0cnVjdCIsImZpZWxkcyI6W3sibmFtZSI6ImtpbmQiLCJ0eXBlIjoidTgifSx7Im5hbWUiOiJ2ZXJzaW9uIiwidHlwZSI6InU4In0seyJuYW1lIjoic2VyaWVzIiwidHlwZSI6InB1YmtleSJ9LHsibmFtZSI6Im9ic2VydmVkX3RzIiwidHlwZSI6Imk2NCJ9LHsibmFtZSI6ImluZGV4X3dhZCIsInR5cGUiOiJ1MTI4In0seyJuYW1lIjoic3BsaXRfbnVtIiwidHlwZSI6InUzMiJ9LHsibmFtZSI6InNwbGl0X2RlbiIsInR5cGUiOiJ1MzIifV19fSx7Im5hbWUiOiJUb2tlbnNNZXJnZWQiLCJ0eXBlIjp7ImtpbmQiOiJzdHJ1Y3QiLCJmaWVsZHMiOlt7Im5hbWUiOiJzZXJpZXMiLCJ0eXBlIjoicHVia2V5In0seyJuYW1lIjoidXNlciIsInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJhbW91bnQiLCJ0eXBlIjoidTY0In1dfX0seyJuYW1lIjoiVG9rZW5zU3RyaXBwZWQiLCJ0eXBlIjp7ImtpbmQiOiJzdHJ1Y3QiLCJmaWVsZHMiOlt7Im5hbWUiOiJzZXJpZXMiLCJ0eXBlIjoicHVia2V5In0seyJuYW1lIjoidXNlciIsInR5cGUiOiJwdWJrZXkifSx7Im5hbWUiOiJhbW91bnQiLCJ0eXBlIjoidTY0In1dfX0seyJuYW1lIjoiWXRDbGFpbWVkIiwidHlwZSI6eyJraW5kIjoic3RydWN0IiwiZmllbGRzIjpbeyJuYW1lIjoic2VyaWVzIiwidHlwZSI6InB1YmtleSJ9LHsibmFtZSI6InVzZXIiLCJ0eXBlIjoicHVia2V5In0seyJuYW1lIjoieXRfYW1vdW50IiwidHlwZSI6InU2NCJ9LHsibmFtZSI6InJhd19jb2xsYXRlcmFsX3JlY2VpdmVkIiwidHlwZSI6InU2NCJ9XX19XX0='

const DISCRIMINATOR_SIZE = 8

const expectDiscriminator = (label: string, expected: Uint8Array, data: Uint8Array): Uint8Array => {
  if (data.length < DISCRIMINATOR_SIZE) {
    throw new Error(`${label}: data too short for discriminator (${data.length} bytes)`)
  }
  for (let i = 0; i < DISCRIMINATOR_SIZE; i++) {
    if (data[i] !== expected[i]) {
      throw new Error(`${label}: discriminator mismatch`)
    }
  }
  return data.subarray(DISCRIMINATOR_SIZE)
}

export type AllowEntry = {
  wallet: Address
  expiryTs: bigint
  roles: number
  bump: number
}

export const allowEntryCodec = getStructCodec([
  ['wallet', getAddressCodec()],
  ['expiryTs', getI64Codec()],
  ['roles', getU8Codec()],
  ['bump', getU8Codec()],
])

export type AllowEntryRemoved = {
  wallet: Address
}

export const allowEntryRemovedCodec = getStructCodec([
  ['wallet', getAddressCodec()],
])

export type AllowEntrySet = {
  wallet: Address
  roles: number
  expiryTs: bigint
}

export const allowEntrySetCodec = getStructCodec([
  ['wallet', getAddressCodec()],
  ['roles', getU8Codec()],
  ['expiryTs', getI64Codec()],
])

export type AuthorityTransferAccepted = {
  oldAuthority: Address
  newAuthority: Address
}

export const authorityTransferAcceptedCodec = getStructCodec([
  ['oldAuthority', getAddressCodec()],
  ['newAuthority', getAddressCodec()],
])

export type AuthorityTransferProposed = {
  currentAuthority: Address
  pendingAuthority: Address
}

export const authorityTransferProposedCodec = getStructCodec([
  ['currentAuthority', getAddressCodec()],
  ['pendingAuthority', getAddressCodec()],
])

export type ForwarderEntry = {
  program: Address
  state: Address
  allowedWorkflow: number[]
}

export const forwarderEntryCodec = getStructCodec([
  ['program', getAddressCodec()],
  ['state', getAddressCodec()],
  ['allowedWorkflow', getArrayCodec(getU8Codec(), { size: 32 })],
])

export type Config = {
  authority: Address
  pendingAuthority: Address
  forwarders: ForwarderEntry[]
  forwarderCount: number
  enclaveKeyHash: number[]
  paused: boolean
  clusterMode: number
  feeBps: number
  treasury: Address
  bump: number
}

export const configCodec = getStructCodec([
  ['authority', getAddressCodec()],
  ['pendingAuthority', getAddressCodec()],
  ['forwarders', getArrayCodec(forwarderEntryCodec, { size: 2 })],
  ['forwarderCount', getU8Codec()],
  ['enclaveKeyHash', getArrayCodec(getU8Codec(), { size: 32 })],
  ['paused', getBooleanCodec()],
  ['clusterMode', getU8Codec()],
  ['feeBps', getU16Codec()],
  ['treasury', getAddressCodec()],
  ['bump', getU8Codec()],
])

export type ConfigInitialized = {
  authority: Address
  clusterMode: number
}

export const configInitializedCodec = getStructCodec([
  ['authority', getAddressCodec()],
  ['clusterMode', getU8Codec()],
])

export type Escrow = {
  owner: Address
  series: Address
  mint: Address
  lockUntil: bigint
  amount: bigint
  bump: number
}

export const escrowCodec = getStructCodec([
  ['owner', getAddressCodec()],
  ['series', getAddressCodec()],
  ['mint', getAddressCodec()],
  ['lockUntil', getI64Codec()],
  ['amount', getU64Codec()],
  ['bump', getU8Codec()],
])

export type EscrowLocked = {
  series: Address
  owner: Address
  mint: Address
  amount: bigint
  lockUntil: bigint
}

export const escrowLockedCodec = getStructCodec([
  ['series', getAddressCodec()],
  ['owner', getAddressCodec()],
  ['mint', getAddressCodec()],
  ['amount', getU64Codec()],
  ['lockUntil', getI64Codec()],
])

export type EscrowWithdrawn = {
  series: Address
  owner: Address
  mint: Address
  amount: bigint
}

export const escrowWithdrawnCodec = getStructCodec([
  ['series', getAddressCodec()],
  ['owner', getAddressCodec()],
  ['mint', getAddressCodec()],
  ['amount', getU64Codec()],
])

export type FillExecuted = {
  roundId: number[]
  series: Address
  requester: Address
  dealer: Address
  assetAmount: bigint
  quoteAmount: bigint
}

export const fillExecutedCodec = getStructCodec([
  ['roundId', getArrayCodec(getU8Codec(), { size: 32 })],
  ['series', getAddressCodec()],
  ['requester', getAddressCodec()],
  ['dealer', getAddressCodec()],
  ['assetAmount', getU64Codec()],
  ['quoteAmount', getU64Codec()],
])

export type FillReceipt = {
  roundId: number[]
  series: Address
  requester: Address
  dealer: Address
  side: number
  assetAmount: bigint
  quoteAmount: bigint
  quoteMint: Address
  ts: bigint
  reportHash: number[]
  status: number
  bump: number
}

export const fillReceiptCodec = getStructCodec([
  ['roundId', getArrayCodec(getU8Codec(), { size: 32 })],
  ['series', getAddressCodec()],
  ['requester', getAddressCodec()],
  ['dealer', getAddressCodec()],
  ['side', getU8Codec()],
  ['assetAmount', getU64Codec()],
  ['quoteAmount', getU64Codec()],
  ['quoteMint', getAddressCodec()],
  ['ts', getI64Codec()],
  ['reportHash', getArrayCodec(getU8Codec(), { size: 32 })],
  ['status', getU8Codec()],
  ['bump', getU8Codec()],
])

export type FillReport = {
  kind: number
  version: number
  roundId: number[]
  series: Address
  side: number
  requester: Address
  dealer: Address
  assetAmount: bigint
  quoteAmount: bigint
  quoteMint: Address
  notAfter: bigint
}

export const fillReportCodec = getStructCodec([
  ['kind', getU8Codec()],
  ['version', getU8Codec()],
  ['roundId', getArrayCodec(getU8Codec(), { size: 32 })],
  ['series', getAddressCodec()],
  ['side', getU8Codec()],
  ['requester', getAddressCodec()],
  ['dealer', getAddressCodec()],
  ['assetAmount', getU64Codec()],
  ['quoteAmount', getU64Codec()],
  ['quoteMint', getAddressCodec()],
  ['notAfter', getI64Codec()],
])

export type ForwarderUpdated = {
  index: number
  program: Address
  state: Address
  allowedWorkflow: number[]
}

export const forwarderUpdatedCodec = getStructCodec([
  ['index', getU8Codec()],
  ['program', getAddressCodec()],
  ['state', getAddressCodec()],
  ['allowedWorkflow', getArrayCodec(getU8Codec(), { size: 32 })],
])

export type GlobalPauseToggled = {
  paused: boolean
}

export const globalPauseToggledCodec = getStructCodec([
  ['paused', getBooleanCodec()],
])

export type PtRedeemed = {
  series: Address
  user: Address
  ptAmount: bigint
  rawCollateralReceived: bigint
}

export const ptRedeemedCodec = getStructCodec([
  ['series', getAddressCodec()],
  ['user', getAddressCodec()],
  ['ptAmount', getU64Codec()],
  ['rawCollateralReceived', getU64Codec()],
])

export type RateReport = {
  kind: number
  version: number
  benchmarkId: number[]
  rateBps: bigint
  windowEnd: bigint
}

export const rateReportCodec = getStructCodec([
  ['kind', getU8Codec()],
  ['version', getU8Codec()],
  ['benchmarkId', getArrayCodec(getU8Codec(), { size: 8 })],
  ['rateBps', getI64Codec()],
  ['windowEnd', getI64Codec()],
])

export type ReceivedFillReport = {
  report: FillReport
  reportHash: number[]
}

export const receivedFillReportCodec = getStructCodec([
  ['report', fillReportCodec],
  ['reportHash', getArrayCodec(getU8Codec(), { size: 32 })],
])

export type ReceivedRateReport = {
  report: RateReport
}

export const receivedRateReportCodec = getStructCodec([
  ['report', rateReportCodec],
])

export type SettleReport = {
  kind: number
  version: number
  series: Address
  observedTs: bigint
  indexWad: bigint
  splitNum: number
  splitDen: number
}

export const settleReportCodec = getStructCodec([
  ['kind', getU8Codec()],
  ['version', getU8Codec()],
  ['series', getAddressCodec()],
  ['observedTs', getI64Codec()],
  ['indexWad', getU128Codec()],
  ['splitNum', getU32Codec()],
  ['splitDen', getU32Codec()],
])

export type ReceivedSettleReport = {
  report: SettleReport
  series: Address
  idxSettle: bigint
}

export const receivedSettleReportCodec = getStructCodec([
  ['report', settleReportCodec],
  ['series', getAddressCodec()],
  ['idxSettle', getU128Codec()],
])

export type Registry = {
  count: number
  series: Address[]
  bump: number
}

export const registryCodec = getStructCodec([
  ['count', getU16Codec()],
  ['series', getArrayCodec(getAddressCodec(), { size: getU32Codec() })],
  ['bump', getU8Codec()],
])

export type Series = {
  collateralMint: Address
  collateralProgram: Address
  quoteMint: Address
  indexKind: number
  indexSource: Address
  idxOpen: bigint
  openTs: bigint
  maturityTs: bigint
  ptMint: Address
  ytMint: Address
  vault: Address
  status: number
  idxSettle: bigint
  splitNum: number
  splitDen: number
  settledTs: bigint
  privacyMode: number
  maxRateBps: number
  dividendCapBps: number
  nonce: number
  bump: number
}

export const seriesCodec = getStructCodec([
  ['collateralMint', getAddressCodec()],
  ['collateralProgram', getAddressCodec()],
  ['quoteMint', getAddressCodec()],
  ['indexKind', getU8Codec()],
  ['indexSource', getAddressCodec()],
  ['idxOpen', getU128Codec()],
  ['openTs', getI64Codec()],
  ['maturityTs', getI64Codec()],
  ['ptMint', getAddressCodec()],
  ['ytMint', getAddressCodec()],
  ['vault', getAddressCodec()],
  ['status', getU8Codec()],
  ['idxSettle', getU128Codec()],
  ['splitNum', getU32Codec()],
  ['splitDen', getU32Codec()],
  ['settledTs', getI64Codec()],
  ['privacyMode', getU8Codec()],
  ['maxRateBps', getU32Codec()],
  ['dividendCapBps', getU32Codec()],
  ['nonce', getU16Codec()],
  ['bump', getU8Codec()],
])

export type SeriesOpened = {
  series: Address
  collateralMint: Address
  quoteMint: Address
  ptMint: Address
  ytMint: Address
  openTs: bigint
  maturityTs: bigint
  idxOpen: bigint
}

export const seriesOpenedCodec = getStructCodec([
  ['series', getAddressCodec()],
  ['collateralMint', getAddressCodec()],
  ['quoteMint', getAddressCodec()],
  ['ptMint', getAddressCodec()],
  ['ytMint', getAddressCodec()],
  ['openTs', getI64Codec()],
  ['maturityTs', getI64Codec()],
  ['idxOpen', getU128Codec()],
])

export type SeriesPauseToggled = {
  series: Address
  paused: boolean
}

export const seriesPauseToggledCodec = getStructCodec([
  ['series', getAddressCodec()],
  ['paused', getBooleanCodec()],
])

export type TokensMerged = {
  series: Address
  user: Address
  amount: bigint
}

export const tokensMergedCodec = getStructCodec([
  ['series', getAddressCodec()],
  ['user', getAddressCodec()],
  ['amount', getU64Codec()],
])

export type TokensStripped = {
  series: Address
  user: Address
  amount: bigint
}

export const tokensStrippedCodec = getStructCodec([
  ['series', getAddressCodec()],
  ['user', getAddressCodec()],
  ['amount', getU64Codec()],
])

export type YtClaimed = {
  series: Address
  user: Address
  ytAmount: bigint
  rawCollateralReceived: bigint
}

export const ytClaimedCodec = getStructCodec([
  ['series', getAddressCodec()],
  ['user', getAddressCodec()],
  ['ytAmount', getU64Codec()],
  ['rawCollateralReceived', getU64Codec()],
])

export const ACCOUNT_ALLOW_ENTRY_DISCRIMINATOR = new Uint8Array([3, 29, 6, 254, 2, 209, 219, 245])

/**
 * Decodes raw AllowEntry account data (with its 8-byte discriminator) into AllowEntry.
 * Pure helper — there is no read capability; obtain the account bytes elsewhere.
 */
export const decodeAllowEntryAccount = (data: Uint8Array): AllowEntry =>
  allowEntryCodec.decode(expectDiscriminator('account AllowEntry', ACCOUNT_ALLOW_ENTRY_DISCRIMINATOR, data)) as AllowEntry

export const ACCOUNT_CONFIG_DISCRIMINATOR = new Uint8Array([155, 12, 170, 224, 30, 250, 204, 130])

/**
 * Decodes raw Config account data (with its 8-byte discriminator) into Config.
 * Pure helper — there is no read capability; obtain the account bytes elsewhere.
 */
export const decodeConfigAccount = (data: Uint8Array): Config =>
  configCodec.decode(expectDiscriminator('account Config', ACCOUNT_CONFIG_DISCRIMINATOR, data)) as Config

export const ACCOUNT_ESCROW_DISCRIMINATOR = new Uint8Array([31, 213, 123, 187, 186, 22, 218, 155])

/**
 * Decodes raw Escrow account data (with its 8-byte discriminator) into Escrow.
 * Pure helper — there is no read capability; obtain the account bytes elsewhere.
 */
export const decodeEscrowAccount = (data: Uint8Array): Escrow =>
  escrowCodec.decode(expectDiscriminator('account Escrow', ACCOUNT_ESCROW_DISCRIMINATOR, data)) as Escrow

export const ACCOUNT_FILL_RECEIPT_DISCRIMINATOR = new Uint8Array([8, 10, 169, 84, 163, 19, 167, 139])

/**
 * Decodes raw FillReceipt account data (with its 8-byte discriminator) into FillReceipt.
 * Pure helper — there is no read capability; obtain the account bytes elsewhere.
 */
export const decodeFillReceiptAccount = (data: Uint8Array): FillReceipt =>
  fillReceiptCodec.decode(expectDiscriminator('account FillReceipt', ACCOUNT_FILL_RECEIPT_DISCRIMINATOR, data)) as FillReceipt

export const ACCOUNT_REGISTRY_DISCRIMINATOR = new Uint8Array([47, 174, 110, 246, 184, 182, 252, 218])

/**
 * Decodes raw Registry account data (with its 8-byte discriminator) into Registry.
 * Pure helper — there is no read capability; obtain the account bytes elsewhere.
 */
export const decodeRegistryAccount = (data: Uint8Array): Registry =>
  registryCodec.decode(expectDiscriminator('account Registry', ACCOUNT_REGISTRY_DISCRIMINATOR, data)) as Registry

export const ACCOUNT_SERIES_DISCRIMINATOR = new Uint8Array([240, 97, 8, 183, 139, 77, 250, 162])

/**
 * Decodes raw Series account data (with its 8-byte discriminator) into Series.
 * Pure helper — there is no read capability; obtain the account bytes elsewhere.
 */
export const decodeSeriesAccount = (data: Uint8Array): Series =>
  seriesCodec.decode(expectDiscriminator('account Series', ACCOUNT_SERIES_DISCRIMINATOR, data)) as Series

export const EVENT_ALLOW_ENTRY_REMOVED_DISCRIMINATOR = new Uint8Array([116, 251, 75, 240, 62, 90, 18, 157])

/**
 * Decodes raw AllowEntryRemoved event data (with its 8-byte discriminator) into AllowEntryRemoved.
 */
export const decodeAllowEntryRemovedEvent = (data: Uint8Array): AllowEntryRemoved =>
  allowEntryRemovedCodec.decode(expectDiscriminator('event AllowEntryRemoved', EVENT_ALLOW_ENTRY_REMOVED_DISCRIMINATOR, data)) as AllowEntryRemoved

export const EVENT_ALLOW_ENTRY_SET_DISCRIMINATOR = new Uint8Array([167, 199, 136, 57, 136, 245, 22, 172])

/**
 * Decodes raw AllowEntrySet event data (with its 8-byte discriminator) into AllowEntrySet.
 */
export const decodeAllowEntrySetEvent = (data: Uint8Array): AllowEntrySet =>
  allowEntrySetCodec.decode(expectDiscriminator('event AllowEntrySet', EVENT_ALLOW_ENTRY_SET_DISCRIMINATOR, data)) as AllowEntrySet

export const EVENT_AUTHORITY_TRANSFER_ACCEPTED_DISCRIMINATOR = new Uint8Array([149, 165, 140, 221, 104, 203, 239, 121])

/**
 * Decodes raw AuthorityTransferAccepted event data (with its 8-byte discriminator) into AuthorityTransferAccepted.
 */
export const decodeAuthorityTransferAcceptedEvent = (data: Uint8Array): AuthorityTransferAccepted =>
  authorityTransferAcceptedCodec.decode(expectDiscriminator('event AuthorityTransferAccepted', EVENT_AUTHORITY_TRANSFER_ACCEPTED_DISCRIMINATOR, data)) as AuthorityTransferAccepted

export const EVENT_AUTHORITY_TRANSFER_PROPOSED_DISCRIMINATOR = new Uint8Array([103, 244, 27, 116, 177, 4, 100, 119])

/**
 * Decodes raw AuthorityTransferProposed event data (with its 8-byte discriminator) into AuthorityTransferProposed.
 */
export const decodeAuthorityTransferProposedEvent = (data: Uint8Array): AuthorityTransferProposed =>
  authorityTransferProposedCodec.decode(expectDiscriminator('event AuthorityTransferProposed', EVENT_AUTHORITY_TRANSFER_PROPOSED_DISCRIMINATOR, data)) as AuthorityTransferProposed

export const EVENT_CONFIG_INITIALIZED_DISCRIMINATOR = new Uint8Array([181, 49, 200, 156, 19, 167, 178, 91])

/**
 * Decodes raw ConfigInitialized event data (with its 8-byte discriminator) into ConfigInitialized.
 */
export const decodeConfigInitializedEvent = (data: Uint8Array): ConfigInitialized =>
  configInitializedCodec.decode(expectDiscriminator('event ConfigInitialized', EVENT_CONFIG_INITIALIZED_DISCRIMINATOR, data)) as ConfigInitialized

export const EVENT_ESCROW_LOCKED_DISCRIMINATOR = new Uint8Array([128, 116, 18, 115, 200, 133, 30, 120])

/**
 * Decodes raw EscrowLocked event data (with its 8-byte discriminator) into EscrowLocked.
 */
export const decodeEscrowLockedEvent = (data: Uint8Array): EscrowLocked =>
  escrowLockedCodec.decode(expectDiscriminator('event EscrowLocked', EVENT_ESCROW_LOCKED_DISCRIMINATOR, data)) as EscrowLocked

export const EVENT_ESCROW_WITHDRAWN_DISCRIMINATOR = new Uint8Array([43, 206, 174, 47, 105, 219, 216, 239])

/**
 * Decodes raw EscrowWithdrawn event data (with its 8-byte discriminator) into EscrowWithdrawn.
 */
export const decodeEscrowWithdrawnEvent = (data: Uint8Array): EscrowWithdrawn =>
  escrowWithdrawnCodec.decode(expectDiscriminator('event EscrowWithdrawn', EVENT_ESCROW_WITHDRAWN_DISCRIMINATOR, data)) as EscrowWithdrawn

export const EVENT_FILL_EXECUTED_DISCRIMINATOR = new Uint8Array([130, 21, 84, 56, 205, 123, 241, 212])

/**
 * Decodes raw FillExecuted event data (with its 8-byte discriminator) into FillExecuted.
 */
export const decodeFillExecutedEvent = (data: Uint8Array): FillExecuted =>
  fillExecutedCodec.decode(expectDiscriminator('event FillExecuted', EVENT_FILL_EXECUTED_DISCRIMINATOR, data)) as FillExecuted

export const EVENT_FORWARDER_UPDATED_DISCRIMINATOR = new Uint8Array([91, 195, 248, 117, 50, 125, 217, 251])

/**
 * Decodes raw ForwarderUpdated event data (with its 8-byte discriminator) into ForwarderUpdated.
 */
export const decodeForwarderUpdatedEvent = (data: Uint8Array): ForwarderUpdated =>
  forwarderUpdatedCodec.decode(expectDiscriminator('event ForwarderUpdated', EVENT_FORWARDER_UPDATED_DISCRIMINATOR, data)) as ForwarderUpdated

export const EVENT_GLOBAL_PAUSE_TOGGLED_DISCRIMINATOR = new Uint8Array([98, 104, 111, 190, 104, 173, 74, 236])

/**
 * Decodes raw GlobalPauseToggled event data (with its 8-byte discriminator) into GlobalPauseToggled.
 */
export const decodeGlobalPauseToggledEvent = (data: Uint8Array): GlobalPauseToggled =>
  globalPauseToggledCodec.decode(expectDiscriminator('event GlobalPauseToggled', EVENT_GLOBAL_PAUSE_TOGGLED_DISCRIMINATOR, data)) as GlobalPauseToggled

export const EVENT_PT_REDEEMED_DISCRIMINATOR = new Uint8Array([211, 121, 97, 51, 47, 225, 196, 226])

/**
 * Decodes raw PtRedeemed event data (with its 8-byte discriminator) into PtRedeemed.
 */
export const decodePtRedeemedEvent = (data: Uint8Array): PtRedeemed =>
  ptRedeemedCodec.decode(expectDiscriminator('event PtRedeemed', EVENT_PT_REDEEMED_DISCRIMINATOR, data)) as PtRedeemed

export const EVENT_RECEIVED_FILL_REPORT_DISCRIMINATOR = new Uint8Array([33, 25, 166, 53, 204, 250, 100, 221])

/**
 * Decodes raw ReceivedFillReport event data (with its 8-byte discriminator) into ReceivedFillReport.
 */
export const decodeReceivedFillReportEvent = (data: Uint8Array): ReceivedFillReport =>
  receivedFillReportCodec.decode(expectDiscriminator('event ReceivedFillReport', EVENT_RECEIVED_FILL_REPORT_DISCRIMINATOR, data)) as ReceivedFillReport

export const EVENT_RECEIVED_RATE_REPORT_DISCRIMINATOR = new Uint8Array([144, 204, 54, 24, 180, 131, 122, 96])

/**
 * Decodes raw ReceivedRateReport event data (with its 8-byte discriminator) into ReceivedRateReport.
 */
export const decodeReceivedRateReportEvent = (data: Uint8Array): ReceivedRateReport =>
  receivedRateReportCodec.decode(expectDiscriminator('event ReceivedRateReport', EVENT_RECEIVED_RATE_REPORT_DISCRIMINATOR, data)) as ReceivedRateReport

export const EVENT_RECEIVED_SETTLE_REPORT_DISCRIMINATOR = new Uint8Array([166, 67, 123, 98, 54, 242, 171, 223])

/**
 * Decodes raw ReceivedSettleReport event data (with its 8-byte discriminator) into ReceivedSettleReport.
 */
export const decodeReceivedSettleReportEvent = (data: Uint8Array): ReceivedSettleReport =>
  receivedSettleReportCodec.decode(expectDiscriminator('event ReceivedSettleReport', EVENT_RECEIVED_SETTLE_REPORT_DISCRIMINATOR, data)) as ReceivedSettleReport

export const EVENT_SERIES_OPENED_DISCRIMINATOR = new Uint8Array([203, 170, 78, 184, 137, 221, 220, 207])

/**
 * Decodes raw SeriesOpened event data (with its 8-byte discriminator) into SeriesOpened.
 */
export const decodeSeriesOpenedEvent = (data: Uint8Array): SeriesOpened =>
  seriesOpenedCodec.decode(expectDiscriminator('event SeriesOpened', EVENT_SERIES_OPENED_DISCRIMINATOR, data)) as SeriesOpened

export const EVENT_SERIES_PAUSE_TOGGLED_DISCRIMINATOR = new Uint8Array([209, 58, 205, 83, 87, 114, 26, 192])

/**
 * Decodes raw SeriesPauseToggled event data (with its 8-byte discriminator) into SeriesPauseToggled.
 */
export const decodeSeriesPauseToggledEvent = (data: Uint8Array): SeriesPauseToggled =>
  seriesPauseToggledCodec.decode(expectDiscriminator('event SeriesPauseToggled', EVENT_SERIES_PAUSE_TOGGLED_DISCRIMINATOR, data)) as SeriesPauseToggled

export const EVENT_TOKENS_MERGED_DISCRIMINATOR = new Uint8Array([178, 179, 160, 81, 141, 143, 120, 66])

/**
 * Decodes raw TokensMerged event data (with its 8-byte discriminator) into TokensMerged.
 */
export const decodeTokensMergedEvent = (data: Uint8Array): TokensMerged =>
  tokensMergedCodec.decode(expectDiscriminator('event TokensMerged', EVENT_TOKENS_MERGED_DISCRIMINATOR, data)) as TokensMerged

export const EVENT_TOKENS_STRIPPED_DISCRIMINATOR = new Uint8Array([31, 89, 157, 156, 133, 187, 88, 16])

/**
 * Decodes raw TokensStripped event data (with its 8-byte discriminator) into TokensStripped.
 */
export const decodeTokensStrippedEvent = (data: Uint8Array): TokensStripped =>
  tokensStrippedCodec.decode(expectDiscriminator('event TokensStripped', EVENT_TOKENS_STRIPPED_DISCRIMINATOR, data)) as TokensStripped

export const EVENT_YT_CLAIMED_DISCRIMINATOR = new Uint8Array([34, 184, 60, 58, 11, 207, 243, 152])

/**
 * Decodes raw YtClaimed event data (with its 8-byte discriminator) into YtClaimed.
 */
export const decodeYtClaimedEvent = (data: Uint8Array): YtClaimed =>
  ytClaimedCodec.decode(expectDiscriminator('event YtClaimed', EVENT_YT_CLAIMED_DISCRIMINATOR, data)) as YtClaimed

export const parseAnyAccount = (data: Uint8Array): AllowEntry | Config | Escrow | FillReceipt | Registry | Series => {
  const disc = data.subarray(0, DISCRIMINATOR_SIZE)
  const matches = (expected: Uint8Array) => expected.every((b, i) => disc[i] === b)
  if (matches(ACCOUNT_ALLOW_ENTRY_DISCRIMINATOR)) return decodeAllowEntryAccount(data)
  if (matches(ACCOUNT_CONFIG_DISCRIMINATOR)) return decodeConfigAccount(data)
  if (matches(ACCOUNT_ESCROW_DISCRIMINATOR)) return decodeEscrowAccount(data)
  if (matches(ACCOUNT_FILL_RECEIPT_DISCRIMINATOR)) return decodeFillReceiptAccount(data)
  if (matches(ACCOUNT_REGISTRY_DISCRIMINATOR)) return decodeRegistryAccount(data)
  if (matches(ACCOUNT_SERIES_DISCRIMINATOR)) return decodeSeriesAccount(data)
  throw new Error(`unknown account discriminator: [${Array.from(disc).join(', ')}]`)
}

export const parseAnyEvent = (data: Uint8Array): AllowEntryRemoved | AllowEntrySet | AuthorityTransferAccepted | AuthorityTransferProposed | ConfigInitialized | EscrowLocked | EscrowWithdrawn | FillExecuted | ForwarderUpdated | GlobalPauseToggled | PtRedeemed | ReceivedFillReport | ReceivedRateReport | ReceivedSettleReport | SeriesOpened | SeriesPauseToggled | TokensMerged | TokensStripped | YtClaimed => {
  const disc = data.subarray(0, DISCRIMINATOR_SIZE)
  const matches = (expected: Uint8Array) => expected.every((b, i) => disc[i] === b)
  if (matches(EVENT_ALLOW_ENTRY_REMOVED_DISCRIMINATOR)) return decodeAllowEntryRemovedEvent(data)
  if (matches(EVENT_ALLOW_ENTRY_SET_DISCRIMINATOR)) return decodeAllowEntrySetEvent(data)
  if (matches(EVENT_AUTHORITY_TRANSFER_ACCEPTED_DISCRIMINATOR)) return decodeAuthorityTransferAcceptedEvent(data)
  if (matches(EVENT_AUTHORITY_TRANSFER_PROPOSED_DISCRIMINATOR)) return decodeAuthorityTransferProposedEvent(data)
  if (matches(EVENT_CONFIG_INITIALIZED_DISCRIMINATOR)) return decodeConfigInitializedEvent(data)
  if (matches(EVENT_ESCROW_LOCKED_DISCRIMINATOR)) return decodeEscrowLockedEvent(data)
  if (matches(EVENT_ESCROW_WITHDRAWN_DISCRIMINATOR)) return decodeEscrowWithdrawnEvent(data)
  if (matches(EVENT_FILL_EXECUTED_DISCRIMINATOR)) return decodeFillExecutedEvent(data)
  if (matches(EVENT_FORWARDER_UPDATED_DISCRIMINATOR)) return decodeForwarderUpdatedEvent(data)
  if (matches(EVENT_GLOBAL_PAUSE_TOGGLED_DISCRIMINATOR)) return decodeGlobalPauseToggledEvent(data)
  if (matches(EVENT_PT_REDEEMED_DISCRIMINATOR)) return decodePtRedeemedEvent(data)
  if (matches(EVENT_RECEIVED_FILL_REPORT_DISCRIMINATOR)) return decodeReceivedFillReportEvent(data)
  if (matches(EVENT_RECEIVED_RATE_REPORT_DISCRIMINATOR)) return decodeReceivedRateReportEvent(data)
  if (matches(EVENT_RECEIVED_SETTLE_REPORT_DISCRIMINATOR)) return decodeReceivedSettleReportEvent(data)
  if (matches(EVENT_SERIES_OPENED_DISCRIMINATOR)) return decodeSeriesOpenedEvent(data)
  if (matches(EVENT_SERIES_PAUSE_TOGGLED_DISCRIMINATOR)) return decodeSeriesPauseToggledEvent(data)
  if (matches(EVENT_TOKENS_MERGED_DISCRIMINATOR)) return decodeTokensMergedEvent(data)
  if (matches(EVENT_TOKENS_STRIPPED_DISCRIMINATOR)) return decodeTokensStrippedEvent(data)
  if (matches(EVENT_YT_CLAIMED_DISCRIMINATOR)) return decodeYtClaimedEvent(data)
  throw new Error(`unknown event discriminator: [${Array.from(disc).join(', ')}]`)
}

/**
 * Optional filter values for AllowEntryRemoved log triggers. Set fields in one row to
 * AND those predicates. Multiple rows are OR alternatives, but current trigger
 * configuration supports only a single row. Leave unset for wildcard. Only top-level
 * scalar fields with supported subkey encodings are auto-filterable — nested
 * structs, vecs, arrays, bool, u128, and i128 need a manual SubkeyConfig.
 */
export type AllowEntryRemovedFilters = {
  wallet?: Address | null
}

export const encodeAllowEntryRemovedSubkeys = (filters: AllowEntryRemovedFilters[]): SolanaSubkeyConfigJson[] => {
  if (filters.length > 1) {
    throw new Error('multiple filter rows are not supported for AllowEntryRemoved; provide a single filter row')
  }
  const walletComparers: SolanaValueComparatorJson[] = []
  for (const f of filters) {
    if (f.wallet != null) {
      walletComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.wallet)),
      })
    }
  }
  const subkeys: SolanaSubkeyConfigJson[] = []
  if (walletComparers.length > 0) {
    subkeys.push({ path: ['Wallet'], comparers: walletComparers })
  }
  return subkeys
}

/**
 * Optional filter values for AllowEntrySet log triggers. Set fields in one row to
 * AND those predicates. Multiple rows are OR alternatives, but current trigger
 * configuration supports only a single row. Leave unset for wildcard. Only top-level
 * scalar fields with supported subkey encodings are auto-filterable — nested
 * structs, vecs, arrays, bool, u128, and i128 need a manual SubkeyConfig.
 */
export type AllowEntrySetFilters = {
  wallet?: Address | null
  roles?: number | null
  expiryTs?: bigint | null
}

export const encodeAllowEntrySetSubkeys = (filters: AllowEntrySetFilters[]): SolanaSubkeyConfigJson[] => {
  if (filters.length > 1) {
    throw new Error('multiple filter rows are not supported for AllowEntrySet; provide a single filter row')
  }
  const walletComparers: SolanaValueComparatorJson[] = []
  const rolesComparers: SolanaValueComparatorJson[] = []
  const expiryTsComparers: SolanaValueComparatorJson[] = []
  for (const f of filters) {
    if (f.wallet != null) {
      walletComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.wallet)),
      })
    }
    if (f.roles != null) {
      rolesComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(prepareSubkeyValue(f.roles)),
      })
    }
    if (f.expiryTs != null) {
      expiryTsComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(prepareSubkeyValue(f.expiryTs)),
      })
    }
  }
  const subkeys: SolanaSubkeyConfigJson[] = []
  if (walletComparers.length > 0) {
    subkeys.push({ path: ['Wallet'], comparers: walletComparers })
  }
  if (rolesComparers.length > 0) {
    subkeys.push({ path: ['Roles'], comparers: rolesComparers })
  }
  if (expiryTsComparers.length > 0) {
    subkeys.push({ path: ['ExpiryTs'], comparers: expiryTsComparers })
  }
  return subkeys
}

/**
 * Optional filter values for AuthorityTransferAccepted log triggers. Set fields in one row to
 * AND those predicates. Multiple rows are OR alternatives, but current trigger
 * configuration supports only a single row. Leave unset for wildcard. Only top-level
 * scalar fields with supported subkey encodings are auto-filterable — nested
 * structs, vecs, arrays, bool, u128, and i128 need a manual SubkeyConfig.
 */
export type AuthorityTransferAcceptedFilters = {
  oldAuthority?: Address | null
  newAuthority?: Address | null
}

export const encodeAuthorityTransferAcceptedSubkeys = (filters: AuthorityTransferAcceptedFilters[]): SolanaSubkeyConfigJson[] => {
  if (filters.length > 1) {
    throw new Error('multiple filter rows are not supported for AuthorityTransferAccepted; provide a single filter row')
  }
  const oldAuthorityComparers: SolanaValueComparatorJson[] = []
  const newAuthorityComparers: SolanaValueComparatorJson[] = []
  for (const f of filters) {
    if (f.oldAuthority != null) {
      oldAuthorityComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.oldAuthority)),
      })
    }
    if (f.newAuthority != null) {
      newAuthorityComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.newAuthority)),
      })
    }
  }
  const subkeys: SolanaSubkeyConfigJson[] = []
  if (oldAuthorityComparers.length > 0) {
    subkeys.push({ path: ['OldAuthority'], comparers: oldAuthorityComparers })
  }
  if (newAuthorityComparers.length > 0) {
    subkeys.push({ path: ['NewAuthority'], comparers: newAuthorityComparers })
  }
  return subkeys
}

/**
 * Optional filter values for AuthorityTransferProposed log triggers. Set fields in one row to
 * AND those predicates. Multiple rows are OR alternatives, but current trigger
 * configuration supports only a single row. Leave unset for wildcard. Only top-level
 * scalar fields with supported subkey encodings are auto-filterable — nested
 * structs, vecs, arrays, bool, u128, and i128 need a manual SubkeyConfig.
 */
export type AuthorityTransferProposedFilters = {
  currentAuthority?: Address | null
  pendingAuthority?: Address | null
}

export const encodeAuthorityTransferProposedSubkeys = (filters: AuthorityTransferProposedFilters[]): SolanaSubkeyConfigJson[] => {
  if (filters.length > 1) {
    throw new Error('multiple filter rows are not supported for AuthorityTransferProposed; provide a single filter row')
  }
  const currentAuthorityComparers: SolanaValueComparatorJson[] = []
  const pendingAuthorityComparers: SolanaValueComparatorJson[] = []
  for (const f of filters) {
    if (f.currentAuthority != null) {
      currentAuthorityComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.currentAuthority)),
      })
    }
    if (f.pendingAuthority != null) {
      pendingAuthorityComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.pendingAuthority)),
      })
    }
  }
  const subkeys: SolanaSubkeyConfigJson[] = []
  if (currentAuthorityComparers.length > 0) {
    subkeys.push({ path: ['CurrentAuthority'], comparers: currentAuthorityComparers })
  }
  if (pendingAuthorityComparers.length > 0) {
    subkeys.push({ path: ['PendingAuthority'], comparers: pendingAuthorityComparers })
  }
  return subkeys
}

/**
 * Optional filter values for ConfigInitialized log triggers. Set fields in one row to
 * AND those predicates. Multiple rows are OR alternatives, but current trigger
 * configuration supports only a single row. Leave unset for wildcard. Only top-level
 * scalar fields with supported subkey encodings are auto-filterable — nested
 * structs, vecs, arrays, bool, u128, and i128 need a manual SubkeyConfig.
 */
export type ConfigInitializedFilters = {
  authority?: Address | null
  clusterMode?: number | null
}

export const encodeConfigInitializedSubkeys = (filters: ConfigInitializedFilters[]): SolanaSubkeyConfigJson[] => {
  if (filters.length > 1) {
    throw new Error('multiple filter rows are not supported for ConfigInitialized; provide a single filter row')
  }
  const authorityComparers: SolanaValueComparatorJson[] = []
  const clusterModeComparers: SolanaValueComparatorJson[] = []
  for (const f of filters) {
    if (f.authority != null) {
      authorityComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.authority)),
      })
    }
    if (f.clusterMode != null) {
      clusterModeComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(prepareSubkeyValue(f.clusterMode)),
      })
    }
  }
  const subkeys: SolanaSubkeyConfigJson[] = []
  if (authorityComparers.length > 0) {
    subkeys.push({ path: ['Authority'], comparers: authorityComparers })
  }
  if (clusterModeComparers.length > 0) {
    subkeys.push({ path: ['ClusterMode'], comparers: clusterModeComparers })
  }
  return subkeys
}

/**
 * Optional filter values for EscrowLocked log triggers. Set fields in one row to
 * AND those predicates. Multiple rows are OR alternatives, but current trigger
 * configuration supports only a single row. Leave unset for wildcard. Only top-level
 * scalar fields with supported subkey encodings are auto-filterable — nested
 * structs, vecs, arrays, bool, u128, and i128 need a manual SubkeyConfig.
 */
export type EscrowLockedFilters = {
  series?: Address | null
  owner?: Address | null
  mint?: Address | null
  amount?: bigint | null
  lockUntil?: bigint | null
}

export const encodeEscrowLockedSubkeys = (filters: EscrowLockedFilters[]): SolanaSubkeyConfigJson[] => {
  if (filters.length > 1) {
    throw new Error('multiple filter rows are not supported for EscrowLocked; provide a single filter row')
  }
  const seriesComparers: SolanaValueComparatorJson[] = []
  const ownerComparers: SolanaValueComparatorJson[] = []
  const mintComparers: SolanaValueComparatorJson[] = []
  const amountComparers: SolanaValueComparatorJson[] = []
  const lockUntilComparers: SolanaValueComparatorJson[] = []
  for (const f of filters) {
    if (f.series != null) {
      seriesComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.series)),
      })
    }
    if (f.owner != null) {
      ownerComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.owner)),
      })
    }
    if (f.mint != null) {
      mintComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.mint)),
      })
    }
    if (f.amount != null) {
      amountComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(prepareSubkeyValue(f.amount)),
      })
    }
    if (f.lockUntil != null) {
      lockUntilComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(prepareSubkeyValue(f.lockUntil)),
      })
    }
  }
  const subkeys: SolanaSubkeyConfigJson[] = []
  if (seriesComparers.length > 0) {
    subkeys.push({ path: ['Series'], comparers: seriesComparers })
  }
  if (ownerComparers.length > 0) {
    subkeys.push({ path: ['Owner'], comparers: ownerComparers })
  }
  if (mintComparers.length > 0) {
    subkeys.push({ path: ['Mint'], comparers: mintComparers })
  }
  if (amountComparers.length > 0) {
    subkeys.push({ path: ['Amount'], comparers: amountComparers })
  }
  if (lockUntilComparers.length > 0) {
    subkeys.push({ path: ['LockUntil'], comparers: lockUntilComparers })
  }
  return subkeys
}

/**
 * Optional filter values for EscrowWithdrawn log triggers. Set fields in one row to
 * AND those predicates. Multiple rows are OR alternatives, but current trigger
 * configuration supports only a single row. Leave unset for wildcard. Only top-level
 * scalar fields with supported subkey encodings are auto-filterable — nested
 * structs, vecs, arrays, bool, u128, and i128 need a manual SubkeyConfig.
 */
export type EscrowWithdrawnFilters = {
  series?: Address | null
  owner?: Address | null
  mint?: Address | null
  amount?: bigint | null
}

export const encodeEscrowWithdrawnSubkeys = (filters: EscrowWithdrawnFilters[]): SolanaSubkeyConfigJson[] => {
  if (filters.length > 1) {
    throw new Error('multiple filter rows are not supported for EscrowWithdrawn; provide a single filter row')
  }
  const seriesComparers: SolanaValueComparatorJson[] = []
  const ownerComparers: SolanaValueComparatorJson[] = []
  const mintComparers: SolanaValueComparatorJson[] = []
  const amountComparers: SolanaValueComparatorJson[] = []
  for (const f of filters) {
    if (f.series != null) {
      seriesComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.series)),
      })
    }
    if (f.owner != null) {
      ownerComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.owner)),
      })
    }
    if (f.mint != null) {
      mintComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.mint)),
      })
    }
    if (f.amount != null) {
      amountComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(prepareSubkeyValue(f.amount)),
      })
    }
  }
  const subkeys: SolanaSubkeyConfigJson[] = []
  if (seriesComparers.length > 0) {
    subkeys.push({ path: ['Series'], comparers: seriesComparers })
  }
  if (ownerComparers.length > 0) {
    subkeys.push({ path: ['Owner'], comparers: ownerComparers })
  }
  if (mintComparers.length > 0) {
    subkeys.push({ path: ['Mint'], comparers: mintComparers })
  }
  if (amountComparers.length > 0) {
    subkeys.push({ path: ['Amount'], comparers: amountComparers })
  }
  return subkeys
}

/**
 * Optional filter values for FillExecuted log triggers. Set fields in one row to
 * AND those predicates. Multiple rows are OR alternatives, but current trigger
 * configuration supports only a single row. Leave unset for wildcard. Only top-level
 * scalar fields with supported subkey encodings are auto-filterable — nested
 * structs, vecs, arrays, bool, u128, and i128 need a manual SubkeyConfig.
 */
export type FillExecutedFilters = {
  series?: Address | null
  requester?: Address | null
  dealer?: Address | null
  assetAmount?: bigint | null
  quoteAmount?: bigint | null
}

export const encodeFillExecutedSubkeys = (filters: FillExecutedFilters[]): SolanaSubkeyConfigJson[] => {
  if (filters.length > 1) {
    throw new Error('multiple filter rows are not supported for FillExecuted; provide a single filter row')
  }
  const seriesComparers: SolanaValueComparatorJson[] = []
  const requesterComparers: SolanaValueComparatorJson[] = []
  const dealerComparers: SolanaValueComparatorJson[] = []
  const assetAmountComparers: SolanaValueComparatorJson[] = []
  const quoteAmountComparers: SolanaValueComparatorJson[] = []
  for (const f of filters) {
    if (f.series != null) {
      seriesComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.series)),
      })
    }
    if (f.requester != null) {
      requesterComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.requester)),
      })
    }
    if (f.dealer != null) {
      dealerComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.dealer)),
      })
    }
    if (f.assetAmount != null) {
      assetAmountComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(prepareSubkeyValue(f.assetAmount)),
      })
    }
    if (f.quoteAmount != null) {
      quoteAmountComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(prepareSubkeyValue(f.quoteAmount)),
      })
    }
  }
  const subkeys: SolanaSubkeyConfigJson[] = []
  if (seriesComparers.length > 0) {
    subkeys.push({ path: ['Series'], comparers: seriesComparers })
  }
  if (requesterComparers.length > 0) {
    subkeys.push({ path: ['Requester'], comparers: requesterComparers })
  }
  if (dealerComparers.length > 0) {
    subkeys.push({ path: ['Dealer'], comparers: dealerComparers })
  }
  if (assetAmountComparers.length > 0) {
    subkeys.push({ path: ['AssetAmount'], comparers: assetAmountComparers })
  }
  if (quoteAmountComparers.length > 0) {
    subkeys.push({ path: ['QuoteAmount'], comparers: quoteAmountComparers })
  }
  return subkeys
}

/**
 * Optional filter values for ForwarderUpdated log triggers. Set fields in one row to
 * AND those predicates. Multiple rows are OR alternatives, but current trigger
 * configuration supports only a single row. Leave unset for wildcard. Only top-level
 * scalar fields with supported subkey encodings are auto-filterable — nested
 * structs, vecs, arrays, bool, u128, and i128 need a manual SubkeyConfig.
 */
export type ForwarderUpdatedFilters = {
  index?: number | null
  program?: Address | null
  state?: Address | null
}

export const encodeForwarderUpdatedSubkeys = (filters: ForwarderUpdatedFilters[]): SolanaSubkeyConfigJson[] => {
  if (filters.length > 1) {
    throw new Error('multiple filter rows are not supported for ForwarderUpdated; provide a single filter row')
  }
  const indexComparers: SolanaValueComparatorJson[] = []
  const programComparers: SolanaValueComparatorJson[] = []
  const stateComparers: SolanaValueComparatorJson[] = []
  for (const f of filters) {
    if (f.index != null) {
      indexComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(prepareSubkeyValue(f.index)),
      })
    }
    if (f.program != null) {
      programComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.program)),
      })
    }
    if (f.state != null) {
      stateComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.state)),
      })
    }
  }
  const subkeys: SolanaSubkeyConfigJson[] = []
  if (indexComparers.length > 0) {
    subkeys.push({ path: ['Index'], comparers: indexComparers })
  }
  if (programComparers.length > 0) {
    subkeys.push({ path: ['Program'], comparers: programComparers })
  }
  if (stateComparers.length > 0) {
    subkeys.push({ path: ['State'], comparers: stateComparers })
  }
  return subkeys
}

/**
 * Optional filter values for GlobalPauseToggled log triggers. Set fields in one row to
 * AND those predicates. Multiple rows are OR alternatives, but current trigger
 * configuration supports only a single row. Leave unset for wildcard. Only top-level
 * scalar fields with supported subkey encodings are auto-filterable — nested
 * structs, vecs, arrays, bool, u128, and i128 need a manual SubkeyConfig.
 */
export type GlobalPauseToggledFilters = Record<string, never>

export const encodeGlobalPauseToggledSubkeys = (filters: GlobalPauseToggledFilters[]): SolanaSubkeyConfigJson[] => {
  if (filters.length > 1) {
    throw new Error('multiple filter rows are not supported for GlobalPauseToggled; provide a single filter row')
  }
  return []
}

/**
 * Optional filter values for PtRedeemed log triggers. Set fields in one row to
 * AND those predicates. Multiple rows are OR alternatives, but current trigger
 * configuration supports only a single row. Leave unset for wildcard. Only top-level
 * scalar fields with supported subkey encodings are auto-filterable — nested
 * structs, vecs, arrays, bool, u128, and i128 need a manual SubkeyConfig.
 */
export type PtRedeemedFilters = {
  series?: Address | null
  user?: Address | null
  ptAmount?: bigint | null
  rawCollateralReceived?: bigint | null
}

export const encodePtRedeemedSubkeys = (filters: PtRedeemedFilters[]): SolanaSubkeyConfigJson[] => {
  if (filters.length > 1) {
    throw new Error('multiple filter rows are not supported for PtRedeemed; provide a single filter row')
  }
  const seriesComparers: SolanaValueComparatorJson[] = []
  const userComparers: SolanaValueComparatorJson[] = []
  const ptAmountComparers: SolanaValueComparatorJson[] = []
  const rawCollateralReceivedComparers: SolanaValueComparatorJson[] = []
  for (const f of filters) {
    if (f.series != null) {
      seriesComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.series)),
      })
    }
    if (f.user != null) {
      userComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.user)),
      })
    }
    if (f.ptAmount != null) {
      ptAmountComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(prepareSubkeyValue(f.ptAmount)),
      })
    }
    if (f.rawCollateralReceived != null) {
      rawCollateralReceivedComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(prepareSubkeyValue(f.rawCollateralReceived)),
      })
    }
  }
  const subkeys: SolanaSubkeyConfigJson[] = []
  if (seriesComparers.length > 0) {
    subkeys.push({ path: ['Series'], comparers: seriesComparers })
  }
  if (userComparers.length > 0) {
    subkeys.push({ path: ['User'], comparers: userComparers })
  }
  if (ptAmountComparers.length > 0) {
    subkeys.push({ path: ['PtAmount'], comparers: ptAmountComparers })
  }
  if (rawCollateralReceivedComparers.length > 0) {
    subkeys.push({ path: ['RawCollateralReceived'], comparers: rawCollateralReceivedComparers })
  }
  return subkeys
}

/**
 * Optional filter values for ReceivedFillReport log triggers. Set fields in one row to
 * AND those predicates. Multiple rows are OR alternatives, but current trigger
 * configuration supports only a single row. Leave unset for wildcard. Only top-level
 * scalar fields with supported subkey encodings are auto-filterable — nested
 * structs, vecs, arrays, bool, u128, and i128 need a manual SubkeyConfig.
 */
export type ReceivedFillReportFilters = Record<string, never>

export const encodeReceivedFillReportSubkeys = (filters: ReceivedFillReportFilters[]): SolanaSubkeyConfigJson[] => {
  if (filters.length > 1) {
    throw new Error('multiple filter rows are not supported for ReceivedFillReport; provide a single filter row')
  }
  return []
}

/**
 * Optional filter values for ReceivedRateReport log triggers. Set fields in one row to
 * AND those predicates. Multiple rows are OR alternatives, but current trigger
 * configuration supports only a single row. Leave unset for wildcard. Only top-level
 * scalar fields with supported subkey encodings are auto-filterable — nested
 * structs, vecs, arrays, bool, u128, and i128 need a manual SubkeyConfig.
 */
export type ReceivedRateReportFilters = Record<string, never>

export const encodeReceivedRateReportSubkeys = (filters: ReceivedRateReportFilters[]): SolanaSubkeyConfigJson[] => {
  if (filters.length > 1) {
    throw new Error('multiple filter rows are not supported for ReceivedRateReport; provide a single filter row')
  }
  return []
}

/**
 * Optional filter values for ReceivedSettleReport log triggers. Set fields in one row to
 * AND those predicates. Multiple rows are OR alternatives, but current trigger
 * configuration supports only a single row. Leave unset for wildcard. Only top-level
 * scalar fields with supported subkey encodings are auto-filterable — nested
 * structs, vecs, arrays, bool, u128, and i128 need a manual SubkeyConfig.
 */
export type ReceivedSettleReportFilters = {
  series?: Address | null
}

export const encodeReceivedSettleReportSubkeys = (filters: ReceivedSettleReportFilters[]): SolanaSubkeyConfigJson[] => {
  if (filters.length > 1) {
    throw new Error('multiple filter rows are not supported for ReceivedSettleReport; provide a single filter row')
  }
  const seriesComparers: SolanaValueComparatorJson[] = []
  for (const f of filters) {
    if (f.series != null) {
      seriesComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.series)),
      })
    }
  }
  const subkeys: SolanaSubkeyConfigJson[] = []
  if (seriesComparers.length > 0) {
    subkeys.push({ path: ['Series'], comparers: seriesComparers })
  }
  return subkeys
}

/**
 * Optional filter values for SeriesOpened log triggers. Set fields in one row to
 * AND those predicates. Multiple rows are OR alternatives, but current trigger
 * configuration supports only a single row. Leave unset for wildcard. Only top-level
 * scalar fields with supported subkey encodings are auto-filterable — nested
 * structs, vecs, arrays, bool, u128, and i128 need a manual SubkeyConfig.
 */
export type SeriesOpenedFilters = {
  series?: Address | null
  collateralMint?: Address | null
  quoteMint?: Address | null
  ptMint?: Address | null
  ytMint?: Address | null
  openTs?: bigint | null
  maturityTs?: bigint | null
}

export const encodeSeriesOpenedSubkeys = (filters: SeriesOpenedFilters[]): SolanaSubkeyConfigJson[] => {
  if (filters.length > 1) {
    throw new Error('multiple filter rows are not supported for SeriesOpened; provide a single filter row')
  }
  const seriesComparers: SolanaValueComparatorJson[] = []
  const collateralMintComparers: SolanaValueComparatorJson[] = []
  const quoteMintComparers: SolanaValueComparatorJson[] = []
  const ptMintComparers: SolanaValueComparatorJson[] = []
  const ytMintComparers: SolanaValueComparatorJson[] = []
  const openTsComparers: SolanaValueComparatorJson[] = []
  const maturityTsComparers: SolanaValueComparatorJson[] = []
  for (const f of filters) {
    if (f.series != null) {
      seriesComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.series)),
      })
    }
    if (f.collateralMint != null) {
      collateralMintComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.collateralMint)),
      })
    }
    if (f.quoteMint != null) {
      quoteMintComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.quoteMint)),
      })
    }
    if (f.ptMint != null) {
      ptMintComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.ptMint)),
      })
    }
    if (f.ytMint != null) {
      ytMintComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.ytMint)),
      })
    }
    if (f.openTs != null) {
      openTsComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(prepareSubkeyValue(f.openTs)),
      })
    }
    if (f.maturityTs != null) {
      maturityTsComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(prepareSubkeyValue(f.maturityTs)),
      })
    }
  }
  const subkeys: SolanaSubkeyConfigJson[] = []
  if (seriesComparers.length > 0) {
    subkeys.push({ path: ['Series'], comparers: seriesComparers })
  }
  if (collateralMintComparers.length > 0) {
    subkeys.push({ path: ['CollateralMint'], comparers: collateralMintComparers })
  }
  if (quoteMintComparers.length > 0) {
    subkeys.push({ path: ['QuoteMint'], comparers: quoteMintComparers })
  }
  if (ptMintComparers.length > 0) {
    subkeys.push({ path: ['PtMint'], comparers: ptMintComparers })
  }
  if (ytMintComparers.length > 0) {
    subkeys.push({ path: ['YtMint'], comparers: ytMintComparers })
  }
  if (openTsComparers.length > 0) {
    subkeys.push({ path: ['OpenTs'], comparers: openTsComparers })
  }
  if (maturityTsComparers.length > 0) {
    subkeys.push({ path: ['MaturityTs'], comparers: maturityTsComparers })
  }
  return subkeys
}

/**
 * Optional filter values for SeriesPauseToggled log triggers. Set fields in one row to
 * AND those predicates. Multiple rows are OR alternatives, but current trigger
 * configuration supports only a single row. Leave unset for wildcard. Only top-level
 * scalar fields with supported subkey encodings are auto-filterable — nested
 * structs, vecs, arrays, bool, u128, and i128 need a manual SubkeyConfig.
 */
export type SeriesPauseToggledFilters = {
  series?: Address | null
}

export const encodeSeriesPauseToggledSubkeys = (filters: SeriesPauseToggledFilters[]): SolanaSubkeyConfigJson[] => {
  if (filters.length > 1) {
    throw new Error('multiple filter rows are not supported for SeriesPauseToggled; provide a single filter row')
  }
  const seriesComparers: SolanaValueComparatorJson[] = []
  for (const f of filters) {
    if (f.series != null) {
      seriesComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.series)),
      })
    }
  }
  const subkeys: SolanaSubkeyConfigJson[] = []
  if (seriesComparers.length > 0) {
    subkeys.push({ path: ['Series'], comparers: seriesComparers })
  }
  return subkeys
}

/**
 * Optional filter values for TokensMerged log triggers. Set fields in one row to
 * AND those predicates. Multiple rows are OR alternatives, but current trigger
 * configuration supports only a single row. Leave unset for wildcard. Only top-level
 * scalar fields with supported subkey encodings are auto-filterable — nested
 * structs, vecs, arrays, bool, u128, and i128 need a manual SubkeyConfig.
 */
export type TokensMergedFilters = {
  series?: Address | null
  user?: Address | null
  amount?: bigint | null
}

export const encodeTokensMergedSubkeys = (filters: TokensMergedFilters[]): SolanaSubkeyConfigJson[] => {
  if (filters.length > 1) {
    throw new Error('multiple filter rows are not supported for TokensMerged; provide a single filter row')
  }
  const seriesComparers: SolanaValueComparatorJson[] = []
  const userComparers: SolanaValueComparatorJson[] = []
  const amountComparers: SolanaValueComparatorJson[] = []
  for (const f of filters) {
    if (f.series != null) {
      seriesComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.series)),
      })
    }
    if (f.user != null) {
      userComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.user)),
      })
    }
    if (f.amount != null) {
      amountComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(prepareSubkeyValue(f.amount)),
      })
    }
  }
  const subkeys: SolanaSubkeyConfigJson[] = []
  if (seriesComparers.length > 0) {
    subkeys.push({ path: ['Series'], comparers: seriesComparers })
  }
  if (userComparers.length > 0) {
    subkeys.push({ path: ['User'], comparers: userComparers })
  }
  if (amountComparers.length > 0) {
    subkeys.push({ path: ['Amount'], comparers: amountComparers })
  }
  return subkeys
}

/**
 * Optional filter values for TokensStripped log triggers. Set fields in one row to
 * AND those predicates. Multiple rows are OR alternatives, but current trigger
 * configuration supports only a single row. Leave unset for wildcard. Only top-level
 * scalar fields with supported subkey encodings are auto-filterable — nested
 * structs, vecs, arrays, bool, u128, and i128 need a manual SubkeyConfig.
 */
export type TokensStrippedFilters = {
  series?: Address | null
  user?: Address | null
  amount?: bigint | null
}

export const encodeTokensStrippedSubkeys = (filters: TokensStrippedFilters[]): SolanaSubkeyConfigJson[] => {
  if (filters.length > 1) {
    throw new Error('multiple filter rows are not supported for TokensStripped; provide a single filter row')
  }
  const seriesComparers: SolanaValueComparatorJson[] = []
  const userComparers: SolanaValueComparatorJson[] = []
  const amountComparers: SolanaValueComparatorJson[] = []
  for (const f of filters) {
    if (f.series != null) {
      seriesComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.series)),
      })
    }
    if (f.user != null) {
      userComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.user)),
      })
    }
    if (f.amount != null) {
      amountComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(prepareSubkeyValue(f.amount)),
      })
    }
  }
  const subkeys: SolanaSubkeyConfigJson[] = []
  if (seriesComparers.length > 0) {
    subkeys.push({ path: ['Series'], comparers: seriesComparers })
  }
  if (userComparers.length > 0) {
    subkeys.push({ path: ['User'], comparers: userComparers })
  }
  if (amountComparers.length > 0) {
    subkeys.push({ path: ['Amount'], comparers: amountComparers })
  }
  return subkeys
}

/**
 * Optional filter values for YtClaimed log triggers. Set fields in one row to
 * AND those predicates. Multiple rows are OR alternatives, but current trigger
 * configuration supports only a single row. Leave unset for wildcard. Only top-level
 * scalar fields with supported subkey encodings are auto-filterable — nested
 * structs, vecs, arrays, bool, u128, and i128 need a manual SubkeyConfig.
 */
export type YtClaimedFilters = {
  series?: Address | null
  user?: Address | null
  ytAmount?: bigint | null
  rawCollateralReceived?: bigint | null
}

export const encodeYtClaimedSubkeys = (filters: YtClaimedFilters[]): SolanaSubkeyConfigJson[] => {
  if (filters.length > 1) {
    throw new Error('multiple filter rows are not supported for YtClaimed; provide a single filter row')
  }
  const seriesComparers: SolanaValueComparatorJson[] = []
  const userComparers: SolanaValueComparatorJson[] = []
  const ytAmountComparers: SolanaValueComparatorJson[] = []
  const rawCollateralReceivedComparers: SolanaValueComparatorJson[] = []
  for (const f of filters) {
    if (f.series != null) {
      seriesComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.series)),
      })
    }
    if (f.user != null) {
      userComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(solanaAddressToBytes(f.user)),
      })
    }
    if (f.ytAmount != null) {
      ytAmountComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(prepareSubkeyValue(f.ytAmount)),
      })
    }
    if (f.rawCollateralReceived != null) {
      rawCollateralReceivedComparers.push({
        operator: 'COMPARISON_OPERATOR_EQ',
        value: bytesToBase64(prepareSubkeyValue(f.rawCollateralReceived)),
      })
    }
  }
  const subkeys: SolanaSubkeyConfigJson[] = []
  if (seriesComparers.length > 0) {
    subkeys.push({ path: ['Series'], comparers: seriesComparers })
  }
  if (userComparers.length > 0) {
    subkeys.push({ path: ['User'], comparers: userComparers })
  }
  if (ytAmountComparers.length > 0) {
    subkeys.push({ path: ['YtAmount'], comparers: ytAmountComparers })
  }
  if (rawCollateralReceivedComparers.length > 0) {
    subkeys.push({ path: ['RawCollateralReceived'], comparers: rawCollateralReceivedComparers })
  }
  return subkeys
}

export class Kalend {
  readonly programId: Uint8Array

  // The program ID is baked into the IDL, so it defaults to the generated
  // const — unlike EVM bindings where the address is a runtime value.
  constructor(
    private readonly client: SolanaClient,
    programId: string | Uint8Array = KALEND_PROGRAM_ID,
  ) {
    this.programId = typeof programId === 'string' ? solanaAddressToBytes(programId) : programId
  }

  /**
   * Publishes a pre-encoded Borsh payload through the CRE signer to this
   * program's on_report entrypoint via the keystone-forwarder.
   *
   * remainingAccounts must follow the keystone-forwarder account layout:
   *   - Index 0: forwarderState – the forwarder program's state account.
   *   - Index 1: forwarderAuthority – PDA derived from seeds
   *     ["forwarder", forwarderState, receiverProgram] under the forwarder program ID.
   *   - Index 2+: receiver-specific accounts required by the target program.
   *
   * The full account list is hashed (via calculateAccountsHash) into the report.
   * The on-chain forwarder strips indices 0 and 1 before CPI-ing into the
   * receiver, so they must be present and correctly ordered.
   */
  writeReport(
    runtime: Runtime<unknown>,
    payload: Uint8Array,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    const report = runtime
      .report(
        prepareSolanaReportRequest(
          encodeForwarderReport({
            accountHash: calculateAccountsHash(remainingAccounts),
            payload,
          }),
        ),
      )
      .result()

    return this.client
      .writeReport(runtime, {
        remainingAccounts: solanaAccountMetasToJson(remainingAccounts),
        receiver: bytesToHex(this.programId),
        computeConfig,
        report,
      })
      .result()
  }

  /**
   * Publishes a Borsh Vec of pre-encoded element payloads (mirrors Go's
   * WriteReportFromBorshEncodedVec). Each element must already be fully
   * serialized for one Vec item on the wire.
   */
  writeReportFromBorshEncodedVec(
    runtime: Runtime<unknown>,
    elementPayloads: Uint8Array[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, encodeBorshVecU32(elementPayloads), remainingAccounts, computeConfig)
  }

  writeReportFromAllowEntry(
    runtime: Runtime<unknown>,
    input: AllowEntry,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(allowEntryCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromAllowEntrys(
    runtime: Runtime<unknown>,
    inputs: AllowEntry[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(allowEntryCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromAllowEntryRemoved(
    runtime: Runtime<unknown>,
    input: AllowEntryRemoved,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(allowEntryRemovedCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromAllowEntryRemoveds(
    runtime: Runtime<unknown>,
    inputs: AllowEntryRemoved[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(allowEntryRemovedCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromAllowEntrySet(
    runtime: Runtime<unknown>,
    input: AllowEntrySet,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(allowEntrySetCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromAllowEntrySets(
    runtime: Runtime<unknown>,
    inputs: AllowEntrySet[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(allowEntrySetCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromAuthorityTransferAccepted(
    runtime: Runtime<unknown>,
    input: AuthorityTransferAccepted,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(authorityTransferAcceptedCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromAuthorityTransferAccepteds(
    runtime: Runtime<unknown>,
    inputs: AuthorityTransferAccepted[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(authorityTransferAcceptedCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromAuthorityTransferProposed(
    runtime: Runtime<unknown>,
    input: AuthorityTransferProposed,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(authorityTransferProposedCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromAuthorityTransferProposeds(
    runtime: Runtime<unknown>,
    inputs: AuthorityTransferProposed[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(authorityTransferProposedCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromForwarderEntry(
    runtime: Runtime<unknown>,
    input: ForwarderEntry,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(forwarderEntryCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromForwarderEntrys(
    runtime: Runtime<unknown>,
    inputs: ForwarderEntry[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(forwarderEntryCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromConfig(
    runtime: Runtime<unknown>,
    input: Config,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(configCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromConfigs(
    runtime: Runtime<unknown>,
    inputs: Config[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(configCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromConfigInitialized(
    runtime: Runtime<unknown>,
    input: ConfigInitialized,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(configInitializedCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromConfigInitializeds(
    runtime: Runtime<unknown>,
    inputs: ConfigInitialized[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(configInitializedCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromEscrow(
    runtime: Runtime<unknown>,
    input: Escrow,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(escrowCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromEscrows(
    runtime: Runtime<unknown>,
    inputs: Escrow[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(escrowCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromEscrowLocked(
    runtime: Runtime<unknown>,
    input: EscrowLocked,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(escrowLockedCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromEscrowLockeds(
    runtime: Runtime<unknown>,
    inputs: EscrowLocked[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(escrowLockedCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromEscrowWithdrawn(
    runtime: Runtime<unknown>,
    input: EscrowWithdrawn,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(escrowWithdrawnCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromEscrowWithdrawns(
    runtime: Runtime<unknown>,
    inputs: EscrowWithdrawn[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(escrowWithdrawnCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromFillExecuted(
    runtime: Runtime<unknown>,
    input: FillExecuted,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(fillExecutedCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromFillExecuteds(
    runtime: Runtime<unknown>,
    inputs: FillExecuted[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(fillExecutedCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromFillReceipt(
    runtime: Runtime<unknown>,
    input: FillReceipt,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(fillReceiptCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromFillReceipts(
    runtime: Runtime<unknown>,
    inputs: FillReceipt[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(fillReceiptCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromFillReport(
    runtime: Runtime<unknown>,
    input: FillReport,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(fillReportCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromFillReports(
    runtime: Runtime<unknown>,
    inputs: FillReport[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(fillReportCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromForwarderUpdated(
    runtime: Runtime<unknown>,
    input: ForwarderUpdated,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(forwarderUpdatedCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromForwarderUpdateds(
    runtime: Runtime<unknown>,
    inputs: ForwarderUpdated[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(forwarderUpdatedCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromGlobalPauseToggled(
    runtime: Runtime<unknown>,
    input: GlobalPauseToggled,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(globalPauseToggledCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromGlobalPauseToggleds(
    runtime: Runtime<unknown>,
    inputs: GlobalPauseToggled[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(globalPauseToggledCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromPtRedeemed(
    runtime: Runtime<unknown>,
    input: PtRedeemed,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(ptRedeemedCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromPtRedeemeds(
    runtime: Runtime<unknown>,
    inputs: PtRedeemed[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(ptRedeemedCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromRateReport(
    runtime: Runtime<unknown>,
    input: RateReport,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(rateReportCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromRateReports(
    runtime: Runtime<unknown>,
    inputs: RateReport[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(rateReportCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromReceivedFillReport(
    runtime: Runtime<unknown>,
    input: ReceivedFillReport,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(receivedFillReportCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromReceivedFillReports(
    runtime: Runtime<unknown>,
    inputs: ReceivedFillReport[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(receivedFillReportCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromReceivedRateReport(
    runtime: Runtime<unknown>,
    input: ReceivedRateReport,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(receivedRateReportCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromReceivedRateReports(
    runtime: Runtime<unknown>,
    inputs: ReceivedRateReport[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(receivedRateReportCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromSettleReport(
    runtime: Runtime<unknown>,
    input: SettleReport,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(settleReportCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromSettleReports(
    runtime: Runtime<unknown>,
    inputs: SettleReport[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(settleReportCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromReceivedSettleReport(
    runtime: Runtime<unknown>,
    input: ReceivedSettleReport,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(receivedSettleReportCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromReceivedSettleReports(
    runtime: Runtime<unknown>,
    inputs: ReceivedSettleReport[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(receivedSettleReportCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromRegistry(
    runtime: Runtime<unknown>,
    input: Registry,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(registryCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromRegistrys(
    runtime: Runtime<unknown>,
    inputs: Registry[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(registryCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromSeries(
    runtime: Runtime<unknown>,
    input: Series,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(seriesCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromSeriess(
    runtime: Runtime<unknown>,
    inputs: Series[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(seriesCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromSeriesOpened(
    runtime: Runtime<unknown>,
    input: SeriesOpened,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(seriesOpenedCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromSeriesOpeneds(
    runtime: Runtime<unknown>,
    inputs: SeriesOpened[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(seriesOpenedCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromSeriesPauseToggled(
    runtime: Runtime<unknown>,
    input: SeriesPauseToggled,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(seriesPauseToggledCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromSeriesPauseToggleds(
    runtime: Runtime<unknown>,
    inputs: SeriesPauseToggled[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(seriesPauseToggledCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromTokensMerged(
    runtime: Runtime<unknown>,
    input: TokensMerged,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(tokensMergedCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromTokensMergeds(
    runtime: Runtime<unknown>,
    inputs: TokensMerged[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(tokensMergedCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromTokensStripped(
    runtime: Runtime<unknown>,
    input: TokensStripped,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(tokensStrippedCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromTokensStrippeds(
    runtime: Runtime<unknown>,
    inputs: TokensStripped[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(tokensStrippedCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  writeReportFromYtClaimed(
    runtime: Runtime<unknown>,
    input: YtClaimed,
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReport(runtime, new Uint8Array(ytClaimedCodec.encode(input)), remainingAccounts, computeConfig)
  }

  writeReportFromYtClaimeds(
    runtime: Runtime<unknown>,
    inputs: YtClaimed[],
    remainingAccounts: SolanaAccountMeta[],
    computeConfig?: SolanaComputeConfig,
  ) {
    return this.writeReportFromBorshEncodedVec(
      runtime,
      inputs.map((input) => new Uint8Array(ytClaimedCodec.encode(input))),
      remainingAccounts,
      computeConfig,
    )
  }

  /**
   * Registers a typed log trigger for AllowEntryRemoved events. The trigger
   * output is adapted to the decoded AllowEntryRemoved data alongside the raw log.
   * Pass opts.cpi for events emitted via Anchor's emit_cpi!.
   */
  logTriggerAllowEntryRemovedLog(
    filterName: string,
    filters: AllowEntryRemovedFilters[] = [],
    opts?: SolanaLogTriggerOptions,
  ): Trigger<SolanaLog, SolanaDecodedLog<AllowEntryRemoved>> {
    const config: SolanaFilterLogTriggerRequestJson = {
      name: filterName,
      address: bytesToBase64(this.programId),
      eventName: 'AllowEntryRemoved',
      contractIdlJson: KALEND_IDL_BASE64,
      subkeys: encodeAllowEntryRemovedSubkeys(filters),
    }
    if (opts?.cpi) {
      config.cpiFilterConfig = anchorCPILogTriggerConfig(this.programId)
    }
    return adaptTrigger(this.client.logTrigger(config), (log) => ({
      log,
      data: decodeAllowEntryRemovedEvent(log.data),
    }))
  }

  /**
   * Registers a typed log trigger for AllowEntrySet events. The trigger
   * output is adapted to the decoded AllowEntrySet data alongside the raw log.
   * Pass opts.cpi for events emitted via Anchor's emit_cpi!.
   */
  logTriggerAllowEntrySetLog(
    filterName: string,
    filters: AllowEntrySetFilters[] = [],
    opts?: SolanaLogTriggerOptions,
  ): Trigger<SolanaLog, SolanaDecodedLog<AllowEntrySet>> {
    const config: SolanaFilterLogTriggerRequestJson = {
      name: filterName,
      address: bytesToBase64(this.programId),
      eventName: 'AllowEntrySet',
      contractIdlJson: KALEND_IDL_BASE64,
      subkeys: encodeAllowEntrySetSubkeys(filters),
    }
    if (opts?.cpi) {
      config.cpiFilterConfig = anchorCPILogTriggerConfig(this.programId)
    }
    return adaptTrigger(this.client.logTrigger(config), (log) => ({
      log,
      data: decodeAllowEntrySetEvent(log.data),
    }))
  }

  /**
   * Registers a typed log trigger for AuthorityTransferAccepted events. The trigger
   * output is adapted to the decoded AuthorityTransferAccepted data alongside the raw log.
   * Pass opts.cpi for events emitted via Anchor's emit_cpi!.
   */
  logTriggerAuthorityTransferAcceptedLog(
    filterName: string,
    filters: AuthorityTransferAcceptedFilters[] = [],
    opts?: SolanaLogTriggerOptions,
  ): Trigger<SolanaLog, SolanaDecodedLog<AuthorityTransferAccepted>> {
    const config: SolanaFilterLogTriggerRequestJson = {
      name: filterName,
      address: bytesToBase64(this.programId),
      eventName: 'AuthorityTransferAccepted',
      contractIdlJson: KALEND_IDL_BASE64,
      subkeys: encodeAuthorityTransferAcceptedSubkeys(filters),
    }
    if (opts?.cpi) {
      config.cpiFilterConfig = anchorCPILogTriggerConfig(this.programId)
    }
    return adaptTrigger(this.client.logTrigger(config), (log) => ({
      log,
      data: decodeAuthorityTransferAcceptedEvent(log.data),
    }))
  }

  /**
   * Registers a typed log trigger for AuthorityTransferProposed events. The trigger
   * output is adapted to the decoded AuthorityTransferProposed data alongside the raw log.
   * Pass opts.cpi for events emitted via Anchor's emit_cpi!.
   */
  logTriggerAuthorityTransferProposedLog(
    filterName: string,
    filters: AuthorityTransferProposedFilters[] = [],
    opts?: SolanaLogTriggerOptions,
  ): Trigger<SolanaLog, SolanaDecodedLog<AuthorityTransferProposed>> {
    const config: SolanaFilterLogTriggerRequestJson = {
      name: filterName,
      address: bytesToBase64(this.programId),
      eventName: 'AuthorityTransferProposed',
      contractIdlJson: KALEND_IDL_BASE64,
      subkeys: encodeAuthorityTransferProposedSubkeys(filters),
    }
    if (opts?.cpi) {
      config.cpiFilterConfig = anchorCPILogTriggerConfig(this.programId)
    }
    return adaptTrigger(this.client.logTrigger(config), (log) => ({
      log,
      data: decodeAuthorityTransferProposedEvent(log.data),
    }))
  }

  /**
   * Registers a typed log trigger for ConfigInitialized events. The trigger
   * output is adapted to the decoded ConfigInitialized data alongside the raw log.
   * Pass opts.cpi for events emitted via Anchor's emit_cpi!.
   */
  logTriggerConfigInitializedLog(
    filterName: string,
    filters: ConfigInitializedFilters[] = [],
    opts?: SolanaLogTriggerOptions,
  ): Trigger<SolanaLog, SolanaDecodedLog<ConfigInitialized>> {
    const config: SolanaFilterLogTriggerRequestJson = {
      name: filterName,
      address: bytesToBase64(this.programId),
      eventName: 'ConfigInitialized',
      contractIdlJson: KALEND_IDL_BASE64,
      subkeys: encodeConfigInitializedSubkeys(filters),
    }
    if (opts?.cpi) {
      config.cpiFilterConfig = anchorCPILogTriggerConfig(this.programId)
    }
    return adaptTrigger(this.client.logTrigger(config), (log) => ({
      log,
      data: decodeConfigInitializedEvent(log.data),
    }))
  }

  /**
   * Registers a typed log trigger for EscrowLocked events. The trigger
   * output is adapted to the decoded EscrowLocked data alongside the raw log.
   * Pass opts.cpi for events emitted via Anchor's emit_cpi!.
   */
  logTriggerEscrowLockedLog(
    filterName: string,
    filters: EscrowLockedFilters[] = [],
    opts?: SolanaLogTriggerOptions,
  ): Trigger<SolanaLog, SolanaDecodedLog<EscrowLocked>> {
    const config: SolanaFilterLogTriggerRequestJson = {
      name: filterName,
      address: bytesToBase64(this.programId),
      eventName: 'EscrowLocked',
      contractIdlJson: KALEND_IDL_BASE64,
      subkeys: encodeEscrowLockedSubkeys(filters),
    }
    if (opts?.cpi) {
      config.cpiFilterConfig = anchorCPILogTriggerConfig(this.programId)
    }
    return adaptTrigger(this.client.logTrigger(config), (log) => ({
      log,
      data: decodeEscrowLockedEvent(log.data),
    }))
  }

  /**
   * Registers a typed log trigger for EscrowWithdrawn events. The trigger
   * output is adapted to the decoded EscrowWithdrawn data alongside the raw log.
   * Pass opts.cpi for events emitted via Anchor's emit_cpi!.
   */
  logTriggerEscrowWithdrawnLog(
    filterName: string,
    filters: EscrowWithdrawnFilters[] = [],
    opts?: SolanaLogTriggerOptions,
  ): Trigger<SolanaLog, SolanaDecodedLog<EscrowWithdrawn>> {
    const config: SolanaFilterLogTriggerRequestJson = {
      name: filterName,
      address: bytesToBase64(this.programId),
      eventName: 'EscrowWithdrawn',
      contractIdlJson: KALEND_IDL_BASE64,
      subkeys: encodeEscrowWithdrawnSubkeys(filters),
    }
    if (opts?.cpi) {
      config.cpiFilterConfig = anchorCPILogTriggerConfig(this.programId)
    }
    return adaptTrigger(this.client.logTrigger(config), (log) => ({
      log,
      data: decodeEscrowWithdrawnEvent(log.data),
    }))
  }

  /**
   * Registers a typed log trigger for FillExecuted events. The trigger
   * output is adapted to the decoded FillExecuted data alongside the raw log.
   * Pass opts.cpi for events emitted via Anchor's emit_cpi!.
   */
  logTriggerFillExecutedLog(
    filterName: string,
    filters: FillExecutedFilters[] = [],
    opts?: SolanaLogTriggerOptions,
  ): Trigger<SolanaLog, SolanaDecodedLog<FillExecuted>> {
    const config: SolanaFilterLogTriggerRequestJson = {
      name: filterName,
      address: bytesToBase64(this.programId),
      eventName: 'FillExecuted',
      contractIdlJson: KALEND_IDL_BASE64,
      subkeys: encodeFillExecutedSubkeys(filters),
    }
    if (opts?.cpi) {
      config.cpiFilterConfig = anchorCPILogTriggerConfig(this.programId)
    }
    return adaptTrigger(this.client.logTrigger(config), (log) => ({
      log,
      data: decodeFillExecutedEvent(log.data),
    }))
  }

  /**
   * Registers a typed log trigger for ForwarderUpdated events. The trigger
   * output is adapted to the decoded ForwarderUpdated data alongside the raw log.
   * Pass opts.cpi for events emitted via Anchor's emit_cpi!.
   */
  logTriggerForwarderUpdatedLog(
    filterName: string,
    filters: ForwarderUpdatedFilters[] = [],
    opts?: SolanaLogTriggerOptions,
  ): Trigger<SolanaLog, SolanaDecodedLog<ForwarderUpdated>> {
    const config: SolanaFilterLogTriggerRequestJson = {
      name: filterName,
      address: bytesToBase64(this.programId),
      eventName: 'ForwarderUpdated',
      contractIdlJson: KALEND_IDL_BASE64,
      subkeys: encodeForwarderUpdatedSubkeys(filters),
    }
    if (opts?.cpi) {
      config.cpiFilterConfig = anchorCPILogTriggerConfig(this.programId)
    }
    return adaptTrigger(this.client.logTrigger(config), (log) => ({
      log,
      data: decodeForwarderUpdatedEvent(log.data),
    }))
  }

  /**
   * Registers a typed log trigger for GlobalPauseToggled events. The trigger
   * output is adapted to the decoded GlobalPauseToggled data alongside the raw log.
   * Pass opts.cpi for events emitted via Anchor's emit_cpi!.
   */
  logTriggerGlobalPauseToggledLog(
    filterName: string,
    filters: GlobalPauseToggledFilters[] = [],
    opts?: SolanaLogTriggerOptions,
  ): Trigger<SolanaLog, SolanaDecodedLog<GlobalPauseToggled>> {
    const config: SolanaFilterLogTriggerRequestJson = {
      name: filterName,
      address: bytesToBase64(this.programId),
      eventName: 'GlobalPauseToggled',
      contractIdlJson: KALEND_IDL_BASE64,
      subkeys: encodeGlobalPauseToggledSubkeys(filters),
    }
    if (opts?.cpi) {
      config.cpiFilterConfig = anchorCPILogTriggerConfig(this.programId)
    }
    return adaptTrigger(this.client.logTrigger(config), (log) => ({
      log,
      data: decodeGlobalPauseToggledEvent(log.data),
    }))
  }

  /**
   * Registers a typed log trigger for PtRedeemed events. The trigger
   * output is adapted to the decoded PtRedeemed data alongside the raw log.
   * Pass opts.cpi for events emitted via Anchor's emit_cpi!.
   */
  logTriggerPtRedeemedLog(
    filterName: string,
    filters: PtRedeemedFilters[] = [],
    opts?: SolanaLogTriggerOptions,
  ): Trigger<SolanaLog, SolanaDecodedLog<PtRedeemed>> {
    const config: SolanaFilterLogTriggerRequestJson = {
      name: filterName,
      address: bytesToBase64(this.programId),
      eventName: 'PtRedeemed',
      contractIdlJson: KALEND_IDL_BASE64,
      subkeys: encodePtRedeemedSubkeys(filters),
    }
    if (opts?.cpi) {
      config.cpiFilterConfig = anchorCPILogTriggerConfig(this.programId)
    }
    return adaptTrigger(this.client.logTrigger(config), (log) => ({
      log,
      data: decodePtRedeemedEvent(log.data),
    }))
  }

  /**
   * Registers a typed log trigger for ReceivedFillReport events. The trigger
   * output is adapted to the decoded ReceivedFillReport data alongside the raw log.
   * Pass opts.cpi for events emitted via Anchor's emit_cpi!.
   */
  logTriggerReceivedFillReportLog(
    filterName: string,
    filters: ReceivedFillReportFilters[] = [],
    opts?: SolanaLogTriggerOptions,
  ): Trigger<SolanaLog, SolanaDecodedLog<ReceivedFillReport>> {
    const config: SolanaFilterLogTriggerRequestJson = {
      name: filterName,
      address: bytesToBase64(this.programId),
      eventName: 'ReceivedFillReport',
      contractIdlJson: KALEND_IDL_BASE64,
      subkeys: encodeReceivedFillReportSubkeys(filters),
    }
    if (opts?.cpi) {
      config.cpiFilterConfig = anchorCPILogTriggerConfig(this.programId)
    }
    return adaptTrigger(this.client.logTrigger(config), (log) => ({
      log,
      data: decodeReceivedFillReportEvent(log.data),
    }))
  }

  /**
   * Registers a typed log trigger for ReceivedRateReport events. The trigger
   * output is adapted to the decoded ReceivedRateReport data alongside the raw log.
   * Pass opts.cpi for events emitted via Anchor's emit_cpi!.
   */
  logTriggerReceivedRateReportLog(
    filterName: string,
    filters: ReceivedRateReportFilters[] = [],
    opts?: SolanaLogTriggerOptions,
  ): Trigger<SolanaLog, SolanaDecodedLog<ReceivedRateReport>> {
    const config: SolanaFilterLogTriggerRequestJson = {
      name: filterName,
      address: bytesToBase64(this.programId),
      eventName: 'ReceivedRateReport',
      contractIdlJson: KALEND_IDL_BASE64,
      subkeys: encodeReceivedRateReportSubkeys(filters),
    }
    if (opts?.cpi) {
      config.cpiFilterConfig = anchorCPILogTriggerConfig(this.programId)
    }
    return adaptTrigger(this.client.logTrigger(config), (log) => ({
      log,
      data: decodeReceivedRateReportEvent(log.data),
    }))
  }

  /**
   * Registers a typed log trigger for ReceivedSettleReport events. The trigger
   * output is adapted to the decoded ReceivedSettleReport data alongside the raw log.
   * Pass opts.cpi for events emitted via Anchor's emit_cpi!.
   */
  logTriggerReceivedSettleReportLog(
    filterName: string,
    filters: ReceivedSettleReportFilters[] = [],
    opts?: SolanaLogTriggerOptions,
  ): Trigger<SolanaLog, SolanaDecodedLog<ReceivedSettleReport>> {
    const config: SolanaFilterLogTriggerRequestJson = {
      name: filterName,
      address: bytesToBase64(this.programId),
      eventName: 'ReceivedSettleReport',
      contractIdlJson: KALEND_IDL_BASE64,
      subkeys: encodeReceivedSettleReportSubkeys(filters),
    }
    if (opts?.cpi) {
      config.cpiFilterConfig = anchorCPILogTriggerConfig(this.programId)
    }
    return adaptTrigger(this.client.logTrigger(config), (log) => ({
      log,
      data: decodeReceivedSettleReportEvent(log.data),
    }))
  }

  /**
   * Registers a typed log trigger for SeriesOpened events. The trigger
   * output is adapted to the decoded SeriesOpened data alongside the raw log.
   * Pass opts.cpi for events emitted via Anchor's emit_cpi!.
   */
  logTriggerSeriesOpenedLog(
    filterName: string,
    filters: SeriesOpenedFilters[] = [],
    opts?: SolanaLogTriggerOptions,
  ): Trigger<SolanaLog, SolanaDecodedLog<SeriesOpened>> {
    const config: SolanaFilterLogTriggerRequestJson = {
      name: filterName,
      address: bytesToBase64(this.programId),
      eventName: 'SeriesOpened',
      contractIdlJson: KALEND_IDL_BASE64,
      subkeys: encodeSeriesOpenedSubkeys(filters),
    }
    if (opts?.cpi) {
      config.cpiFilterConfig = anchorCPILogTriggerConfig(this.programId)
    }
    return adaptTrigger(this.client.logTrigger(config), (log) => ({
      log,
      data: decodeSeriesOpenedEvent(log.data),
    }))
  }

  /**
   * Registers a typed log trigger for SeriesPauseToggled events. The trigger
   * output is adapted to the decoded SeriesPauseToggled data alongside the raw log.
   * Pass opts.cpi for events emitted via Anchor's emit_cpi!.
   */
  logTriggerSeriesPauseToggledLog(
    filterName: string,
    filters: SeriesPauseToggledFilters[] = [],
    opts?: SolanaLogTriggerOptions,
  ): Trigger<SolanaLog, SolanaDecodedLog<SeriesPauseToggled>> {
    const config: SolanaFilterLogTriggerRequestJson = {
      name: filterName,
      address: bytesToBase64(this.programId),
      eventName: 'SeriesPauseToggled',
      contractIdlJson: KALEND_IDL_BASE64,
      subkeys: encodeSeriesPauseToggledSubkeys(filters),
    }
    if (opts?.cpi) {
      config.cpiFilterConfig = anchorCPILogTriggerConfig(this.programId)
    }
    return adaptTrigger(this.client.logTrigger(config), (log) => ({
      log,
      data: decodeSeriesPauseToggledEvent(log.data),
    }))
  }

  /**
   * Registers a typed log trigger for TokensMerged events. The trigger
   * output is adapted to the decoded TokensMerged data alongside the raw log.
   * Pass opts.cpi for events emitted via Anchor's emit_cpi!.
   */
  logTriggerTokensMergedLog(
    filterName: string,
    filters: TokensMergedFilters[] = [],
    opts?: SolanaLogTriggerOptions,
  ): Trigger<SolanaLog, SolanaDecodedLog<TokensMerged>> {
    const config: SolanaFilterLogTriggerRequestJson = {
      name: filterName,
      address: bytesToBase64(this.programId),
      eventName: 'TokensMerged',
      contractIdlJson: KALEND_IDL_BASE64,
      subkeys: encodeTokensMergedSubkeys(filters),
    }
    if (opts?.cpi) {
      config.cpiFilterConfig = anchorCPILogTriggerConfig(this.programId)
    }
    return adaptTrigger(this.client.logTrigger(config), (log) => ({
      log,
      data: decodeTokensMergedEvent(log.data),
    }))
  }

  /**
   * Registers a typed log trigger for TokensStripped events. The trigger
   * output is adapted to the decoded TokensStripped data alongside the raw log.
   * Pass opts.cpi for events emitted via Anchor's emit_cpi!.
   */
  logTriggerTokensStrippedLog(
    filterName: string,
    filters: TokensStrippedFilters[] = [],
    opts?: SolanaLogTriggerOptions,
  ): Trigger<SolanaLog, SolanaDecodedLog<TokensStripped>> {
    const config: SolanaFilterLogTriggerRequestJson = {
      name: filterName,
      address: bytesToBase64(this.programId),
      eventName: 'TokensStripped',
      contractIdlJson: KALEND_IDL_BASE64,
      subkeys: encodeTokensStrippedSubkeys(filters),
    }
    if (opts?.cpi) {
      config.cpiFilterConfig = anchorCPILogTriggerConfig(this.programId)
    }
    return adaptTrigger(this.client.logTrigger(config), (log) => ({
      log,
      data: decodeTokensStrippedEvent(log.data),
    }))
  }

  /**
   * Registers a typed log trigger for YtClaimed events. The trigger
   * output is adapted to the decoded YtClaimed data alongside the raw log.
   * Pass opts.cpi for events emitted via Anchor's emit_cpi!.
   */
  logTriggerYtClaimedLog(
    filterName: string,
    filters: YtClaimedFilters[] = [],
    opts?: SolanaLogTriggerOptions,
  ): Trigger<SolanaLog, SolanaDecodedLog<YtClaimed>> {
    const config: SolanaFilterLogTriggerRequestJson = {
      name: filterName,
      address: bytesToBase64(this.programId),
      eventName: 'YtClaimed',
      contractIdlJson: KALEND_IDL_BASE64,
      subkeys: encodeYtClaimedSubkeys(filters),
    }
    if (opts?.cpi) {
      config.cpiFilterConfig = anchorCPILogTriggerConfig(this.programId)
    }
    return adaptTrigger(this.client.logTrigger(config), (log) => ({
      log,
      data: decodeYtClaimedEvent(log.data),
    }))
  }
}
