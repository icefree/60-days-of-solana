use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("3xJiNu8y8vEN5Zk3A2QJUyeUZogNnYqLKpVztU5fZesZ");

#[program]
pub mod other_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn set(ctx: Context<Set>, new_flag: bool) -> Result<()> {
        let true_or_false = &mut ctx.accounts.true_or_false;
        true_or_false.flag = new_flag;
        msg!("the new flag is {}", true_or_false.flag);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, space = 8 + size_of::<TrueOrFalse>(), seeds = [], bump)]
    pub true_or_false: Account<'info, TrueOrFalse>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Set<'info> {
    #[account(mut)]
    pub true_or_false: Account<'info, TrueOrFalse>,
}

#[account]
pub struct TrueOrFalse {
    flag: bool,
}
