use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("76Q4EZd4pUwpeZQYCuMsoMEoc4oR3HN79KbkDRybdBfr");

#[program]
pub mod day30 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn close(ctx: Context<Close>) -> Result<()> {
        msg!("Closing account");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, space = size_of::<PDA>() + 8, seeds=[], bump)]
    pub pda_account: Account<'info, PDA>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut, close = signer)]
    pub pda_account: Account<'info, PDA>,
    #[account(mut)]
    pub signer: Signer<'info>,
}

#[account]
pub struct PDA {}
