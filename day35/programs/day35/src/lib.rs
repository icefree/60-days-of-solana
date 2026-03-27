use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{
    self, spl_token::instruction::AuthorityType, Mint, MintTo, SetAuthority, Token, TokenAccount,
    Transfer,
};

declare_id!("8RyXkXhN5ehrshHgbGc2hs39aZ3Nn6DVXgya5kNzYsZW");

#[program]
pub mod day35 {

    use super::*;

    pub fn create_and_mint_token(ctx: Context<CreateMint>) -> Result<()> {
        let mint_amount = 1_00_000_000_000;
        let mint = ctx.accounts.new_mint.clone();
        let destination_ata = ctx.accounts.new_ata.clone();
        let authority = ctx.accounts.signer.clone();
        let token_program = ctx.accounts.token_program.clone();

        let mint_to_instrction = MintTo {
            mint: mint.to_account_info(),
            to: destination_ata.to_account_info(),
            authority: authority.to_account_info(),
        };

        let cpi_context = CpiContext::new(token_program.to_account_info(), mint_to_instrction);
        token::mint_to(cpi_context, mint_amount)?;

        Ok(())
    }

    pub fn transfer_tokens(ctx: Context<TransferToken>, amount: u64) -> Result<()> {
        let transfer_instruction = Transfer {
            from: ctx.accounts.from_ata.to_account_info().clone(),
            to: ctx.accounts.to_ata.to_account_info().clone(),
            authority: ctx.accounts.authority.to_account_info().clone(),
        };

        let cpi_context = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );
        token::transfer(cpi_context, amount)?;

        Ok(())
    }

    pub fn get_balance(ctx: Context<GetBalance>) -> Result<()> {
        // Get the token account address, its owner & balance
        let ata_pubkey = ctx.accounts.token_account.key();
        let owner = ctx.accounts.token_account.owner; // the `owner` is a field in the ATA
        let balance = ctx.accounts.token_account.amount; // the `amount` is a field in the ATA

        // Print the balance information
        msg!("Token Account Address: {}", ata_pubkey);
        msg!("Token Account Owner: {}", owner);
        msg!("Token Account Balance: {}", balance);
        Ok(())
    }

    pub fn disable_mint_authority(ctx: Context<DisableMintAuthority>) -> Result<()> {
        let mint = ctx.accounts.mint.to_account_info();
        let authority = ctx.accounts.authority.to_account_info();
        let token_program = ctx.accounts.token_program.to_account_info();

        let set_authority_instruction = SetAuthority {
            current_authority: authority,
            account_or_mint: mint,
        };

        let cpi_context =
            CpiContext::new(token_program.to_account_info(), set_authority_instruction);
        token::set_authority(cpi_context, AuthorityType::MintTokens, None)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateMint<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        mint::decimals = 9,
        mint::authority = signer,
        mint::freeze_authority = signer,
        seeds = [b"my_mint", signer.key().as_ref()],
        bump
    )]
    pub new_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = signer,
        associated_token::mint = new_mint,
        associated_token::authority = signer,
    )]
    pub new_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferToken<'info> {
    pub from: Signer<'info>,
    #[account(mut)]
    pub from_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to_ata: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct GetBalance<'info> {
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
pub struct DisableMintAuthority<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
