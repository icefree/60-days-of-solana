use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("4MukxqnifytfYSkgkuFNWEuXDtWjSdDwRWWqy23P3MRM");

#[program]
pub mod day23 {
    use super::*;

    pub fn send_sol<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, SendSol<'info>>,
        amount: u64,
    ) -> Result<()> {
        // let cpi_context = CpiContext::new(
        //     ctx.accounts.system_program.to_account_info(),
        //     system_program::Transfer {
        //         from: ctx.accounts.signer.to_account_info(),
        //         to: ctx.accounts.recipient1.to_account_info(),
        //     },
        // );
        // let cpi_context2 = CpiContext::new(
        //     ctx.accounts.system_program.to_account_info(),
        //     system_program::Transfer {
        //         from: ctx.accounts.signer.to_account_info(),
        //         to: ctx.accounts.recipient2.to_account_info(),
        //     },
        // );
        // let res = system_program::transfer(cpi_context, amount);
        // let res2 = system_program::transfer(cpi_context2, amount);
        // if res.is_ok() && res2.is_ok() {
        //     Ok(())
        // } else {
        //     err!(Errors::TransferFailed)
        // }
        let amount_each_gets = amount / ctx.remaining_accounts.len() as u64;
        for account in ctx.remaining_accounts {
            let cpi_context = CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.signer.to_account_info(),
                    to: account.to_account_info(),
                },
            );
            let res = system_program::transfer(cpi_context, amount_each_gets);
            if res.is_err() {
                return err!(Errors::TransferFailed);
            }
        }
        Ok(())
    }
}

#[error_code]
pub enum Errors {
    #[msg("transfer failed")]
    TransferFailed,
}

#[derive(Accounts)]
pub struct SendSol<'info> {
    /// CHECK: We are not doing anything with this account other than sending sol to it.
    // #[account(mut)]
    // pub recipient1: AccountInfo<'info>,
    /// CHECK: We are not doing anything with this account other than sending sol to it.
    // #[account(mut)]
    // pub recipient2: AccountInfo<'info>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
