use near_contract_standards::fungible_token::receiver::FungibleTokenReceiver;
use near_sdk::json_types::U128;
use near_sdk::serde::Deserialize;
use near_sdk::{env, near, AccountId, PromiseOrValue};

use crate::events;
use crate::state::{CircleStatus, VaultTier};
use crate::{now, RodaContract};

/// Message payload carried by `ft_transfer_call` into this contract.
#[derive(Deserialize)]
#[serde(crate = "near_sdk::serde", tag = "type", rename_all = "snake_case")]
enum TransferMsg {
    Deposit { vault_id: u64 },
    Contribute { circle: u64 },
}

#[near]
impl FungibleTokenReceiver for RodaContract {
    /// Handle NEP-141 `ft_transfer_call` deposits. Returns the unused portion
    /// of `amount` (0 when the full amount was applied).
    #[payable]
    fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128> {
        let amount: u64 = match u64::try_from(amount.0) {
            Ok(a) if a > 0 => a,
            _ => return PromiseOrValue::Value(amount),
        };

        let parsed: TransferMsg = match serde_json::from_str(&msg) {
            Ok(m) => m,
            Err(_) => return PromiseOrValue::Value(U128(amount)),
        };

        let applied = match parsed {
            TransferMsg::Deposit { vault_id } => self.apply_deposit(&sender_id, vault_id, amount),
            TransferMsg::Contribute { circle } => self.apply_contribution(&sender_id, circle, amount),
        };

        if applied {
            PromiseOrValue::Value(U128(0))
        } else {
            // Validation failed — return everything to the sender.
            PromiseOrValue::Value(U128(amount))
        }
    }
}

impl RodaContract {
    fn apply_deposit(&mut self, sender: &AccountId, vault_id: u64, amount: u64) -> bool {
        let Some(mut vault) = self.vaults.get(&vault_id) else {
            env::log_str(&format!("RodaError:VaultNotFound:{}", vault_id));
            return false;
        };
        if &vault.owner != sender {
            env::log_str(&format!("RodaError:Unauthorized:{}", vault_id));
            return false;
        }
        if !vault.active {
            env::log_str(&format!("RodaError:VaultNotActive:{}", vault_id));
            return false;
        }

        // Enforce tier minimum on the resulting balance (first or later).
        let min = VaultTier::from_u8(vault.tier).map(|t| t.min_deposit()).unwrap_or(0);
        let new_balance = match vault.balance.checked_add(amount) {
            Some(b) => b,
            None => {
                env::log_str("RodaError:MathOverflow");
                return false;
            }
        };
        if new_balance < min {
            env::log_str("RodaError:BelowMinimumDeposit");
            return false;
        }

        let first_deposit = vault.last_deposit_ts == 0;
        vault.balance = new_balance;
        vault.last_deposit_ts = now();
        if first_deposit {
            let lock = VaultTier::from_u8(vault.tier)
                .map(|t| t.lock_duration_secs())
                .unwrap_or(0);
            vault.maturity_ts = now().saturating_add(lock);
        }
        self.vaults.insert(&vault_id, &vault);

        events::vault_deposit(sender, vault_id, amount, vault.balance, vault.maturity_ts);
        self.push_activity(sender, "deposit", None, Some(vault_id), amount, None);
        true
    }

    fn apply_contribution(&mut self, sender: &AccountId, circle_code: u64, amount: u64) -> bool {
        let Some(mut circle) = self.circles.get(&circle_code) else {
            env::log_str(&format!("RodaError:CircleNotFound:{}", circle_code));
            return false;
        };

        if circle.status != CircleStatus::Active {
            env::log_str("RodaError:CircleNotJoinable");
            return false;
        }
        if circle.payout_pending {
            env::log_str("RodaError:PendingTransfer");
            return false;
        }
        if !circle.members.contains(sender) {
            env::log_str("RodaError:NotAMember");
            return false;
        }
        if circle.paid.contains(sender) {
            env::log_str("RodaError:AlreadyPaid");
            return false;
        }
        if amount != circle.contribution_amount {
            env::log_str("RodaError:InvalidContribution");
            return false;
        }

        match circle.pool_balance.checked_add(amount) {
            Some(b) => circle.pool_balance = b,
            None => {
                env::log_str("RodaError:MathOverflow");
                return false;
            }
        }
        circle.paid.push(sender.clone());
        let paid_count = circle.paid.len() as u8;
        self.circles.insert(&circle_code, &circle);

        events::contribution_made(circle_code, sender, circle.current_round, amount, paid_count);
        self.push_activity(sender, "contribute", Some(circle_code), None, amount, None);
        true
    }
}
