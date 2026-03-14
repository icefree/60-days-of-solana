use anchor_lang::prelude::*;

declare_id!("G2QJKrueDmyVmT8T8Fp5aXQ5x8m1gRTTSRuNc7tq8LF4");

#[program]
pub mod day18 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn setx(ctx: Context<SetFlag>, x: u64) -> Result<()> {
        ctx.accounts.true_or_false.x = x;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    signer: Signer<'info>,

    system_program: Program<'info, System>,

    #[account(init, payer = signer, space = size_of::<TrueOrFalse>() + 8, seeds=[], bump)]
    true_or_false: Account<'info, TrueOrFalse>,
}

#[derive(Accounts)]
pub struct SetFlag<'info> {
    #[account(mut)]
    true_or_false: Account<'info, TrueOrFalse>,
}

#[account]
pub struct TrueOrFalse {
    x: u64,
}
