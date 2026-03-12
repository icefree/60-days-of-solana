use anchor_lang::prelude::*;

declare_id!("7R1JjJD3P4WH8NfBYVyDVL3Zhh7zD8F2nMFbvtqV5jD6");

#[program]
pub mod day13 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        emit!(MyEvent { value: 123 });
        emit!(MySecondEvent {
            value: 456,
            message: "Hello".to_string()
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[event]
pub struct MyEvent {
    pub value: u64,
}

#[event]
pub struct MySecondEvent {
    pub value: u64,
    pub message: String,
}
