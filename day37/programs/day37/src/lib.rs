use anchor_lang::prelude::*;
use anchor_lang::solana_program::program as solana_program;
use anchor_lang::solana_program::rent::Rent;
use anchor_lang::solana_program::system_instruction;

declare_id!("yFRnSFkpT5E7NdfeLA8w7HudWVmv41EJUSoiD9YV2Fd");

#[program]
pub mod basic_bank {
    use anchor_lang::system_program::{transfer, Transfer};

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.bank.total_deposits = 0;
        Ok(())
    }

    pub fn create_user_account(ctx: Context<CreateUserAccount>) -> Result<()> {
        ctx.accounts.user_account.owner = ctx.accounts.user.key();
        ctx.accounts.user_account.balance = 0;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, BankError::ZeroAmount);

        let bank = &ctx.accounts.bank.key();
        let user = &ctx.accounts.user.key();

        let tx = system_instruction::transfer(user, bank, amount);
        solana_program::invoke(
            &tx,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.bank.to_account_info(),
            ],
        )?;

        // let cpi_context = CpiContext::new(
        //     ctx.accounts.system_program.to_account_info(),
        //     Transfer {
        //         from: ctx.accounts.user.to_account_info(),
        //         to: ctx.accounts.bank.to_account_info(),
        //     },
        // );
        // transfer(cpi_context, amount)?;

        ctx.accounts.user_account.balance = ctx
            .accounts
            .user_account
            .balance
            .checked_add(amount)
            .ok_or(BankError::Overflow)?;

        ctx.accounts.bank.total_deposits = ctx
            .accounts
            .bank
            .total_deposits
            .checked_add(amount)
            .ok_or(BankError::Overflow)?;

        msg!("Deposited {} lamports for {}", amount, user);
        Ok(())
    }

    pub fn balance(ctx: Context<GetBalance>) -> Result<u64> {
        let user_account = &ctx.accounts.user_account;
        msg!("User balance: {}", user_account.balance);
        Ok(user_account.balance)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        require!(amount > 0, BankError::ZeroAmount);
        require!(
            ctx.accounts.user_account.balance >= amount,
            BankError::InsufficientBalance
        );

        let bank = &ctx.accounts.bank.key();
        let user = &ctx.accounts.user.key();

        // The bank account must keep enough lamports to stay rent-exempt,
        // otherwise the runtime will garbage-collect it.
        let rent = Rent::get()?;
        let bank_account_info = ctx.accounts.bank.to_account_info();
        let minimum_balance = rent.minimum_balance(bank_account_info.data_len());

        // Only transfer what the bank can afford after reserving rent.
        // Cap at the requested amount so we never send more than asked.
        let available_lamports = bank_account_info.lamports();
        let transfer_amount = amount.min(available_lamports.saturating_sub(minimum_balance));

        // Transfer SOL: subtract from bank account and add to user wallet
        **bank_account_info.try_borrow_mut_lamports()? -= transfer_amount;
        **ctx.accounts.user.try_borrow_mut_lamports()? += transfer_amount;

        msg!("Withdrawn {} lamports for {}", amount, user);

        ctx.accounts.user_account.balance = ctx
            .accounts
            .user_account
            .balance
            .checked_sub(amount)
            .ok_or(BankError::Overflow)?;

        ctx.accounts.bank.total_deposits = ctx
            .accounts
            .bank
            .total_deposits
            .checked_sub(amount)
            .ok_or(BankError::Overflow)?;

        Ok(())
    }
}

// ACCOUNT STRUCT TO CREATE THE BANK PDA TO STORE TO
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + Bank::INIT_SPACE)] // discriminator + u64
    pub bank: Account<'info, Bank>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ACCOUNT STRUCT FOR CREATING INDIVIDUAL USER ACCOUNT
#[derive(Accounts)]
pub struct CreateUserAccount<'info> {
    #[account(mut)]
    pub bank: Account<'info, Bank>,

    #[account(
        init,
        payer = user,
        space = 8 + UserAccount::INIT_SPACE, // discriminator + pubkey + u64
        seeds = [b"user-account", user.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// BANK ACCOUNT TO TRACK TOTAL DEPOSITS ACROSS ALL USERS
#[account]
#[derive(InitSpace)]
pub struct Bank {
    pub total_deposits: u64,
}

// USER-SPECIFIC ACCOUNT TO TRACK INDIVIDUAL USER BALANCES
#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    pub owner: Pubkey,
    pub balance: u64,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub bank: Account<'info, Bank>,

    #[account(mut,
        seeds = [b"user-account", user.key().as_ref()],
        bump,
        constraint = user_account.owner == user.key() @ BankError::UnauthorizedAccess
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum BankError {
    #[msg("Zero Amount")]
    ZeroAmount,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Overflow")]
    Overflow,
    #[msg("Unauthorized access")]
    UnauthorizedAccess,
}

#[derive(Accounts)]
pub struct GetBalance<'info> {
    #[account(
        seeds = [b"user-account", user.key().as_ref()],
        bump,
        constraint = user_account.owner == user.key() @ BankError::UnauthorizedAccess
    )]
    pub user_account: Account<'info, UserAccount>,

    /// CHECK:
    pub user: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub bank: Account<'info, Bank>,

    #[account(mut,
        seeds = [b"user-account", user.key().as_ref()],
        bump,
        constraint = user_account.owner == user.key() @ BankError::UnauthorizedAccess
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
