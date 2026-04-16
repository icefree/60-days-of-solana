use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, CreateAccount};
use anchor_spl::{
    token_2022::{
        initialize_mint2,
        spl_token_2022::{
            extension::{ExtensionType},
            pod::PodMint,

        },
        InitializeMint2, Token2022,
    },
    token_interface::{Mint, TokenAccount, mint_to, MintTo},
    token_2022_extensions::interest_bearing_mint::{
        interest_bearing_mint_initialize,
        interest_bearing_mint_update_rate,
        InterestBearingMintInitialize,
        InterestBearingMintUpdateRate,
    },
};

declare_id!("2Jtgd1qUu3j8hzZH4w1RApKfTHJiprFTojyf8VumyewP");

#[program]
pub mod day42 {
    use super::*;
    pub fn create_interest_bearing_mint( ctx: Context<CreateInterestBearingMint>,
        rate_bps: i16,
        decimals: u8,) -> Result<()> { 
        let mint_size = ExtensionType::try_calculate_account_len::<PodMint>(&[ExtensionType::InterestBearingConfig])?;
        msg!("Mint size: {mint_size}");

        // 2) Create the mint account with correct space and rent
        let lamports = Rent::get()?.minimum_balance(mint_size);
        system_program::create_account(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    CreateAccount {
                        from: ctx.accounts.payer.to_account_info(),
                        to: ctx.accounts.mint.to_account_info(),
                    },
                ),
                lamports,
                mint_size as u64,
                &ctx.accounts.token_program.key(),
        )?;

        // 3) Initialize the interest-bearing extension BEFORE base mint init
        interest_bearing_mint_initialize(
            CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
                InterestBearingMintInitialize {
                token_program_id: ctx.accounts.token_program.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                },
            ),
            Some(ctx.accounts.rate_authority.key()),
            rate_bps,
        )?;


         // 4) Initialize base mint (decimals, authorities)
        let mint_auth_bump = ctx.bumps.mint_authority;
        let signer_seeds: &[&[&[u8]]] = &[&[b"mint-authority", &[mint_auth_bump]]];

        initialize_mint2(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                InitializeMint2 {
                    mint: ctx.accounts.mint.to_account_info(),
                },
                signer_seeds,
            ),
            decimals,
            &ctx.accounts.mint_authority.key(),
            Some(&ctx.accounts.mint_authority.key()),
        )?;

        Ok(())
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {

        // Fetch the bump for the PDA so we can recreate the same signer seeds
        let bump = ctx.bumps.mint_authority;
        let signer_seeds: &[&[&[u8]]] = &[&[b"mint-authority", &[bump]]];

        // Call into the Token-2022 program to mint tokens
        // `CpiContext::new_with_signer` lets us pass the PDA seeds so the runtime
        // can treat the PDA as if it signed the instruction
        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    // Mint account whose supply will increase
                    mint: ctx.accounts.mint.to_account_info(),
                    // Recipient’s token account that will receive the minted tokens
                    to: ctx.accounts.to_token_account.to_account_info(),
                    // PDA that acts as mint authority
                    authority: ctx.accounts.mint_authority.to_account_info(),
                },
                signer_seeds,
            ),
            amount, // Number of tokens to mint
        )?;

        Ok(())
    }

        pub fn update_rate(ctx: Context<UpdateRate>, new_rate_bps: i16) -> Result<()> {
        msg!("Update interest rate -> {} bps", new_rate_bps);

        // Call into the Token-2022 program to update interest rate on the mint
        // The CPI will check that the provided rate_authority signer matches the
        // authority configured in the mint's extension data
        interest_bearing_mint_update_rate(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                InterestBearingMintUpdateRate {
                    token_program_id: ctx.accounts.token_program.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    rate_authority: ctx.accounts.rate_authority.to_account_info(),
                },
            ),
            new_rate_bps, // new interest rate in basis points (1% = 100 bps)
        )?;

        Ok(())
    }


}

#[derive(Accounts)]
pub struct CreateInterestBearingMint<'info> {
    /// CHECK: This account is created manually as a Token-2022 mint with extensions.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: PDA account used as mint and freeze authority
    #[account(
        seeds = [b"mint-authority"],
        bump
    )]
    pub mint_authority: UncheckedAccount<'info>,

    /// Raw mint account to be created with extension space
    /// CHECK: We trust the token program to validate this is a proper mint account.
    #[account(mut, signer)]
    pub mint: UncheckedAccount<'info>,

    /// Token-2022 program
    pub token_program: Program<'info, Token2022>,

    pub system_program: Program<'info, System>,
    /// Signer that will control interest rate updates
    pub rate_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    /// CHECK: PDA authority must match the seed used during mint init
    #[account(
        seeds = [b"mint-authority"],
        bump
    )]
    /// CHECK: This is the mint authority PDA we created during mint init.
    pub mint_authority: UncheckedAccount<'info>,

    /// Use token_interface to bind this Mint to Token2022 program
    /// CHECK: We trust the token program to validate this is a proper mint account.
    #[account(mut, mint::token_program = token_program)]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(mut, token::mint = mint, token::authority = recipient)]
    pub to_token_account: InterfaceAccount<'info, TokenAccount>,

    pub recipient: Signer<'info>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct UpdateRate<'info> {
    /// CHECK: This is the mint account we’re updating. We rely on Token-2022
    /// program logic to validate its data, so Anchor does not need to enforce checks here.
    #[account(mut, mint::token_program = token_program)]
    pub mint: InterfaceAccount<'info, Mint>,

    /// Must sign and match the extension’s configured rate authority
    pub rate_authority: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
}

