use anchor_lang::prelude::*;

declare_id!("AMRBdQ3RFV4sTSoGT9VWdkMg8VirJXbhy4pRR7bUoXbQ");

#[program]
pub mod day12 {
    use super::*;
    use anchor_lang::solana_program::sysvar::{
        instructions, last_restart_slot::LastRestartSlot, recent_blockhashes::RecentBlockhashes,
    };

    pub fn initialize(ctx: Context<Initialize>, number: u32) -> Result<()> {
        let clock = Clock::get()?;
        msg!(
            "Current time: unix_timestamp: {}, slot: {}",
            clock.unix_timestamp,
            clock.slot
        );

        let epoch_schedule = EpochSchedule::get()?;
        msg!(
            "Epoch schedule: slots_per_epoch: {}",
            epoch_schedule.slots_per_epoch
        );

        let rent_var = Rent::get()?;
        msg!(
            "Rent: lamports_per_byte_year: {}",
            rent_var.lamports_per_byte_year
        );

        let stake_history_account = &ctx.accounts.stake_history;
        let _stake_history = StakeHistory::from_account_info(stake_history_account)?;
        // msg!("Stake history {:?}", _stake_history);// "Program log: Error: memory allocation failed, out of memory",

        let recent_blockhashes_account = &ctx.accounts.recent_blockhashes;
        let recent_blockhashes = RecentBlockhashes::from_account_info(recent_blockhashes_account)?;
        // msg!("Recent blockhashes count: {:?}", recent_blockhashes);

        let instruction_sysvar_account = &ctx.accounts.instruction_sysvar;
        let instruction_details =
            instructions::load_instruction_at_checked(0, instruction_sysvar_account)?;

        // msg!("Instruction program_id: {:?}", instruction_details);
        msg!("Number is: {}", number);

        let last_restart_sysvar_account = &ctx.accounts.last_restart_sysvar;
        let last_restart_sysvar = LastRestartSlot::from_account_info(last_restart_sysvar_account)?;
        msg!("Last restart sysvar: {:?}", last_restart_sysvar);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// CHECK:
    pub stake_history: AccountInfo<'info>,
    /// CHECK:
    pub recent_blockhashes: AccountInfo<'info>,
    /// CHECK:
    pub instruction_sysvar: AccountInfo<'info>,
    /// CHECK:
    pub last_restart_sysvar: AccountInfo<'info>,
}
