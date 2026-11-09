use borsh::BorshSerialize;
use near_contract_standards::fungible_token::core::FungibleTokenCore;
use near_contract_standards::fungible_token::metadata::{
    FungibleTokenMetadata, FungibleTokenMetadataProvider,
};
use near_contract_standards::fungible_token::receiver::FungibleTokenReceiver;
use near_contract_standards::fungible_token::resolver::FungibleTokenResolver;
use near_contract_standards::fungible_token::FungibleToken;
use near_contract_standards::storage_management::{
    StorageBalance, StorageBalanceBounds, StorageManagement,
};
use near_sdk::collections::LazyOption;
use near_sdk::json_types::U128;
use near_sdk::{
    env, near, require, AccountId, BorshStorageKey, Gas, NearToken, PanicOnDefault, Promise,
    PromiseOrValue,
};

pub const FT_METADATA_SPEC: &str = "ft-1.0.0";

#[derive(BorshStorageKey, BorshSerialize)]
enum StorageKey {
    FtBalance,
    FtMetadata,
}

/// NEP-141 + NEP-145 + NEP-148 token used as Roda's test settlement asset.
/// `protocol` (the Roda contract) is the only account allowed to `mint`.
#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct RodaToken {
    owner: AccountId,
    protocol: Option<AccountId>,
    ft: FungibleToken,
    metadata: LazyOption<FungibleTokenMetadata>,
}

#[near]
impl RodaToken {
    #[init]
    pub fn new(owner: AccountId, protocol: Option<AccountId>, decimals: u8) -> Self {
        require!(
            env::state_read::<RodaToken>().is_none(),
            "AlreadyInitialized"
        );
        Self {
            owner,
            protocol,
            ft: FungibleToken::new(StorageKey::FtBalance),
            metadata: LazyOption::new(
                StorageKey::FtMetadata,
                Some(&FungibleTokenMetadata {
                    spec: FT_METADATA_SPEC.to_string(),
                    name: "Roda Test USD".to_string(),
                    symbol: "rUSDC".to_string(),
                    icon: None,
                    reference: None,
                    reference_hash: None,
                    decimals,
                }),
            ),
        }
    }

    /// Admin: set the Roda contract allowed to mint (and clear the faucet flag by unsetting).
    pub fn set_protocol(&mut self, protocol: Option<AccountId>) {
        require!(
            env::predecessor_account_id() == self.owner,
            "Unauthorized"
        );
        self.protocol = protocol;
    }

    /// Admin: transfer ownership.
    pub fn set_owner(&mut self, owner: AccountId) {
        require!(
            env::predecessor_account_id() == self.owner,
            "Unauthorized"
        );
        self.owner = owner;
    }

    /// Admin: upgrade contract bytecode and optionally migrate state.
    /// Accepts raw WASM bytecode directly or JSON `{"code": "<base64_wasm>", "migrate": true}`.
    pub fn upgrade(&mut self) -> Promise {
        require!(
            env::predecessor_account_id() == self.owner,
            "Unauthorized"
        );
        let input = env::input().expect("NoCodeProvided");

        let (code, should_migrate) = if input.starts_with(b"\0asm") {
            (input, true)
        } else {
            #[derive(near_sdk::serde::Deserialize)]
            #[serde(crate = "near_sdk::serde")]
            struct UpgradeArgs {
                code: near_sdk::json_types::Base64VecU8,
                migrate: Option<bool>,
            }
            let args: UpgradeArgs = near_sdk::serde_json::from_slice(&input)
                .expect("InvalidUpgradeInput: expected raw WASM or JSON with {code: string}");
            (args.code.0, args.migrate.unwrap_or(true))
        };

        require!(!code.is_empty(), "EmptyWasmCode");
        require!(code.starts_with(b"\0asm"), "InvalidWasmMagicNumber");

        let mut promise = Promise::new(env::current_account_id()).deploy_contract(code);
        if should_migrate {
            promise = promise.then(
                Promise::new(env::current_account_id()).function_call(
                    "migrate".to_string(),
                    vec![],
                    NearToken::from_yoctonear(0),
                    Gas::from_tgas(40),
                ),
            );
        }
        promise
    }

    /// State migration callback after bytecode upgrade.
    /// Only callable by the contract itself during an upgrade promise chain,
    /// or directly by the owner.
    #[init(ignore_state)]
    pub fn migrate() -> Self {
        let caller = env::predecessor_account_id();
        let state: Self = env::state_read().expect("StateNotFound");
        require!(
            caller == env::current_account_id() || caller == state.owner,
            "Unauthorized"
        );
        state
    }

    /// Mint tokens to `receiver_id`. Only the configured `protocol` contract
    /// (the Roda app contract) may call this. Auto-registers the receiver.
    pub fn mint(&mut self, receiver_id: AccountId, amount: U128) {
        let caller = env::predecessor_account_id();
        require!(self.protocol.as_ref() == Some(&caller), "Unauthorized");
        require!(amount.0 > 0, "InvalidAmount");

        if self.ft.accounts.get(&receiver_id).is_none() {
            self.ft.internal_register_account(&receiver_id);
        }
        self.ft.internal_deposit(&receiver_id, amount.0);

        // NEP-297 FT mint event.
        env::log_str(&format!(
            "EVENT_JSON:{}",
            near_sdk::serde_json::json!({
                "standard": "nep141",
                "version": "0.1.0",
                "event": "ft_mint",
                "data": [{
                    "owner_id": receiver_id,
                    "amount": amount.0.to_string(),
                }],
            })
        ));
    }

    pub fn get_owner(&self) -> AccountId {
        self.owner.clone()
    }

    pub fn get_protocol(&self) -> Option<AccountId> {
        self.protocol.clone()
    }
}

#[near]
impl FungibleTokenCore for RodaToken {
    #[payable]
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>) {
        self.ft.ft_transfer(receiver_id, amount, memo)
    }

    #[payable]
    fn ft_transfer_call(
        &mut self,
        receiver_id: AccountId,
        amount: U128,
        memo: Option<String>,
        msg: String,
    ) -> PromiseOrValue<U128> {
        self.ft.ft_transfer_call(receiver_id, amount, memo, msg)
    }

    fn ft_total_supply(&self) -> U128 {
        self.ft.ft_total_supply()
    }

    fn ft_balance_of(&self, account_id: AccountId) -> U128 {
        self.ft.ft_balance_of(account_id)
    }
}

#[near]
impl FungibleTokenResolver for RodaToken {
    #[private]
    fn ft_resolve_transfer(
        &mut self,
        sender_id: AccountId,
        receiver_id: AccountId,
        amount: U128,
    ) -> U128 {
        let (used, _burned) = self.ft.internal_ft_resolve_transfer(&sender_id, receiver_id, amount);
        used.into()
    }
}

#[near]
impl FungibleTokenReceiver for RodaToken {
    #[payable]
    fn ft_on_transfer(
        &mut self,
        _sender_id: AccountId,
        _amount: U128,
        _msg: String,
    ) -> PromiseOrValue<U128> {
        // This token contract does not accept inbound transfer_calls.
        PromiseOrValue::Value(U128(0))
    }
}

#[near]
impl FungibleTokenMetadataProvider for RodaToken {
    fn ft_metadata(&self) -> FungibleTokenMetadata {
        self.metadata.get().unwrap()
    }
}

#[near]
impl StorageManagement for RodaToken {
    #[payable]
    fn storage_deposit(
        &mut self,
        account_id: Option<AccountId>,
        registration_only: Option<bool>,
    ) -> StorageBalance {
        self.ft.storage_deposit(account_id, registration_only)
    }

    #[payable]
    fn storage_withdraw(&mut self, amount: Option<NearToken>) -> StorageBalance {
        self.ft.storage_withdraw(amount)
    }

    #[payable]
    fn storage_unregister(&mut self, force: Option<bool>) -> bool {
        self.ft.storage_unregister(force)
    }

    fn storage_balance_bounds(&self) -> StorageBalanceBounds {
        self.ft.storage_balance_bounds()
    }

    fn storage_balance_of(&self, account_id: AccountId) -> Option<StorageBalance> {
        self.ft.storage_balance_of(account_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn metadata_spec_constant() {
        assert_eq!(FT_METADATA_SPEC, "ft-1.0.0");
    }
}
