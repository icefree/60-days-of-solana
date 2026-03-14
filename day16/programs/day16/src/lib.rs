use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("9a3MVT2h3ZLsqD8V637xHRTxqWv9PGMGZTCRfYFKe9bU");

#[program]
pub mod day16 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + size_of::<MyStorage>(),
        seeds = [],
        bump)]
    pub my_storage: Account<'info, MyStorage>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct MyStorage {
    x: i64,
    y: i64,
}
