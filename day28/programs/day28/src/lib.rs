use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("8DwXCfLZX8YdVX72Nma9xoGDUkjq6voHBrjCvMoaxWWE");

#[program]
pub mod day28 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn set(ctx: Context<Set>, value: u32) -> Result<()> {
        ctx.accounts.pda.value = value;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Set<'info> {
    #[account(mut)]
    pub pda: Account<'info, PDA>,
    #[account(mut)]
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, space = 8 + size_of::<PDA>(),seeds=[], bump)]
    pub pda: Account<'info, PDA>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct PDA {
    pub value: u32,
}
