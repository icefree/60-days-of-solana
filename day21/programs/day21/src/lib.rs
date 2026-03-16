use anchor_lang::prelude::*;

declare_id!("3ctNjDas7VvsZ5jPoKdfrmB1Lr1tbt48mb8MW1QVsF45");

#[program]
pub mod day21 {
    use super::*;

    pub fn readBalance(ctx: Context<ReadBalance>) -> Result<()> {
        let balance = ctx.accounts.acct.lamports();
        msg!("Balance: {}", balance);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ReadBalance<'info> {
    //AccountInfo and UncheckedAccount are aliases for each other
    /// CHECK: We are not doing any checks on this account, just reading the balance
    pub acct: AccountInfo<'info>,
}
