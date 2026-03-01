use anchor_lang::prelude::*;

declare_id!("8TDYjBPJ1jtpQ3k98Q6HCXhRAamX1WTWeRLfS6UqgvCJ");

#[program]
pub mod day1 {
    use super::*;

    pub fn initialize2(ctx: Context<Initialize>) -> Result<()> {
        msg!("Hello, World!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
