use anchor_lang::prelude::*;

declare_id!("7fJSCPWnFH8NsjEFt6gNwAwtMLmw2whhpPF2Q43Q4F5Y");

#[program]
pub mod anchor_function_tutorial {
    use super::*;

    pub fn boaty_mc_boatface(ctx: Context<Empty>) -> Result<()> {
        Ok(())
    }

    pub fn function_a(ctx: Context<NonEmptyAccountExample>) -> Result<()> {
        Ok(())
    }

    pub fn function_b(ctx: Context<Empty>, firstArg: u64) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct NonEmptyAccountExample<'info> {
    signer: Signer<'info>,
    another_signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct Empty {}
