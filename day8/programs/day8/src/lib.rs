use anchor_lang::prelude::*;

// 1. Function-like macro (specifically, a declarative macro using macro_rules!)
macro_rules! say_hello {
    () => {
        msg!("Hello from the declarative macro!");
    };
}

declare_id!("EoVeBpo1PScLneDAkFS2d8gx9oJWDJqUgRydYgTnRpva"); // Built-in function-like (proc) macro

#[program] // 2. Attribute-like macro
pub mod day8 {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        say_hello!(); // Using our custom function-like macro
        msg!("Greetings from: {:?}", _ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)] // 3. Custom derive macro
pub struct Initialize {}
