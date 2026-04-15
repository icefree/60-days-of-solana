use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022_extensions::{non_transferable_mint_initialize},
    token_interface::{
        mint_to,
        Mint,
        TokenAccount,
        TokenInterface
    },
};

declare_id!("FdtALzeeYCxLpjjqzxJVEj46MJmLfZVvyJy2fggv7DNm");

#[program]
pub mod day41 {
    use super::*;

    pub fn initialize(ctx: Context<InitializeCredentialMint>) -> Result<()> {
        // Initialize the NonTransferable extension.
        non_transferable_mint_initialize(CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token_2022_extensions::NonTransferableMintInitialize {
                mint: ctx.accounts.mint.to_account_info(),
                token_program_id: ctx.accounts.token_program.to_account_info(),
            },
        ))?;

        // Initialize the mint itself, setting decimals to 0 and defining authorities.
        anchor_spl::token_interface::initialize_mint2(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token_interface::InitializeMint2 {
                    mint: ctx.accounts.mint.to_account_info(),
                },
            ),
            0, // Decimals are set to 0 because credentials are whole units and cannot be fractional.
            &ctx.accounts.mint.key(),       // The mint authority is the program-derived address (PDA) itself.
            Some(&ctx.accounts.mint.key()), // The freeze authority is also the PDA.
        )?;

        Ok(())
    }

    pub fn issue_credential(ctx: Context<IssueCredential>) -> Result<()> {
        // Mint one token to the recipient's associated token account.
        // 1. 获取 Anchor 自动为 PDA 计算出的 bump 值
        let bump = ctx.bumps.mint;
        
        // 2. 构造 PDA 的签名种子 (seeds + bump)
        // 注意：格式必须是二维切片的切片 &[&[&[u8]]]
        let signer_seeds: &[&[&[u8]]] = &[&[b"mint", &[bump]]];
        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token_interface::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.recipient_ata.to_account_info(),
                    authority: ctx.accounts.mint.to_account_info(),
                },
                signer_seeds
            ),
            1, // Mint exactly one token.
        )?;

        Ok(())
    }

}

/// Defines the accounts required for the `initialize_credential_mint` instruction.
#[derive(Accounts)]
pub struct InitializeCredentialMint<'info> {
    // The mint account to be initialized as a Program Derived Address (PDA).
    ///CHECK
    #[account(
        init,
        payer = payer,
        // The space allocation for the account's data:
        // 8 bytes: for the account discriminator, a unique identifier for the account type in Anchor.
        // 82 bytes: the standard fixed size of a SPL Token Mint account.
        // 8 bytes: additional space reserved for the NonTransferable extension.
        space = 165 + 1 + 4,
        owner = token_program.key(),
        // Defines the seeds for the Program Derived Address (PDA).
        seeds = [b"mint"],
        bump
    )]
    pub mint: UncheckedAccount<'info>,

    // The account paying for the transaction and rent.
    #[account(mut)]
    pub payer: Signer<'info>,

    // System program, required for creating accounts.
    pub system_program: Program<'info, System>,
    // The SPL token program.
    pub token_program: Interface<'info, TokenInterface>,
}

/// Defines the accounts required for the `issue_credential` instruction.
#[derive(Accounts)]
pub struct IssueCredential<'info> {
    // The mint account, must be mutable.
    #[account(
        mut,
        seeds = [b"mint"],
        bump, )]
    pub mint: InterfaceAccount<'info, Mint>,

    // The authority signing the transaction (must be the mint authority).
    #[account(mut)]
    pub authority: Signer<'info>,

    // The recipient's associated token account, created if it doesn't exist.
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = recipient,
        associated_token::token_program = token_program
    )]
    pub recipient_ata: InterfaceAccount<'info, TokenAccount>,

    // The recipient of the credential.
    pub recipient: SystemAccount<'info>,

    // The SPL token program.
    pub token_program: Interface<'info, TokenInterface>,
    // The associated token program.
    pub associated_token_program: Program<'info, AssociatedToken>,
    // The system program.
    pub system_program: Program<'info, System>,
}