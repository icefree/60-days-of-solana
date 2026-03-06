use anchor_lang::prelude::*;

declare_id!("7Ey4wb7AYvKLRrNKYAh8pWjkfeQ867zc7H6FuXFrAsvu");

#[program]
pub mod day4 {
    use super::*;

    pub fn limit_range(ctxThen: Context<LimitRange>, a: u64) -> Result<()> {
        require!(a >= 10, MyError::AisTooSmall);
        require!(a <= 100, MyError::AisTooBig);
        msg!("Result = {}", a);
        Ok(())
    }

    // NEW FUNCTION
    pub fn func(ctx: Context<ReturnError>) -> Result<()> {
        msg!("Will this print?");
        return err!(MyError::AlwaysErrors);
    }
}

#[derive(Accounts)]
pub struct ReturnError {}

#[derive(Accounts)]
pub struct LimitRange {}

#[error_code]
pub enum MyError {
    #[msg("a is too small")]
    AisTooSmall,
    #[msg("a is too big")]
    AisTooBig,
    #[msg("Always errors")] // NEW ERROR, what do you think the error code will be?
    AlwaysErrors,
}
