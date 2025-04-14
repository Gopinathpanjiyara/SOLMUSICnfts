#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

#[program]
pub mod mywalletapp {
    use super::*;

  pub fn close(_ctx: Context<CloseMywalletapp>) -> Result<()> {
    Ok(())
  }

  pub fn decrement(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.mywalletapp.count = ctx.accounts.mywalletapp.count.checked_sub(1).unwrap();
    Ok(())
  }

  pub fn increment(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.mywalletapp.count = ctx.accounts.mywalletapp.count.checked_add(1).unwrap();
    Ok(())
  }

  pub fn initialize(_ctx: Context<InitializeMywalletapp>) -> Result<()> {
    Ok(())
  }

  pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
    ctx.accounts.mywalletapp.count = value.clone();
    Ok(())
  }
}

#[derive(Accounts)]
pub struct InitializeMywalletapp<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  init,
  space = 8 + Mywalletapp::INIT_SPACE,
  payer = payer
  )]
  pub mywalletapp: Account<'info, Mywalletapp>,
  pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseMywalletapp<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  mut,
  close = payer, // close account and return lamports to payer
  )]
  pub mywalletapp: Account<'info, Mywalletapp>,
}

#[derive(Accounts)]
pub struct Update<'info> {
  #[account(mut)]
  pub mywalletapp: Account<'info, Mywalletapp>,
}

#[account]
#[derive(InitSpace)]
pub struct Mywalletapp {
  count: u8,
}
