use anchor_lang::prelude::*;
use anchor_lang::solana_program::rent as rent_module;
use std::mem::size_of;

declare_id!("AFy9PAPbyAgpnXG7JeUxc5qKHqGdZ1eVfa4sA5YpywzN");

#[program]
pub mod day20 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let cost_of_empty_acc = rent_module::ACCOUNT_STORAGE_OVERHEAD as f64
            * rent_module::DEFAULT_LAMPORTS_PER_BYTE_YEAR as f64
            * rent_module::DEFAULT_EXEMPTION_THRESHOLD;

        msg!("cost to create an empty account: {}", cost_of_empty_acc);

        let cost_for_32_bytes = cost_of_empty_acc
            + 32 as f64
                * rent_module::DEFAULT_LAMPORTS_PER_BYTE_YEAR as f64
                * rent_module::DEFAULT_EXEMPTION_THRESHOLD;
        msg!(
            "cost to create an account with 32 bytes: {}",
            cost_for_32_bytes
        );

        Ok(())
    }

    pub fn increase_account_size(ctx: Context<IncreaseAccountSize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, space = 8 + size_of::<MyStorage>(), seeds=[], bump)]
    pub my_storage: Account<'info, MyStorage>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct IncreaseAccountSize<'info> {
    #[account(mut, realloc = 1000 + 8 + size_of::<MyStorage>(), realloc::zero = false, realloc::payer = signer, seeds=[], bump)]
    pub my_storage: Account<'info, MyStorage>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct MyStorage {
    pub data: u64,
}
