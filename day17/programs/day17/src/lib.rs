use anchor_lang::prelude::*;

declare_id!("HBYv98zd32rx9SnTQLgka8WH6NN99y2fe8wGUgKz2rJs");

#[program]
pub mod day17 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
    pub fn set(ctx: Context<Set>, new_x: i64) -> Result<()> {
        let my_storage = &mut ctx.accounts.my_storage;
        my_storage.x = new_x;
        msg!("the new x is {}", my_storage.x);
        Ok(())
    }

    pub fn print_x(ctx: Context<PrintX>) -> Result<()> {
        let x = ctx.accounts.my_storage.x;
        msg!("the x is {}", x);
        Ok(())
    }

    pub fn increase_x(ctx: Context<IncreaseX>) -> Result<()> {
        let my_storage = &mut ctx.accounts.my_storage;
        my_storage.x += 1;
        msg!("the new x is {}", my_storage.x);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Set<'info> {
    #[account(mut, seeds = [], bump)]
    pub my_storage: Account<'info, MyStorage>,
}

#[derive(Accounts)]
pub struct IncreaseX<'info> {
    #[account(mut, seeds = [], bump)]
    pub my_storage: Account<'info, MyStorage>,
}

#[derive(Accounts)]
pub struct PrintX<'info> {
    pub my_storage: Account<'info, MyStorage>,
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
