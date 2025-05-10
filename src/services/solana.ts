import { PublicKey, Transaction, Connection, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import { toast } from 'react-hot-toast';
import { MusicNftData } from '@/components/music-nft/MusicNftCard';
import { updateNFTOwnership, createNFTCopy } from './pinata';
import { Metaplex, walletAdapterIdentity, toMetaplexFile, NftWithToken, CreateNftOutput } from '@metaplex-foundation/js';
import { BN } from 'bn.js';
import { saveTransaction } from '@/lib/transaction-utils';

// Constants for transaction fees
export const MINT_FEE = 0.01;
export const PLATFORM_FEE_PERCENT = 20; // 20% fee to platform
export const PLACEHOLDER_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // The SOL address
export const PLATFORM_FEE_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // Using platform fee address as a placeholder

// Function to buy an NFT by transferring SOL from buyer to seller
export async function buyNFT(
  connection: Connection,
  buyerWallet: any,
  nft: MusicNftData
): Promise<boolean> {
  try {
    // Show pending notification immediately to give user feedback
    toast.loading('Preparing transaction...', { id: 'preparing-transaction' });
    
    // Check if wallet is connected and ready - improved check
    if (!buyerWallet || !buyerWallet.adapter || !buyerWallet.adapter.publicKey) {
      toast.dismiss('preparing-transaction');
      toast.error('Please connect your wallet first');
      console.log('Wallet state:', { wallet: buyerWallet, adapter: buyerWallet?.adapter, publicKey: buyerWallet?.adapter?.publicKey });
      return false;
    }
    
    // Use adapter.publicKey consistently
    const buyerPublicKey = buyerWallet.adapter.publicKey;
    
    // Verify NFT ownership and price
    // Validate the public keys before creating them
    if (!nft.owner || (nft.owner !== 'unknown' && !nft.owner.match(/^[A-Za-z0-9]{32,44}$/))) {
      toast.dismiss('preparing-transaction');
      toast.error('Invalid NFT owner address');
      console.error('Invalid owner address:', nft.owner);
      return false;
    }
    
    // Handle 'unknown' creator gracefully
    const sellerAddress = nft.owner === 'unknown' ? PLACEHOLDER_ADDRESS : nft.owner;
    const creatorAddress = nft.creator === 'unknown' ? PLACEHOLDER_ADDRESS : nft.creator;
    
    // Also validate creator if not using placeholder
    if (nft.creator !== 'unknown' && !nft.creator.match(/^[A-Za-z0-9]{32,44}$/)) {
      toast.dismiss('preparing-transaction');
      toast.error('Invalid NFT creator address');
      console.error('Invalid creator address:', nft.creator);
      return false;
    }
    
    try {
      const sellerPublicKey = new PublicKey(sellerAddress);
      const creatorPublicKey = new PublicKey(creatorAddress);
      const platformPublicKey = new PublicKey(PLATFORM_FEE_ADDRESS);
      
      // If the seller is unknown, redirect their payment to the platform
      const isUnknownSeller = nft.owner === 'unknown';
      
      // Calculate payment splits
      const totalPrice = nft.price;
      let platformFeeAmount = totalPrice * (PLATFORM_FEE_PERCENT / 100);
      let sellerAmount = totalPrice - platformFeeAmount;
      
      // If seller is unknown, all funds go to platform
      if (isUnknownSeller) {
        platformFeeAmount = totalPrice;
        sellerAmount = 0;
      }
      
      // Convert to lamports
      const sellerLamports = Math.floor(sellerAmount * LAMPORTS_PER_SOL);
      const platformFeeLamports = Math.floor(platformFeeAmount * LAMPORTS_PER_SOL);
      
      console.log('Payment splits:');
      console.log(`- Seller ${isUnknownSeller ? '(unknown)' : ''} (${sellerAmount.toFixed(4)} SOL): ${sellerLamports} lamports`);
      console.log(`- Platform (${platformFeeAmount.toFixed(4)} SOL): ${platformFeeLamports} lamports`);
      
      // Check if buyer has enough SOL
      const buyerBalance = await connection.getBalance(buyerPublicKey);
      const totalCost = sellerLamports + platformFeeLamports + 5000; // Adding 5000 lamports for gas fee
      
      if (buyerBalance < totalCost) {
        toast.dismiss('preparing-transaction');
        toast.error(`Insufficient funds. You need at least ${(totalCost / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
        return false;
      }
      
      // Create a new transaction
      let transaction = new Transaction();
      
      // Get latest blockhash
      const latestBlockhash = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = buyerPublicKey;
      
      // Add payment to seller (only if not unknown)
      if (sellerLamports > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: buyerPublicKey,
            toPubkey: sellerPublicKey,
            lamports: sellerLamports,
          })
        );
      }
      
      // Add platform fee payment
      if (platformFeeLamports > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: buyerPublicKey,
            toPubkey: platformPublicKey,
            lamports: platformFeeLamports,
          })
        );
      }
      
      // Update notification
      toast.dismiss('preparing-transaction');
      toast.loading('Please confirm transaction in your wallet...', { id: 'wallet-confirmation' });
      
      try {
        // Request wallet to sign the transaction
        // This will trigger the wallet UI to appear
        const signedTransaction = await buyerWallet.adapter.signTransaction(transaction);
        
        // Update notification
        toast.dismiss('wallet-confirmation');
        toast.loading('Sending transaction to Solana...', { id: 'sending-transaction' });
        
        // Send transaction to network
        const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        });
        
        console.log('Transaction sent with signature:', signature);
        
        // Update notification
        toast.dismiss('sending-transaction');
        toast.loading('Confirming transaction...', { id: 'confirming-transaction' });
        
        // Wait for confirmation
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
        }, 'confirmed');
        
        if (confirmation.value.err) {
          toast.dismiss('confirming-transaction');
          throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
        }
        
        // Store the NFT state before updating ownership for transaction history
        const nftBeforeTransfer = { ...nft };
        
        // Transfer the NFT metadata ownership 
        toast.dismiss('confirming-transaction');
        toast.loading('Updating NFT ownership...', { id: 'updating-ownership' });
        
        // Update the NFT ownership in our database
        const buyerAddress = buyerPublicKey.toBase58();
        const sellerAddress = nft.owner;
        
        // Save transaction data for the seller (they sold an NFT)
        saveTransaction({
          nft: nftBeforeTransfer,
          date: new Date().toISOString(),
          type: 'sell',
          price: nft.price,
          otherParty: buyerAddress
        });
        
        // Update the NFT ownership in our system
        // This will remove it from the seller's collection and add it to the buyer's
        const updatedNft = await updateNFTOwnership(nft, buyerAddress);
        
        // Save transaction data for the buyer (they bought an NFT)
        saveTransaction({
          nft: {
            ...updatedNft, // Use the updated NFT data with new owner
            owner: buyerAddress
          },
          date: new Date().toISOString(),
          type: 'buy',
          price: nft.price,
          otherParty: sellerAddress
        });
        
        // Clear NFT cache to ensure the updated ownership is reflected immediately
        localStorage.removeItem('_nft_cache_data');
        console.log('NFT cache cleared after ownership transfer');
        
        toast.dismiss('updating-ownership');
        
        // Show success notification with link to view in wallet
        toast.success(
          `Successfully purchased "${nft.title}" for ${nft.price.toFixed(2)} SOL!`,
          { duration: 8000 }
        );
        
        // Open transaction in explorer
        console.log(`View transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
        
        return true;
      } catch (error: any) {
        // Error handling code...
        
        // Dismiss any lingering notifications
        ['wallet-confirmation', 'sending-transaction', 'confirming-transaction', 'updating-ownership']
          .forEach(id => toast.dismiss(id));
        
        // Show error toast
        toast.error(`Transaction failed: ${error.message}`);
        return false;
      }
    } catch (error: any) {
      toast.dismiss('preparing-transaction');
      toast.error(`Invalid public key: ${error.message}`);
      console.error('Public key error:', error);
      return false;
    }
  } catch (error: any) {
    console.error('Error in buyNFT:', error);
    toast.error(`Error: ${error.message}`);
    return false;
  }
}

// Function to mint a copy of an NFT
export async function mintNFTCopy(
  connection: Connection,
  wallet: any,
  nft: MusicNftData
): Promise<boolean> {
  try {
    // Show pending notification immediately
    toast.loading('Preparing to mint NFT copy...', { id: 'preparing-mint' });
    
    // Check if wallet is connected
    if (!wallet?.adapter?.publicKey) {
      toast.dismiss('preparing-mint');
      toast.error('Please connect your wallet first');
      return false;
    }
    
    const userPublicKey = wallet.adapter.publicKey;
    
    // Handle 'unknown' creator gracefully
    const creatorAddress = nft.creator === 'unknown' ? PLACEHOLDER_ADDRESS : nft.creator;
    
    // Validate the creator public key if not using placeholder
    if (nft.creator !== 'unknown' && !nft.creator.match(/^[A-Za-z0-9]{32,44}$/)) {
      toast.dismiss('preparing-mint');
      toast.error('Invalid NFT creator address');
      console.error('Invalid creator address:', nft.creator);
      return false;
    }
    
    try {
      const creatorPublicKey = new PublicKey(creatorAddress);
      const platformWallet = new PublicKey(PLATFORM_FEE_ADDRESS);
      
      // Initialize Metaplex with the user's wallet
      const metaplex = Metaplex.make(connection)
        .use(walletAdapterIdentity(wallet.adapter));
      
      // Flag to check if creator is unknown
      const isUnknownCreator = nft.creator === 'unknown';
      
      // Calculate payment splits - normally 80% to creator, 20% to platform
      // But if creator is unknown, 100% goes to platform
      let creatorAmount = isUnknownCreator ? 0 : MINT_FEE * 0.8; // 0% or 80% to creator
      let platformAmount = isUnknownCreator ? MINT_FEE : MINT_FEE * 0.2; // 100% or 20% to platform
      
      const creatorLamports = Math.floor(creatorAmount * LAMPORTS_PER_SOL);
      const platformLamports = Math.floor(platformAmount * LAMPORTS_PER_SOL);
      
      console.log('Payment splits:');
      console.log(`- Original Creator ${isUnknownCreator ? '(unknown)' : ''} (${creatorAmount.toFixed(4)} SOL): ${creatorLamports} lamports`);
      console.log(`- Platform (${platformAmount.toFixed(4)} SOL): ${platformLamports} lamports`);
      
      // Check if buyer has enough SOL
      const userBalance = await connection.getBalance(userPublicKey);
      // Increase gas fee estimation for NFT minting which requires more SOL
      const mintFee = 0.05 * LAMPORTS_PER_SOL; // 0.05 SOL for minting fees (higher than normal transfers)
      const totalCost = creatorLamports + platformLamports + mintFee;
      
      if (userBalance < totalCost) {
        toast.dismiss('preparing-mint');
        toast.error(`Insufficient funds. You need at least ${(totalCost / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
        return false;
      }
      
      // Create a new transaction for royalty payments
      const transaction = new Transaction();
      
      // Get latest blockhash
      const latestBlockhash = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = userPublicKey;
      
      // Add payment to creator (only if not unknown)
      if (creatorLamports > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: userPublicKey,
            toPubkey: creatorPublicKey,
            lamports: creatorLamports,
          })
        );
      }
      
      // Add platform fee payment
      if (platformLamports > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: userPublicKey,
            toPubkey: platformWallet,
            lamports: platformLamports,
          })
        );
      }
      
      // Update notification
      toast.dismiss('preparing-mint');
      toast.loading('Please confirm royalty payment...', { id: 'wallet-confirmation-mint' });
      
      try {
        // Request wallet to sign the transaction
        const signedTransaction = await wallet.adapter.signTransaction(transaction);
        
        // Update notification
        toast.dismiss('wallet-confirmation-mint');
        toast.loading('Sending royalty payment...', { id: 'sending-transaction-mint' });
        
        // Send transaction to network
        const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        });
        
        // Update notification
        toast.dismiss('sending-transaction-mint');
        toast.loading('Confirming royalty payment...', { id: 'confirming-transaction-mint' });
        
        // Wait for confirmation
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
        }, 'confirmed');
        
        if (confirmation.value.err) {
          toast.dismiss('confirming-transaction-mint');
          throw new Error(`Royalty payment failed: ${confirmation.value.err.toString()}`);
        }
        
        // Royalty payment confirmed, now mint the NFT
        toast.dismiss('confirming-transaction-mint');
        toast.loading('Minting NFT on Solana blockchain...', { id: 'minting-nft-onchain' });
        
        // Prepare NFT metadata
        const nftName = nft.title;
        const nftSymbol = nft.artist.substring(0, 4).toUpperCase();
        const nftDescription = `Music NFT by ${nft.artist}`;
        
        // Create the NFT on-chain
        try {
          // Convert the image URL to a proper metadata URI format
          // For real production:
          // 1. We would upload a proper metadata JSON to Arweave with all required fields
          // 2. We'd include the proper image and audio files in IPFS/Arweave
          
          // For demo - create a simple NFT using the existing cover art URL
          let coverArtUrl = nft.coverArt;
          // If the URL is from Pinata, make sure it's using the gateway URL
          if (coverArtUrl.startsWith('https://gateway.pinata.cloud')) {
            // It's already a gateway URL, use it
          } else if (coverArtUrl.includes('ipfs://')) {
            // Convert IPFS URL to gateway URL
            coverArtUrl = coverArtUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
          }
          
          // Create NFT using Metaplex
          const { nft: metaplexNft } = await metaplex.nfts().create({
            name: nftName,
            symbol: nftSymbol,
            uri: coverArtUrl, // In production, this would be a proper metadata JSON URI
            sellerFeeBasisPoints: 500, // 5% royalty
            tokenOwner: userPublicKey,
          });
          
          console.log('NFT created on Solana blockchain:', metaplexNft);
          
          // Get user's address as string for database
          const userAddress = userPublicKey.toBase58();
          
          toast.dismiss('minting-nft-onchain');
          toast.loading('Recording NFT in database...', { id: 'creating-nft-copy' });
        
          // Create the NFT copy in our database with the real on-chain mint address
          const onChainMintAddress = metaplexNft.address.toString();
          const newNft = await createNFTCopy(nft, userAddress, onChainMintAddress);
        
        if (!newNft) {
            throw new Error('Failed to record NFT in database');
        }
        
        // Record the minting transaction
        saveTransaction({
          nft: newNft,
          date: new Date().toISOString(),
          type: 'mint',
          price: MINT_FEE,
          otherParty: nft.creator
        });
        
        // Clear NFT cache to ensure the new NFT is visible immediately
        localStorage.removeItem('_nft_cache_data');
        console.log('NFT cache cleared after minting');
        
        toast.dismiss('creating-nft-copy');
        
          // Show success notification with Solana Explorer link
        toast.success(
            `Successfully minted "${nft.title}"! View NFT on Solana Explorer: https://explorer.solana.com/address/${onChainMintAddress}?cluster=devnet`,
            { duration: 10000 }
        );
        
        return true;
        } catch (mintError: any) {
          console.error('Error minting NFT:', mintError);
          toast.dismiss('minting-nft-onchain');
          toast.error(`Error minting NFT: ${mintError.message}`);
          return false;
        }
      } catch (error: any) {
        // Dismiss any lingering notifications
        ['wallet-confirmation-mint', 'sending-transaction-mint', 'confirming-transaction-mint', 'minting-nft-onchain', 'creating-nft-copy']
          .forEach(id => toast.dismiss(id));
        
        // Show error toast
        toast.error(`Minting failed: ${error.message}`);
        return false;
      }
    } catch (error: any) {
      toast.dismiss('preparing-mint');
      toast.error(`Invalid public key: ${error.message}`);
      console.error('Public key error:', error);
      return false;
    }
  } catch (error: any) {
    console.error('Error in mintNFTCopy:', error);
    toast.error(`Error: ${error.message}`);
    return false;
  }
} 