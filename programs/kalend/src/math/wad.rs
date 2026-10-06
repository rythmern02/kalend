use crate::errors::KalendError;
use anchor_lang::prelude::*;

pub const WAD: u128 = 1_000_000_000_000_000_000; // 1e18

/// Computes the principal token redemption amount in raw collateral units:
/// pt_redeem_raw(a) = floor( a * min(idx_open, idx_settle) / idx_settle )
pub fn pt_redeem_raw(amount_pt: u64, idx_open: u128, idx_settle: u128) -> Result<u64> {
    if idx_settle == 0 {
        return err!(KalendError::InvalidIndex);
    }
    if amount_pt == 0 {
        return Ok(0);
    }

    let a_u128 = amount_pt as u128;
    let min_idx = std::cmp::min(idx_open, idx_settle);

    // a * min_idx
    let numerator = a_u128
        .checked_mul(min_idx)
        .ok_or(error!(KalendError::MathOverflow))?;

    // floor division
    let redeemed = numerator
        .checked_div(idx_settle)
        .ok_or(error!(KalendError::MathOverflow))?;

    u64::try_from(redeemed).map_err(|_| error!(KalendError::MathOverflow))
}

/// Computes the yield token claim amount in raw collateral units:
/// yt_claim_raw(a) = floor( a * (idx_settle - min(idx_open, idx_settle)) / idx_settle )
pub fn yt_claim_raw(amount_yt: u64, idx_open: u128, idx_settle: u128) -> Result<u64> {
    if idx_settle == 0 {
        return err!(KalendError::InvalidIndex);
    }
    if amount_yt == 0 {
        return Ok(0);
    }

    let a_u128 = amount_yt as u128;
    let min_idx = std::cmp::min(idx_open, idx_settle);
    let growth = idx_settle
        .checked_sub(min_idx)
        .ok_or(error!(KalendError::MathOverflow))?;

    let numerator = a_u128
        .checked_mul(growth)
        .ok_or(error!(KalendError::MathOverflow))?;

    let claimed = numerator
        .checked_div(idx_settle)
        .ok_or(error!(KalendError::MathOverflow))?;

    u64::try_from(claimed).map_err(|_| error!(KalendError::MathOverflow))
}

/// Computes the split-adjusted index: D = (m * WAD) / split_factor
/// Where split_factor = split_num / split_den
pub fn split_adjusted_index(multiplier_wad: u128, split_num: u32, split_den: u32) -> Result<u128> {
    if split_num == 0 || split_den == 0 {
        return err!(KalendError::MathOverflow);
    }

    // D = (multiplier_wad * split_den) / split_num
    let num = multiplier_wad
        .checked_mul(split_den as u128)
        .ok_or(error!(KalendError::MathOverflow))?;

    num.checked_div(split_num as u128)
        .ok_or_else(|| error!(KalendError::MathOverflow))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_positive_yield_settlement() {
        let deposit = 1_000_000_000u64; // 1000 tokens
        let idx_open = 1 * WAD;
        let idx_settle = (11 * WAD) / 10; // 10% yield growth

        let pt = pt_redeem_raw(deposit, idx_open, idx_settle).unwrap();
        let yt = yt_claim_raw(deposit, idx_open, idx_settle).unwrap();

        // PT should receive 1000 * 1.0 / 1.1 = 909_090_909
        // YT should receive 1000 * 0.1 / 1.1 = 90_909_090
        assert_eq!(pt, 909_090_909);
        assert_eq!(yt, 90_909_090);

        // Invariant INV3: pt + yt <= deposit (rounding dust stays in vault)
        assert!(pt + yt <= deposit);
        assert_eq!(deposit - (pt + yt), 1); // 1 unit of rounding dust retained by vault
    }

    #[test]
    fn test_slashed_or_negative_growth() {
        let deposit = 1_000_000_000u64;
        let idx_open = 11 * WAD / 10;
        let idx_settle = 1 * WAD; // index fell

        let pt = pt_redeem_raw(deposit, idx_open, idx_settle).unwrap();
        let yt = yt_claim_raw(deposit, idx_open, idx_settle).unwrap();

        assert_eq!(pt, deposit); // PT receives full raw amount
        assert_eq!(yt, 0);       // YT receives zero
    }

    #[test]
    fn test_zero_amount() {
        let pt = pt_redeem_raw(0, 1 * WAD, 2 * WAD).unwrap();
        let yt = yt_claim_raw(0, 1 * WAD, 2 * WAD).unwrap();
        assert_eq!(pt, 0);
        assert_eq!(yt, 0);
    }

    #[test]
    fn test_collateral_conservation_invariant_inv1_inv2() {
        // Test across a wide spectrum of deposits and yield multiples
        let deposits = [1u64, 100, 1_000, 1_000_000, 100_000_000_000, 10_000_000_000_000_000];
        let open_indices = [WAD / 2, WAD, 2 * WAD, 10 * WAD];
        let settle_multipliers = [1u128, 5, 8, 10, 11, 15, 20, 50, 100]; // / 10

        for deposit in deposits {
            for idx_open in open_indices {
                for sm in settle_multipliers {
                    let idx_settle = (idx_open * sm) / 10;
                    if idx_settle == 0 {
                        continue;
                    }

                    let pt = pt_redeem_raw(deposit, idx_open, idx_settle).unwrap();
                    let yt = yt_claim_raw(deposit, idx_open, idx_settle).unwrap();

                    // INV1: Vault never underpays or overpays; pt + yt <= deposit
                    assert!(
                        pt + yt <= deposit,
                        "INV1 violated: pt ({pt}) + yt ({yt}) > deposit ({deposit})"
                    );

                    // At most 1 unit of floor dust
                    assert!(
                        deposit - (pt + yt) <= 1,
                        "Excessive rounding dust: deposit ({deposit}) - sum ({})", pt + yt
                    );

                    // INV2: Non-negative yield; if idx_settle <= idx_open, yt == 0 and pt == deposit
                    if idx_settle <= idx_open {
                        assert_eq!(yt, 0, "INV2 violated: YT received yield when index fell or was equal");
                        assert_eq!(pt, deposit, "INV2 violated: PT did not absorb full deposit");
                    }
                }
            }
        }
    }

    #[test]
    fn test_stock_split_invariance_inv7() {
        // Prior to split: multiplier = 1.05 * WAD (5% dividend accrued), split = 1:1
        let d_before = split_adjusted_index(105 * WAD / 100, 1, 1).unwrap();
        assert_eq!(d_before, 105 * WAD / 100);

        // Forward split 2-for-1: multiplier doubles to 2.10 * WAD, split factor = 2 / 1
        let d_after_split = split_adjusted_index(210 * WAD / 100, 2, 1).unwrap();
        // Invariant INV7: D(t) remains invariant across splits
        assert_eq!(d_after_split, d_before);

        // Reverse split 1-for-4: multiplier quarters to 0.2625 * WAD, split factor = 1 / 4
        let d_after_rev_split = split_adjusted_index(2625 * WAD / 10000, 1, 4).unwrap();
        assert_eq!(d_after_rev_split, d_before);
    }
}
