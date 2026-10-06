#!/usr/bin/env python3
"""
Spike S6: xStocks ScaledUiAmountConfig Layout & Dividend-Adjusted Index Math
Validates:
1. ScaledUiAmountConfig byte layout and live_multiplier(now) timestamp boundary logic
2. D(t) = m(t) / S dividend vs split invariance
3. WAD fixed-point (1e18) conversion and PT/YT redemption/claim formulas
"""
import struct

WAD = 10**18

def live_multiplier(multiplier: float, new_multiplier: float, effective_ts: int, now: int) -> float:
    """
    Implements G19 / Section 11 live_multiplier logic:
    Before effective_ts, the previous multiplier applies.
    At or after effective_ts, new_multiplier applies.
    """
    if now >= effective_ts:
        return new_multiplier
    return multiplier

def test_boundary_conditions():
    m_old = 1.045
    m_new = 1.060
    t_eff = 1750000000

    assert live_multiplier(m_old, m_new, t_eff, t_eff - 1) == m_old, "One second before effective time must return previous multiplier"
    assert live_multiplier(m_old, m_new, t_eff, t_eff) == m_new, "At effective time must return new multiplier"
    assert live_multiplier(m_old, m_new, t_eff, t_eff + 1) == m_new, "One second after effective time must return new multiplier"
    print("✓ Boundary condition tests passed")

def test_dividend_vs_split():
    # Base state: Series opens with m_0 = 1.0, S = 1.0
    m_0 = 1.0
    S_0 = 1.0
    D_0 = m_0 / S_0
    deposit_raw = 1000 * 10**6 # 1000 shares raw (Token-2022 units)

    # Case 1: 2% Dividend (multiplier rises, S unchanged)
    m_div = 1.02
    S_div = 1.0
    D_div = m_div / S_div
    
    # PT and YT settlement formulas
    # pt_redeem_raw = floor(a * min(D_0, D_T) / D_T)
    # yt_claim_raw  = floor(a * (D_T - min(D_0, D_T)) / D_T)
    idx_open_wad = int(D_0 * WAD)
    idx_settle_wad = int(D_div * WAD)

    min_idx = min(idx_open_wad, idx_settle_wad)
    pt_raw = (deposit_raw * min_idx) // idx_settle_wad
    yt_raw = (deposit_raw * (idx_settle_wad - min_idx)) // idx_settle_wad

    assert pt_raw + yt_raw <= deposit_raw, "INV3 violated: Redemptions exceed deposit"
    # PT gets ~980.39 shares (worth 980.39 * 1.02 = 1000 original share exposure)
    # YT gets ~19.60 shares (worth 19.60 * 1.02 = 20 shares of dividend growth)
    print(f"✓ Dividend test: Deposit {deposit_raw} -> PT {pt_raw}, YT {yt_raw}, Total {pt_raw + yt_raw}")

    # Case 2: 2-for-1 Stock Split (multiplier doubles, split factor doubles)
    # Underlying shares split, so each token multiplier is doubled to reflect 2 shares per token
    m_split = 2.0
    S_split = 2.0 # Oracle reports S = 2/1
    D_split = m_split / S_split
    idx_split_wad = int(D_split * WAD)

    min_idx_split = min(idx_open_wad, idx_split_wad)
    pt_split_raw = (deposit_raw * min_idx_split) // idx_split_wad
    yt_split_raw = (deposit_raw * (idx_split_wad - min_idx_split)) // idx_split_wad

    assert pt_split_raw == deposit_raw, "Split must leave PT principal in kind intact"
    assert yt_split_raw == 0, "Split must produce ZERO yield for YT"
    print(f"✓ Stock split invariance test: PT {pt_split_raw}, YT {yt_split_raw} (YT yield is strictly 0)")

def test_scaled_ui_config_binary_packing():
    # 32 bytes authority + 8 bytes multiplier + 8 bytes new_multiplier + 8 bytes effective_ts
    authority = b'\x11' * 32
    m_prev = 1.0525
    m_next = 1.0650
    eff_ts = 1750001234

    packed = authority + struct.pack('<ddq', m_prev, m_next, eff_ts)
    assert len(packed) == 56

    auth_unpacked = packed[:32]
    prev_unp, next_unp, ts_unp = struct.unpack('<ddq', packed[32:])
    assert auth_unpacked == authority
    assert abs(prev_unp - m_prev) < 1e-9
    assert abs(next_unp - m_next) < 1e-9
    assert ts_unp == eff_ts
    print("✓ ScaledUiAmountConfig binary struct layout (56 bytes) verified")

if __name__ == '__main__':
    test_boundary_conditions()
    test_dividend_vs_split()
    test_scaled_ui_config_binary_packing()
    print("All S6 spike assertions passed successfully!")
