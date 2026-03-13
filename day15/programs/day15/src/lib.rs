use anchor_lang::prelude::*;

declare_id!("BCciyGgTwDcKdSJcd4UKwg43JQz1HjVuDi9qCeCumChZ");

#[program]
pub mod day15 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        //Notice the reduction in compute unit cost as the integer type reduced.
        //use find_program_address() off-chain and pass the resulting bump seed to the program when possible
        // this costs 481 CU (type defaults to Vec<i32>)
        let mut a = Vec::new();
        a.push(1);
        a.push(1);
        a.push(1);
        a.push(1);
        a.push(1);
        a.push(1);

        // // // // this costs 480 CU
        // let mut a: Vec<u64> = Vec::new();
        // a.push(1);
        // a.push(1);
        // a.push(1);
        // a.push(1);
        // a.push(1);
        // a.push(1);

        // // this costs 481 CU (same as the first one but the type was explicitly denoted)
        // let mut a: Vec<i32> = Vec::new();
        // a.push(1);
        // a.push(1);
        // a.push(1);
        // a.push(1);
        // a.push(1);
        // a.push(1);

        // // this costs 480  CU (takes the same space as u64)
        // let mut a: Vec<i64> = Vec::new();
        // a.push(1);
        // a.push(1);
        // a.push(1);
        // a.push(1);
        // a.push(1);
        // a.push(1);

        // // this costs 371 CU
        // let mut a: Vec<u8> = Vec::new();
        // a.push(1);
        // a.push(1);
        // a.push(1);
        // a.push(1);
        // a.push(1);
        // a.push(1);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
