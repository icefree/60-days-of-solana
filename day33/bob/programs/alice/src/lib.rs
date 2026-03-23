use anchor_lang::prelude::*;
use bob::cpi::accounts::BobAddOp;
use bob::program::Bob;
use bob::BobData;

declare_id!("J5k5dZyPVzACVDQZ5aBDymBjTpi3BSQMFF4WoX4SrZ77");

#[program]
pub mod alice {
    use super::*;

    pub fn ask_bob_to_add(ctx: Context<AliceOp>, a: u64, b: u64) -> Result<()> {
        let res = bob::cpi::add_and_store(ctx.accounts.add_function_ctx(), a, b);

        // return an error if the CPI failed
        if res.is_ok() {
            return Ok(());
        } else {
            return err!(Errors::CPIToBobFailed);
        }
    }
}

#[error_code]
pub enum Errors {
    #[msg("cpi to bob failed")]
    CPIToBobFailed,
}

#[derive(Accounts)]
pub struct AliceOp<'info> {
    #[account(mut)]
    pub bob_data_account: Account<'info, BobData>,

    pub bob_program: Program<'info, Bob>,
}

impl<'info> AliceOp<'info> {
    pub fn add_function_ctx(&self) -> CpiContext<'_, '_, '_, 'info, BobAddOp<'info>> {
        // The bob program we are interacting with
        let cpi_program = self.bob_program.to_account_info();

        // Passing the necessary account(s) to the `BobAddOp` account struct in Bob program
        let cpi_account = BobAddOp {
            bob_data_account: self.bob_data_account.to_account_info(),
        };

        // Creates a `CpiContext` object using the new method
        CpiContext::new(cpi_program, cpi_account)
    }
}
