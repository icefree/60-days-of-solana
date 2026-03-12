use anchor_lang::prelude::*;

declare_id!("HfGF1CTu28Y1VKALddCfcHdB8oudjHV2ZzBkqmGCbstz");

#[program]
pub mod day11 {
    use super::*;
    use anchor_lang::solana_program::sysvar::recent_blockhashes::RecentBlockhashes;
    use chrono::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let clock: Clock = Clock::get()?;
        msg!("Current timestamp: {}", clock.unix_timestamp);

        // RECENT BLOCK HASHES
        let arr = [ctx.accounts.recent_blockhashes.clone()];
        let accounts_iter = &mut arr.iter();
        let sh_sysvar_info = next_account_info(accounts_iter)?;
        let recent_blockhashes = RecentBlockhashes::from_account_info(sh_sysvar_info)?;
        let data = recent_blockhashes.last().unwrap();

        msg!("The recent block hash is: {:?}", data.blockhash);

        Ok(())
    }

    pub fn get_day_of_the_week(_ctx: Context<Initialize>) -> Result<()> {
        let clock = Clock::get()?;
        let time_stamp = clock.unix_timestamp; // current timestamp

        let date_time = chrono::NaiveDateTime::from_timestamp_opt(time_stamp, 0).unwrap();
        let day_of_the_week = date_time.weekday();

        msg!("Week day is: {}", day_of_the_week);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// CHECK:
    pub recent_blockhashes: AccountInfo<'info>,
}
