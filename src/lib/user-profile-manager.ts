import { PublicKey } from '@solana/web3.js';
import { MusicNftData } from '@/components/music-nft/MusicNftCard';
import { TransactionData } from '@/lib/transaction-utils';
import { getUserProfileFromPinata, saveUserProfileToPinata, UserProfile } from '@/services/user-profile';
import { toast } from 'react-hot-toast';

// In-memory cache for current session only
let currentUsername: string | null = null;
let currentSoldNfts: TransactionData[] = [];
let currentPurchasedNfts: TransactionData[] = [];
let isProfileLoaded = false;

/**
 * Check if the user has a profile in Pinata
 */
export async function userHasProfile(walletAddress: string): Promise<boolean> {
  try {
    const profile = await getUserProfileFromPinata(walletAddress);
    return !!profile;
  } catch (error) {
    console.error('Error checking if user has profile:', error);
    return false;
  }
}

/**
 * Create a new user profile in Pinata
 */
export async function createUserProfile(
  walletAddress: string,
  username: string,
  ownedNFTs: MusicNftData[] = []
): Promise<boolean> {
  try {
    // Create an empty profile with the username
    const result = await saveUserProfileToPinata(
      walletAddress,
      username,
      ownedNFTs,
      [] // No transactions yet
    );
    
    if (result) {
      // Store username in memory for current session
      currentUsername = username;
      isProfileLoaded = true;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return false;
  }
}

/**
 * Load user profile data from Pinata
 */
export async function loadUserProfile(walletAddress: string): Promise<{
  username: string | null;
  soldNfts: TransactionData[];
  purchasedNfts: TransactionData[];
}> {
  try {
    // If we already loaded the profile in this session, return cached data
    if (isProfileLoaded && currentUsername) {
      return {
        username: currentUsername,
        soldNfts: currentSoldNfts,
        purchasedNfts: currentPurchasedNfts
      };
    }
    
    // Fetch profile from Pinata
    const profile = await getUserProfileFromPinata(walletAddress);
    
    if (profile) {
      currentUsername = profile.username;
      
      // Group transactions into sold and purchased
      const soldNfts: TransactionData[] = [];
      const purchasedNfts: TransactionData[] = [];
      
      // Populate transactions
      profile.transactions.forEach(tx => {
        const transaction: TransactionData = {
          type: tx.type,
          date: tx.date,
          price: tx.price,
          otherParty: tx.otherParty,
          nft: {
            mint: tx.nftMint,
            title: tx.nftTitle,
            artist: tx.nftArtist,
            price: tx.price,
            audioUrl: '', // Will be populated on NFT fetch
            coverArt: '', // Will be populated on NFT fetch
            owner: tx.type === 'buy' ? walletAddress : tx.otherParty,
            creator: '',
            forSale: false,
            genre: 'Unknown'
          }
        };
        
        if (tx.type === 'sell') {
          soldNfts.push(transaction);
        } else {
          purchasedNfts.push(transaction);
        }
      });
      
      // Update in-memory cache
      currentSoldNfts = soldNfts;
      currentPurchasedNfts = purchasedNfts;
      isProfileLoaded = true;
      
      return {
        username: profile.username,
        soldNfts,
        purchasedNfts
      };
    }
    
    return {
      username: null,
      soldNfts: [],
      purchasedNfts: []
    };
  } catch (error) {
    console.error('Error loading user profile:', error);
    return {
      username: null,
      soldNfts: [],
      purchasedNfts: []
    };
  }
}

/**
 * Record a new transaction and save to Pinata
 */
export async function recordTransaction(
  walletAddress: string,
  transaction: TransactionData,
  ownedNFTs: MusicNftData[]
): Promise<boolean> {
  try {
    // Load current profile
    const profile = await getUserProfileFromPinata(walletAddress);
    
    if (!profile) {
      console.error('No profile found for user when recording transaction');
      return false;
    }
    
    // Add to in-memory cache
    if (transaction.type === 'sell') {
      currentSoldNfts.push(transaction);
    } else {
      currentPurchasedNfts.push(transaction);
    }
    
    // Prepare transactions for saving
    const allTransactions = [...currentSoldNfts, ...currentPurchasedNfts];
    
    // Save updated profile
    return await saveUserProfileToPinata(
      walletAddress,
      profile.username,
      ownedNFTs,
      allTransactions
    );
  } catch (error) {
    console.error('Error recording transaction:', error);
    return false;
  }
}

/**
 * Get the current username for a wallet
 */
export function getCurrentUsername(walletAddress: string): string | null {
  return currentUsername;
}

/**
 * Reset the profile manager (for logout)
 */
export function resetProfileManager(): void {
  currentUsername = null;
  currentSoldNfts = [];
  currentPurchasedNfts = [];
  isProfileLoaded = false;
} 