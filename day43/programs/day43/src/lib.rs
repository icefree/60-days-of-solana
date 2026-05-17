use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    system_program,
    sysvar::instructions:: {
        load_instruction_at_checked,
        load_current_index_checked,
    },
    system_instruction::SystemInstruction,
};

declare_id!("HYydtjsciZz8nXd5HRkjZrWtUTvjfpXtsvxK1PVgGBQr");

#[program]
pub mod day43 {
    use super::*;

    pub fn initialize(ctx: Context<VerifyTransfer>, expected_amount: u64) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        let current_ix_index = load_current_index_checked(&ctx.accounts.instruction_sysvar)?;
        msg!("Currently executing instruction index: {}", current_ix_index);
       
        // Step 2: Load the previous instruction
        let transfer_ix = load_instruction_at_checked(
            (current_ix_index - 1) as usize,
            &ctx.accounts.instruction_sysvar
        ).map_err(|_| error!(ErrorCode::MissingInstruction))?;

        require_keys_eq!(transfer_ix.program_id, system_program::ID, ErrorCode::NotSystemProgram);

        let system_ix = bincode::deserialize(&transfer_ix.data)
            .map_err(|_| error!(ErrorCode::InvalidInstructionData))?;

        match system_ix {
            SystemInstruction::Transfer { lamports } => {
                require_eq!(lamports, expected_amount, ErrorCode::IncorrectAmount);
                msg!("✅ Verified transfer of {} lamports", lamports);
            }
            _ => return Err(error!(ErrorCode::NotTransferInstruction)),
        }

        // Step 5: Verify accounts involved in the transfer
        require_gte!(transfer_ix.accounts.len(), 2, ErrorCode::InsufficientAccounts);

        let from_account = &transfer_ix.accounts[0];
        let to_account = &transfer_ix.accounts[1];
        
        require!(from_account.is_signer, ErrorCode::FromAccountNotSigner);
        require!(from_account.is_writable, ErrorCode::FromAccountNotWritable);
        require!(to_account.is_writable, ErrorCode::ToAccountNotWritable);

        msg!("✅ Transfer accounts properly configured");
        msg!("From: {}", from_account.pubkey);
        msg!("To: {}", to_account.pubkey);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct VerifyTransfer<'info> {
    /// CHECK: This is the instruction sysvar account
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instruction_sysvar: AccountInfo<'info>,
}

#[error_code]
pub enum ErrorCode {
    /// Thrown when attempting to load an instruction at an index that doesn't exist
    /// in the transaction (e.g., trying to access index -1 when current is 0)
    #[msg("Missing required instruction in transaction")]
    MissingInstruction,
    
    /// Thrown when the previous instruction's program_id doesn't match the System Program
    /// Ensures we're only validating actual system program instructions
    #[msg("Instruction is not from System Program")]
    NotSystemProgram,
    
    /// Thrown when bincode fails to deserialize the instruction data into SystemInstruction
    /// Indicates malformed or corrupted instruction data
    #[msg("Invalid instruction data format")]
    InvalidInstructionData,
    
    /// Thrown when the SystemInstruction variant is not Transfer
    /// (e.g., it's CreateAccount, Allocate, or another system instruction type)
    #[msg("Instruction is not a transfer")]
    NotTransferInstruction,
    
    /// Thrown when the actual lamports amount in the transfer doesn't equal expected_amount
    /// Protects against front-running or incorrect payment amounts
    #[msg("Transfer amount does not match expected amount")]
    IncorrectAmount,
    
    /// Thrown when the transfer instruction has fewer than 2 accounts
    /// A valid transfer requires at least [from, to] accounts
    #[msg("Transfer instruction has insufficient accounts")]
    InsufficientAccounts,
    
    /// Thrown when the 'from' account in the transfer didn't sign the transaction
    /// Prevents unauthorized transfers
    #[msg("From account is not a signer")]
    FromAccountNotSigner,
    
    /// Thrown when the 'from' account is not marked as writable
    /// Required because the account balance will be debited
    #[msg("From account is not writable")]
    FromAccountNotWritable,
    
    /// Thrown when the 'to' account is not marked as writable
    /// Required because the account balance will be credited
    #[msg("To account is not writable")]
    ToAccountNotWritable,
}
