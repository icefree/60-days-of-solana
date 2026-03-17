use anchor_lang::prelude::*;
use std::mem::size_of;
declare_id!("A7Tdre77QVqbznfgEgnaepZ7Ev2UCXequ6Taan2sEXCX");

const STARTING_POINTS: u32 = 10;

#[program]
pub mod day24 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.player.points = STARTING_POINTS;
        ctx.accounts.player.authority = ctx.accounts.signer.key();
        Ok(())
    }

    pub fn update_value(ctx: Context<UpdateValue>, amount: u32) -> Result<()> {
        ctx.accounts.from.points -= amount;
        ctx.accounts.to.points += amount;
        Ok(())
    }
}

#[error_code]
pub enum Errors {
    #[msg("SignerIsNotAuthority")]
    SignerIsNotAuthority,
    #[msg("InsufficientPoints")]
    InsufficientPoints,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init,
              payer = signer,
              space=size_of::<Player>() + 8,
              seeds = [&signer.key().to_bytes()],
              bump)]
    pub player: Account<'info, Player>,

    #[account(mut)]
    pub signer: Signer<'info>, // A public key is passed here

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u32)]
pub struct UpdateValue<'info> {
    #[account(mut, 
        has_one = authority @ Errors::SignerIsNotAuthority, 
        constraint = from.points >= amount  @ Errors::InsufficientPoints)]
    pub from: Account<'info, Player>,
    #[account(mut)]
    pub to: Account<'info, Player>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[account]
pub struct Player {
    points: u32,
    authority: Pubkey,
}
