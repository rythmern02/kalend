use anchor_lang::prelude::*;

#[error_code]
pub enum KalendError {
    #[msg("Unauthorized: Caller is not the authorized protocol authority")]
    Unauthorized,

    #[msg("PendingAuthorityMismatch: Caller is not the designated pending authority")]
    PendingAuthorityMismatch,

    #[msg("ProtocolPaused: Protocol is currently paused by governance")]
    ProtocolPaused,

    #[msg("SeriesPaused: Target series is currently paused")]
    SeriesPaused,

    #[msg("SeriesNotOpen: Series status is not Open")]
    SeriesNotOpen,

    #[msg("SeriesAlreadySettled: Series is already settled")]
    SeriesAlreadySettled,

    #[msg("SeriesMaturityNotReached: Cannot settle series prior to maturity timestamp")]
    SeriesMaturityNotReached,

    #[msg("SeriesAlreadyMatured: Cannot strip or merge series at or after maturity timestamp")]
    SeriesAlreadyMatured,

    #[msg("SeriesNotSettled: Redemptions and claims require settled series")]
    SeriesNotSettled,

    #[msg("MaturityInPast: Series maturity timestamp must be in the future")]
    MaturityInPast,

    #[msg("InvalidCollateralMint: Collateral mint does not conform to extension safety policy")]
    InvalidCollateralMint,

    #[msg("DisallowedCollateralExtension: Mint carries a forbidden Token-2022 extension")]
    DisallowedCollateralExtension,

    #[msg("InvalidAllowEntry: Wallet has no valid or active AllowEntry")]
    InvalidAllowEntry,

    #[msg("AllowEntryExpired: AllowEntry has passed its expiration timestamp")]
    AllowEntryExpired,

    #[msg("MissingRole: Wallet lacks the required role bit for this instruction")]
    MissingRole,

    #[msg("EscrowLocked: Escrow funds cannot be withdrawn before lock_until timestamp")]
    EscrowLocked,

    #[msg("InsufficientEscrowBalance: Escrow does not hold sufficient tokens")]
    InsufficientEscrowBalance,

    #[msg("InvalidForwarderProgram: Forwarder program is not registered in Config")]
    InvalidForwarderProgram,

    #[msg("InvalidForwarderState: Forwarder state account does not match registered forwarder")]
    InvalidForwarderState,

    #[msg("InvalidForwarderAuthority: forwarder_authority signer does not match PDA derivation")]
    InvalidForwarderAuthority,

    #[msg("InvalidWorkflowIdentity: Workflow ID or owner does not match allowed forwarder entry")]
    InvalidWorkflowIdentity,

    #[msg("InvalidReportPayload: Malformed or unparseable report payload")]
    InvalidReportPayload,

    #[msg("TrailingReportBytes: Trailing bytes detected after decoding report payload")]
    TrailingReportBytes,

    #[msg("UnsupportedReportVersion: Report version is not supported")]
    UnsupportedReportVersion,

    #[msg("UnknownReportKind: Report kind must be 1 (Fill), 2 (Settle), or 3 (Rate)")]
    UnknownReportKind,

    #[msg("RateExceedsCap: Implied or observed rate exceeds series max_rate_bps cap")]
    RateExceedsCap,

    #[msg("DividendBandExceeded: Dividend growth index outside configured band; series disputed")]
    DividendBandExceeded,

    #[msg("RoundExpired: Fill report received after not_after timestamp expiration")]
    RoundExpired,

    #[msg("FillAlreadyExecuted: Fill receipt has already been executed")]
    FillAlreadyExecuted,

    #[msg("FillNotApproved: Fill receipt is not in Approved status")]
    FillNotApproved,

    #[msg("SeriesMismatch: Series specified does not match FillReceipt or report")]
    SeriesMismatch,

    #[msg("TokenMismatch: Escrow or mint token account does not match series specifications")]
    TokenMismatch,

    #[msg("PartyMismatch: Wallet does not match requester or dealer in FillReceipt")]
    PartyMismatch,

    #[msg("MathOverflow: Arithmetic calculation encountered an overflow or division by zero")]
    MathOverflow,

    #[msg("InvalidIndex: Settlement index must be positive")]
    InvalidIndex,

    #[msg("ZeroAmount: Amount must be greater than zero")]
    ZeroAmount,

    #[msg("RegistryFull: Series registry has reached its maximum limit (64 series)")]
    RegistryFull,

    #[msg("MockForwarderForbidden: Mock forwarder address is strictly rejected in mainnet builds")]
    MockForwarderForbidden,
}
