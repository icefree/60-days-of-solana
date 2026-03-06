use anchor_lang::prelude::*;

declare_id!("9q5QiDMuHgiVPi9caANaiPGpfi4zv6tousZ6Zjf31v6a");

#[program]
pub mod day2 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, a: u64, b: u64, message: String) -> Result<()> {
        msg!("You said {:?}", message);
        msg!("You sent {} and {}", a, b);
        let result = a.checked_sub(b).unwrap();
        msg!("a - b = {}", result);
        msg!("a ^ 2 = {}", a.checked_pow(2).unwrap());
        Ok(())
    }

    pub fn cbrt(ctx: Context<Initialize>, a: f32) -> Result<()> {
        msg!("a.cbrt() = {}", a.cbrt());
        Ok(())
    }

    pub fn array(ctx: Context<Initialize>, arr: Vec<u64>) -> Result<()> {
        msg!("Your array {:?}", arr);
        Ok(())
    }

    // 在这里添加外部入口，去调用内部模块
    pub fn add(ctx: Context<Initialize>, a: u64, b: u64) -> Result<()> {
        calculator::add(a, b);
        Ok(())
    }
    pub fn sub(ctx: Context<Initialize>, a: u64, b: u64) -> Result<()> {
        calculator::sub(a, b);
        Ok(())
    }
    pub fn mul(ctx: Context<Initialize>, a: u64, b: u64) -> Result<()> {
        calculator::mul(a, b);
        Ok(())
    }
    pub fn div(ctx: Context<Initialize>, a: u64, b: u64) -> Result<()> {
        calculator::div(a, b);
        Ok(())
    }
    pub fn sqrt(ctx: Context<Initialize>, a: f64) -> Result<()> {
        calculator::sqrt(a);
        Ok(())
    }
    pub fn log10(ctx: Context<Initialize>, a: f64) -> Result<()> {
        calculator::log10(a);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

pub mod calculator {
    use super::*;
    // 内部函数其实不需要 ctx，也不需要对外暴露，去掉它可以避免 unused variable 警告
    pub fn add(a: u64, b: u64) -> u64 {
        let result = a.checked_add(b).unwrap();
        msg!("{} + {} = {}", a, b, result);
        result
    }
    pub fn sub(a: u64, b: u64) -> u64 {
        let result = a.checked_sub(b).unwrap();
        msg!("{} - {} = {}", a, b, result);
        result
    }
    pub fn mul(a: u64, b: u64) -> u64 {
        let result = a.checked_mul(b).unwrap();
        msg!("{} * {} = {}", a, b, result);
        result
    }
    pub fn div(a: u64, b: u64) -> u64 {
        let result = a.checked_div(b).unwrap();
        msg!("{} / {} = {}", a, b, result);
        result
    }
    pub fn sqrt(a: f64) -> f64 {
        let result = a.sqrt();
        msg!("{} sqrt() = {}", a, result);
        result
    }
    pub fn log10(a: f64) -> f64 {
        let result = a.log10();
        msg!("{} log10() = {}", a, result);
        result
    }
}
