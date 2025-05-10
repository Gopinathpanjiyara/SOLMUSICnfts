#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

#[program]
pub mod mywalletapp {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    // Initialize a new music NFT collection
    pub fn initialize_music_collection(
        ctx: Context<InitializeMusicCollection>,
        collection_name: String,
        collection_symbol: String,
        collection_uri: String,
    ) -> Result<()> {
        let collection = &mut ctx.accounts.collection;
        collection.authority = ctx.accounts.authority.key();
        collection.name = collection_name;
        collection.symbol = collection_symbol;
        collection.uri = collection_uri;
        collection.royalty_basis_points = 500; // Default 5% royalty
        
        Ok(())
    }

    // Mint a new music NFT
    pub fn mint_music_nft(
        ctx: Context<MintMusicNft>,
        music_title: String,
        music_uri: String,
        royalty_basis_points: u16,
    ) -> Result<()> {
        let music_nft = &mut ctx.accounts.music_nft;
        music_nft.title = music_title;
        music_nft.uri = music_uri;
        music_nft.owner = ctx.accounts.payer.key();
        music_nft.creator = ctx.accounts.payer.key();
        music_nft.collection = ctx.accounts.collection.key();
        music_nft.mint = ctx.accounts.mint.key();
        music_nft.royalty_basis_points = royalty_basis_points;
        music_nft.for_sale = false;
        music_nft.price = 0;
        
        Ok(())
    }

    // List music NFT for sale
    pub fn list_music_nft(
        ctx: Context<ListMusicNft>,
        price: u64,
    ) -> Result<()> {
        let music_nft = &mut ctx.accounts.music_nft;
        
        require!(
            music_nft.owner == ctx.accounts.owner.key(),
            MusicNftError::NotNftOwner
        );
        
        music_nft.for_sale = true;
        music_nft.price = price;
        
        Ok(())
    }

    // Execute purchase of music NFT
    pub fn buy_music_nft(
        ctx: Context<BuyMusicNft>,
    ) -> Result<()> {
        let music_nft = &mut ctx.accounts.music_nft;
        
        require!(music_nft.for_sale, MusicNftError::NotForSale);
        
        // Calculate royalty amount
        let royalty_amount = (music_nft.price as u128)
            .checked_mul(music_nft.royalty_basis_points as u128)
            .unwrap()
            .checked_div(10000)
            .unwrap() as u64;
            
        // Calculate seller amount
        let seller_amount = music_nft.price.checked_sub(royalty_amount).unwrap();
        
        // Transfer SOL to seller
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.seller.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, seller_amount)?;
        
        // Transfer royalty to creator if not the same as seller
        if music_nft.creator != ctx.accounts.seller.key() {
            let royalty_cpi_context = CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.creator.to_account_info(),
                },
            );
            anchor_lang::system_program::transfer(royalty_cpi_context, royalty_amount)?;
        }
        
        // Update ownership
        music_nft.owner = ctx.accounts.buyer.key();
        music_nft.for_sale = false;
        music_nft.price = 0;
        
        Ok(())
    }

    // Cancel listing of music NFT
    pub fn cancel_listing(
        ctx: Context<CancelListing>,
    ) -> Result<()> {
        let music_nft = &mut ctx.accounts.music_nft;
        
        require!(
            music_nft.owner == ctx.accounts.owner.key(),
            MusicNftError::NotNftOwner
        );
        
        music_nft.for_sale = false;
        music_nft.price = 0;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeMusicCollection<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + MusicCollection::INIT_SPACE,
    )]
    pub collection: Account<'info, MusicCollection>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintMusicNft<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(
        init,
        payer = payer,
        space = 8 + MusicNft::INIT_SPACE,
    )]
    pub music_nft: Account<'info, MusicNft>,
    
    #[account(mut)]
    pub collection: Account<'info, MusicCollection>,
    
    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = payer,
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ListMusicNft<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(mut)]
    pub music_nft: Account<'info, MusicNft>,
}

#[derive(Accounts)]
pub struct BuyMusicNft<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(mut)]
    pub seller: SystemAccount<'info>,
    
    #[account(mut)]
    pub creator: SystemAccount<'info>,
    
    #[account(mut)]
    pub music_nft: Account<'info, MusicNft>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(mut)]
    pub music_nft: Account<'info, MusicNft>,
}

#[account]
#[derive(InitSpace)]
pub struct MusicCollection {
    pub authority: Pubkey,      // 32
    #[max_len(64)]
    pub name: String,           // 8 + 64 = 72
    #[max_len(12)]
    pub symbol: String,         // 8 + 12 = 20
    #[max_len(200)]
    pub uri: String,            // 8 + 200 = 208
    pub royalty_basis_points: u16, // 2
}

#[account]
#[derive(InitSpace)]
pub struct MusicNft {
    pub mint: Pubkey,           // 32
    pub collection: Pubkey,     // 32
    pub owner: Pubkey,          // 32
    pub creator: Pubkey,        // 32
    #[max_len(100)]
    pub title: String,          // 8 + 100 = 108
    #[max_len(200)]
    pub uri: String,            // 8 + 200 = 208
    pub royalty_basis_points: u16, // 2
    pub for_sale: bool,         // 1
    pub price: u64,             // 8
}

#[error_code]
pub enum MusicNftError {
    #[msg("Not the NFT owner")]
    NotNftOwner,
    #[msg("NFT is not for sale")]
    NotForSale,
}
