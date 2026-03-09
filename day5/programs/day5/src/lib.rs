use anchor_lang::prelude::*;

declare_id!("CQyxz1ovGPPaeULtNtMCRNcvg5G4fnK56iQ7RYPWG4mj");

#[program]
pub mod day5 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        msg!("Hello Version2");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
