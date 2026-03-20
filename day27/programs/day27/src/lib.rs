use anchor_lang::prelude::*;
use std::mem::size_of;
use anchor_lang::system_program;

declare_id!("6VThX7DmWy9rmbtEaseXp8r9yLoj1n26G5944NhRMfye");

#[program]
pub mod day27 {
    use super::*;

    pub fn increment(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.counter.count += 1;
        Ok(())
    }

    pub fn initialize(ctx: Context<Initialize2>) -> Result<()> {
        Ok(())
    }

    pub fn drain_lamports(ctx: Context<DrainLamports>) -> Result<()> {
        let lamports_to_transfer = ctx.accounts.counter.to_account_info().lamports();
        ctx.accounts.counter.sub_lamports(lamports_to_transfer);
        ctx.accounts.signer.add_lamports(lamports_to_transfer);
        Ok(())
    }

    pub fn give_to_system_program(ctx: Context<GiveToSystemProgram>) -> Result<()> {
        let account_info = &mut ctx.accounts.counter.to_account_info();
        account_info.assign(&system_program::ID);
        account_info.realloc(0, false)?;
        Ok(())
    }

    pub fn initialize3(ctx: Context<Initialize3>) -> Result<()> {
        Ok(())
    }

    pub fn erase(ctx: Context<Erase>) -> Result<()> {
        ctx.accounts.my_pda.realloc(0, false)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct DrainLamports<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub signer: Signer<'info>
}

#[derive(Accounts)]
pub struct GiveToSystemProgram<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init_if_needed, 
        payer = signer, 
        space = size_of::<Counter>() + 8, 
        seeds=[], 
        bump
    )]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Initialize2<'info> {
    #[account(
        init, 
        payer = signer, 
        space = size_of::<Counter>() + 8, 
        seeds=["1".as_bytes()], 
        bump
    )]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Counter {
    pub count: u64,
}

#[derive(Accounts)]
pub struct Erase<'info> {
    /// CHECK: We are going to erase the account
    #[account(mut)]
    pub my_pda: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct Initialize3<'info> {
    #[account(init, payer = signer, space = 8, seeds = ["2".as_bytes()], bump)]
    pub my_pda: Account<'info, MyPDA>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct MyPDA {}