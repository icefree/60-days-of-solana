use anchor_lang::prelude::*;

pub mod calculate;

declare_id!("Ff65FagXDMFRr6m7boyTmjNd3vEqbAP5rMEhCSnNvyp2");

#[program]
pub mod day10 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        let a_num = get_a_num();
        msg!("A number: {}", a_num);
        let result = calculate::add(a_num, 2);
        msg!("Result: {}", result);
        let result2 = calculate2::add(a_num, 3);
        msg!("Result2: {}", result2);

        some_internal_funciton::internal_function();
        Ok(())
    }

    pub mod some_internal_funciton {
        use super::*;
        pub(in crate::day10) fn internal_function2() {
            msg!("Hello from internal function");
        }
        pub fn internal_function() {
            msg!("Hello from internal function");
        }
    }
}

mod do_something {
    use crate::day10;
    pub fn some_func_here() {
        day10::some_internal_funciton::internal_function();
        // day10::some_internal_funciton::internal_function2();
    }
}

mod calculate2 {
    pub fn add(x: u64, y: u64) -> u64 {
        x + y
    }
}

fn get_a_num() -> u64 {
    42
}

#[derive(Accounts)]
pub struct Initialize {}
