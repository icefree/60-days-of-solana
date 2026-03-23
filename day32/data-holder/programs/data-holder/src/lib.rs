use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("9xYMDod5cSEUcZDu9eUiC65CSHvimqZyuVLMLeX7LEXJ");

#[program]
pub mod data_holder {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.data_holder.x = u64::pow(2, 32);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, space = 8 + size_of::<DataHolder>(), seeds=[], bump)]
    pub data_holder: Account<'info, DataHolder>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct DataHolder {
    pub x: u64,
}
