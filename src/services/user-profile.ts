import axios from 'axios';
import { TransactionData } from '@/lib/transaction-utils';
import { MusicNftData } from '@/components/music-nft/MusicNftCard';
import { toast } from 'react-hot-toast';

// Import Pinata credentials from the pinata.ts file
const PINATA_API_KEY = 'd402d948a6ee45aa2d9a';
const PINATA_API_SECRET = '40d2100d3db66ff4ccbefc523d3123d313cdf1f73472cb185ca24593291b3310';
const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0OWRlZjY3Yi02MzZmLTQxYTItYjYxNi0zNGI1NGNjM2FmY2IiLCJlbWFpbCI6ImFtYW5wbGF5ejIwMDRAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImQ0MDJkOTQ4YTZlZTQ1YWEyZDlhIiwic2NvcGVkS2V5U2VjcmV0IjoiNDBkMjEwMGQzZGI2NmZmNGNjYmVmYzUyM2QzMTIzZDMxM2NkZjFmNzM0NzJjYjE4NWNhMjQ1OTMyOTFiMzMxMCIsImV4cCI6MTc3NjE4ODI1OH0.mDdyRude-XTee32G2yI175dcqfcIgUgYax3TQ_U890E';

// Set up Pinata API client for JWT auth (used for data/pinList endpoint)
const pinataApiJWT = axios.create({
  baseURL: 'https://api.pinata.cloud',
  headers: {
    Authorization: `Bearer ${PINATA_JWT}`,
  },
});

// Set up Pinata API client for API Key/Secret auth (used for pinning endpoints)
const pinataApiKeys = axios.create({
  baseURL: 'https://api.pinata.cloud',
  headers: {
    pinata_api_key: PINATA_API_KEY,
    pinata_secret_api_key: PINATA_API_SECRET,
  },
});

// The prefix used for profile data files
const PROFILE_PREFIX = 'solmusic_profile_';

// Type definitions for user profile data
export interface UserProfile {
  username: string;
  walletAddress: string;
  profileCreated: string;
  lastUpdated: string;
  ownedNFTs: string[]; // Array of mint addresses
  transactions: UserTransaction[];
}

export interface UserTransaction {
  type: 'buy' | 'sell' | 'mint';
  nftMint: string;
  nftTitle: string;
  nftArtist: string;
  price: number;
  date: string;
  otherParty: string;
}

/**
 * Convert localStorage transaction data to user profile format
 */
function convertTransactionsToProfileFormat(
  transactions: TransactionData[]
): UserTransaction[] {
  return transactions.map(tx => ({
    type: tx.type,
    nftMint: tx.nft.mint,
    nftTitle: tx.nft.title,
    nftArtist: tx.nft.artist,
    price: tx.price,
    date: tx.date,
    otherParty: tx.otherParty
  }));
}

/**
 * Save user profile data to Pinata
 */
export async function saveUserProfileToPinata(
  walletAddress: string,
  username: string,
  ownedNFTs: MusicNftData[],
  transactions: TransactionData[]
): Promise<boolean> {
  try {
    console.log('Saving user profile to Pinata with credentials:', { 
      apiKey: PINATA_API_KEY ? 'present' : 'missing',
      apiSecret: PINATA_API_SECRET ? 'present' : 'missing',
      jwt: PINATA_JWT ? 'present' : 'missing'
    });
    
    // Create profile data
    const profileData: UserProfile = {
      username,
      walletAddress,
      profileCreated: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      ownedNFTs: ownedNFTs.map(nft => nft.mint),
      transactions: convertTransactionsToProfileFormat(transactions)
    };
    
    // Convert to JSON string
    const jsonData = JSON.stringify(profileData);
    
    // Create form data for the request
    const formData = new FormData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    formData.append('file', blob, `${PROFILE_PREFIX}${walletAddress}.json`);
    
    // Add metadata
    const metadata = JSON.stringify({
      name: `${PROFILE_PREFIX}${walletAddress}`,
      keyvalues: {
        username,
        walletAddress,
        type: 'user_profile'
      }
    });
    
    formData.append('pinataMetadata', metadata);
    
    // Add pinata options
    const pinataOptions = JSON.stringify({
      cidVersion: 1
    });
    
    formData.append('pinataOptions', pinataOptions);
    
    // Send request to Pinata using fetch API with direct credentials
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to save user profile to Pinata:', response.status, errorText);
      return false;
    }
    
    const responseData = await response.json();
    console.log('User profile saved to Pinata:', responseData);
    return true;
  } catch (error) {
    console.error('Error saving user profile to Pinata:', error);
    return false;
  }
}

/**
 * Retrieve user profile data from Pinata
 */
export async function getUserProfileFromPinata(
  walletAddress: string
): Promise<UserProfile | null> {
  try {
    console.log(`Fetching profile for wallet: ${walletAddress}`);
    
    // Query Pinata for the user profile file using JWT auth
    const response = await pinataApiJWT.get(
      `/data/pinList?metadata[keyvalues][walletAddress]={"value":"${walletAddress}","op":"eq"}&metadata[keyvalues][type]={"value":"user_profile","op":"eq"}`
    );
    
    console.log('Pinata response for profile:', response.data);
    
    if (response.status === 200 && response.data.rows && response.data.rows.length > 0) {
      // Sort by most recent
      const sortedRows = response.data.rows.sort(
        (a: any, b: any) => new Date(b.date_pinned).getTime() - new Date(a.date_pinned).getTime()
      );
      
      // Get the most recent profile file
      const latestProfile = sortedRows[0];
      const ipfsHash = latestProfile.ipfs_pin_hash;
      
      console.log(`Found profile, fetching from IPFS hash: ${ipfsHash}`);
      
      // Fetch the profile data
      const profileResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('Successfully loaded profile data:', profileData);
        return profileData as UserProfile;
      } else {
        console.error('Failed to fetch profile data from gateway:', profileResponse.status);
        return null;
      }
    }
    
    console.log('No user profile found on Pinata for wallet:', walletAddress);
    return null;
  } catch (error) {
    console.error('Error fetching user profile from Pinata:', error);
    return null;
  }
}

/**
 * Sync local transaction data with Pinata
 * This will merge the local transactions with what's stored on Pinata
 */
export async function syncUserTransactionsWithPinata(
  walletAddress: string,
  username: string,
  ownedNFTs: MusicNftData[],
  transactions: TransactionData[]
): Promise<boolean> {
  try {
    toast.loading('Syncing your transaction data with Pinata...', { id: 'sync-pinata' });
    
    // First get existing profile from Pinata
    const existingProfile = await getUserProfileFromPinata(walletAddress);
    
    if (existingProfile) {
      // We found an existing profile, so we need to merge the transactions
      const existingTransactions = existingProfile.transactions;
      
      // Convert current transactions to profile format
      const currentTransactions = convertTransactionsToProfileFormat(transactions);
      
      // Create a map for quick lookup
      const existingTransactionMap = new Map<string, UserTransaction>();
      existingTransactions.forEach(tx => {
        // Create a unique key for each transaction
        const key = `${tx.type}_${tx.nftMint}_${tx.date}`;
        existingTransactionMap.set(key, tx);
      });
      
      // Merge transactions, keeping both existing and new ones
      const mergedTransactions: UserTransaction[] = [...currentTransactions];
      
      // Add transactions from Pinata that aren't in local storage
      existingTransactions.forEach(tx => {
        const key = `${tx.type}_${tx.nftMint}_${tx.date}`;
        // Check if this transaction exists in the current list
        const exists = currentTransactions.some(currTx => {
          const currKey = `${currTx.type}_${currTx.nftMint}_${currTx.date}`;
          return currKey === key;
        });
        
        if (!exists) {
          mergedTransactions.push(tx);
        }
      });
      
      // Convert merged transactions back to TransactionData format
      const mergedTransactionData: TransactionData[] = mergedTransactions.map(tx => {
        // Find the NFT data for this transaction
        const nftData = ownedNFTs.find(nft => nft.mint === tx.nftMint);
        
        // If we don't have the NFT data, create a minimal version
        const nft: MusicNftData = nftData || {
          mint: tx.nftMint,
          title: tx.nftTitle,
          artist: tx.nftArtist,
          price: tx.price,
          audioUrl: '',
          coverArt: '',
          owner: tx.type === 'buy' ? walletAddress : tx.otherParty,
          creator: '',
          forSale: false,
          genre: 'Unknown'
        };
        
        return {
          nft,
          date: tx.date,
          type: tx.type,
          price: tx.price,
          otherParty: tx.otherParty
        };
      });
      
      // Update localStorage with the merged transactions
      if (typeof window !== 'undefined') {
        localStorage.setItem('_nft_transactions', JSON.stringify(mergedTransactionData));
      }
      
      // Save the updated profile back to Pinata
      const result = await saveUserProfileToPinata(
        walletAddress,
        username,
        ownedNFTs,
        mergedTransactionData
      );
      
      toast.dismiss('sync-pinata');
      if (result) {
        toast.success('Successfully synced your transaction data with Pinata');
        return true;
      } else {
        toast.error('Failed to sync transaction data with Pinata');
        return false;
      }
    } else {
      // No existing profile, so just save the current data
      const result = await saveUserProfileToPinata(
        walletAddress,
        username,
        ownedNFTs,
        transactions
      );
      
      toast.dismiss('sync-pinata');
      if (result) {
        toast.success('Successfully saved your profile to Pinata');
        return true;
      } else {
        toast.error('Failed to save profile to Pinata');
        return false;
      }
    }
  } catch (error) {
    console.error('Error syncing transactions with Pinata:', error);
    toast.dismiss('sync-pinata');
    toast.error('Error syncing with Pinata');
    return false;
  }
} 