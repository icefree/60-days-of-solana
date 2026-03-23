use anchor_lang::prelude::*;

declare_id!("6ArNsWCw8erFL2Edhdq4C8ew6FEn5vmaqQ1dM5vCRZAd");

#[program]
pub mod data_reader {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let data_reader = ctx.accounts.data_reader.clone();
        if data_reader.data_is_empty() {
            return err!(DataReaderError::NoAccount);
        }

        let mut data_slice: &[u8] = &data_reader.data.borrow();
        let data: DataHolder = AccountDeserialize::try_deserialize(&mut data_slice)?;
        msg!("The value of y is: {}", data.y);
        Ok(())
    }
}

#[error_code]
pub enum DataReaderError {
    #[msg("No account")]
    NoAccount,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    ///CHECK: data_holder is a PDA account
    pub data_reader: AccountInfo<'info>,
}

#[account]
pub struct DataHolder {
    pub y: u32,
    // pub z: u64,
}
