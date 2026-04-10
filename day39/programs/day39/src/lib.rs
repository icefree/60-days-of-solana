use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use mpl_token_metadata::instructions::{
    CreateMetadataAccountV3Cpi, CreateMetadataAccountV3CpiAccounts,
    CreateMetadataAccountV3InstructionArgs,
};
use mpl_token_metadata::types::{Creator, DataV2};
use mpl_token_metadata::ID as METADATA_PROGRAM_ID;

declare_id!("GmiwQSaxjywG1cxdDraPqyBuVK1yTLwuehDF7dGNS6HM");

#[program]
pub mod day39 {
    use super::*;
    
    pub fn create_token_metadata(
        ctx: Context<CreateTokenMetadata>,
        name: String,
        symbol: String,
        uri: String,
        seller_fee_basis_points: u16,
        is_mutable: bool,
    ) -> Result<()> {
		// Create metadata instruction arguments using the Fungible Standard format
        // This follows the token_standard = 2 format we discussed earlier
        let data = DataV2 {
            name,
            symbol,
            uri, // Points to JSON with name, symbol, description, and image
            seller_fee_basis_points,
            creators: Some(vec![Creator {
                address: ctx.accounts.payer.key(),
                verified: true,
                share: 100,
            }]),
            collection: None,
            uses: None,
        };

        // Find the metadata account address (PDA)
        let mint_key = ctx.accounts.mint.key();
        let seeds = &[
            b"metadata".as_ref(),
            METADATA_PROGRAM_ID.as_ref(),
            mint_key.as_ref(),
        ];
        let (metadata_pda, _) = Pubkey::find_program_address(seeds, &METADATA_PROGRAM_ID);

        // Ensure the provided metadata account matches the PDA
        require!(
            metadata_pda == ctx.accounts.metadata.key(),
            MetaplexError::InvalidMetadataAccount
        );
        
        // Create and execute the CPI to create metadata
        let token_metadata_program_info = ctx.accounts.token_metadata_program.to_account_info();
        let metadata_info = ctx.accounts.metadata.to_account_info();
        let mint_info = ctx.accounts.mint.to_account_info();
        let authority_info = ctx.accounts.authority.to_account_info();
        let payer_info = ctx.accounts.payer.to_account_info();
        let system_program_info = ctx.accounts.system_program.to_account_info();
        let rent_info = ctx.accounts.rent.to_account_info();

        let cpi = CreateMetadataAccountV3Cpi::new(
            &token_metadata_program_info,
            CreateMetadataAccountV3CpiAccounts {
                metadata: &metadata_info,
                mint: &mint_info,
                mint_authority: &authority_info,
                payer: &payer_info,
                update_authority: (&authority_info, true),
                system_program: &system_program_info,
                rent: Some(&rent_info),
            },
            CreateMetadataAccountV3InstructionArgs {
                data,
                is_mutable,
                collection_details: None,
            },
        );
        cpi.invoke()?;
        Ok(())
    }
}


#[derive(Accounts)]
    pub struct CreateTokenMetadata<'info> {
        /// CHECK: metadata PDA (will be created by the Metaplex Token Metadata program via CPI in the create_token_metadata function)
        #[account(mut)]
        pub metadata: AccountInfo<'info>,

        // The mint account of the token
        #[account(mut)]
        pub mint: Account<'info, Mint>,

        // The mint authority of the token
        pub authority: Signer<'info>,

        // The account paying for the transaction
        #[account(mut)]
        pub payer: Signer<'info>,

        // Onchain programs our code depends on
        pub system_program: Program<'info, System>,
        pub rent: Sysvar<'info, Rent>,

        /// CHECK: This is the Metaplex Token Metadata program
        #[account(address = METADATA_PROGRAM_ID)]
        // constraint to ensure the right account is passed
        pub token_metadata_program: AccountInfo<'info>,
    }

    #[error_code]
    pub enum MetaplexError {
        #[msg("The provided metadata account does not match the PDA for this mint")]
        InvalidMetadataAccount,
    }