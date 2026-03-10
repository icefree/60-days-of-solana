use anchor_lang::prelude::*;

declare_id!("EoVeBpo1PScLneDAkFS2d8gx9oJWDJqUgRydYgTnRpva"); //function like macro

#[program] // attribute like macro
pub mod day8 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)] //custom derive macro
pub struct Initialize {}
