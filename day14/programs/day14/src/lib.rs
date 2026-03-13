use anchor_lang::prelude::*;

declare_id!("Eou7tpEg7au2s62ZDc54N2NrcwQq53siAHhAM38gHHFv");

const OWNER: &str = "D9FbrJD6gSoanhzcXmH8UvWXU3QnfSe8P1WViRKCQmwX";

#[program]
pub mod day14 {
    use super::*;

    #[access_control(check(&ctx))]
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Holla, I'm the owner.");

        let the_signer1: &mut Signer = &mut ctx.accounts.signer1;
        msg!("The signer1 is: {:?}", the_signer1.key());
        let the_signer2: &mut Signer = &mut ctx.accounts.signer2;
        msg!("The signer2 is: {:?}", the_signer2.key());
        let the_signer3: &mut Signer = &mut ctx.accounts.signer3;
        msg!("The signer3 is: {:?}", the_signer3.key());
        Ok(())
    }
}

fn check(ctx: &Context<Initialize>) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.signer1.key(),
        OWNER.parse::<Pubkey>().unwrap(),
        OnlyOwnerError::NotOwner
    );

    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    pub signer1: Signer<'info>,
    pub signer2: Signer<'info>,
    pub signer3: Signer<'info>,
}

#[error_code]
pub enum OnlyOwnerError {
    #[msg("You are not the owner")]
    NotOwner,
}
