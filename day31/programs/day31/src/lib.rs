use anchor_lang::prelude::*;

declare_id!("Cmx9zLwfL5fBeGcbME45hk1Z3eboE7X7tXxifCUGPdar");

#[program]
pub mod day31 {
    use super::*;

    pub fn foo(ctx: Context<Foo>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn bar(ctx: Context<Bar>) -> Result<()> {
        let data = ctx.accounts.some_account.try_borrow_data()?;
        msg!("Data: {:?}", data);
        Ok(())
    }

    pub fn hello(ctx: Context<Hello>) -> Result<()> {
        let lamports = ctx.accounts.signer.lamports();
        let address = &ctx.accounts.signer.signer_key().unwrap();
        msg!("hello {:?} you have {} lamports", address, lamports);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Foo<'info> {
    some_account: Account<'info, SomeAccount>,
}

#[derive(Accounts)]
pub struct Bar<'info> {
    ///CHECK: just for demo
    some_account: AccountInfo<'info>,
}

#[account]
pub struct SomeAccount {}

#[derive(Accounts)]
pub struct Hello<'info> {
    pub signer: Signer<'info>,
}
