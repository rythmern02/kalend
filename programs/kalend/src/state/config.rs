use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, Debug, PartialEq)]
pub struct ForwarderEntry {
    /// Keystone forwarder program address
    pub program: Pubkey,
    /// Keystone forwarder state account
    pub state: Pubkey,
    /// Authorized workflow ID (32 bytes) that may submit reports through this forwarder
    pub allowed_workflow: [u8; 32],
}

#[account]
#[derive(Default, Debug)]
pub struct Config {
    /// Protocol governance authority
    pub authority: Pubkey,
    /// Pending authority for two-step transfer
    pub pending_authority: Pubkey,
    /// Registered forwarders (up to 2: on Devnet, 1 live Keystone + 1 mock simulator forwarder)
    pub forwarders: [ForwarderEntry; 2],
    /// Number of active forwarders in the array
    pub forwarder_count: u8,
    /// Published SHA-256 hash of the TEE enclave X25519 public key
    pub enclave_key_hash: [u8; 32],
    /// Global emergency pause flag
    pub paused: bool,
    /// Cluster mode: 0 = Local, 1 = Devnet, 2 = Mainnet
    pub cluster_mode: u8,
    /// Protocol fee in basis points (0 for v1)
    pub fee_bps: u16,
    /// Protocol fee treasury
    pub treasury: Pubkey,
    /// PDA bump seed
    pub bump: u8,
}

impl Config {
    pub const SEED: &'static [u8] = b"config";
    // 8 discriminator + 32 + 32 + (2 * (32 + 32 + 32)) + 1 + 32 + 1 + 1 + 2 + 32 + 1 + 32 (padding) = 366 bytes
    pub const LEN: usize = 8 + 32 + 32 + (2 * (32 + 32 + 32)) + 1 + 32 + 1 + 1 + 2 + 32 + 1 + 32;

    pub fn is_authorized_forwarder(
        &self,
        program_id: &Pubkey,
        state_key: &Pubkey,
        workflow_id: &[u8; 32],
    ) -> bool {
        for i in 0..self.forwarder_count as usize {
            if i < self.forwarders.len() {
                let f = &self.forwarders[i];
                if f.program == *program_id && f.state == *state_key {
                    // Check if workflow matches allowed workflow or wildcard if set
                    if f.allowed_workflow == [0u8; 32] || f.allowed_workflow == *workflow_id {
                        return true;
                    }
                }
            }
        }
        false
    }
}
