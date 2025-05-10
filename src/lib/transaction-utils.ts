import { MusicNftData } from "@/components/music-nft/MusicNftCard";

// Storage key for transaction history
const TRANSACTION_STORAGE_KEY = '_nft_transactions';

// Get stored transactions or initialize empty array
function getStoredTransactions(): TransactionData[] {
  if (typeof window !== 'undefined') {
    try {
      const storedData = localStorage.getItem(TRANSACTION_STORAGE_KEY);
      return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
      console.error('Error loading transactions from storage:', error);
      return [];
    }
  }
  return [];
}

// In-memory store for transactions with persistent backup
let transactionStore: TransactionData[] = getStoredTransactions();

export interface TransactionData {
  nft: MusicNftData;
  date: string;
  type: 'buy' | 'sell' | 'mint';
  price: number;
  otherParty: string;
}

// Save transaction to in-memory store and localStorage
export function saveTransaction(transaction: TransactionData): void {
  try {
    // Add new transaction to in-memory store
    transactionStore.push(transaction);
    
    // Save to localStorage if available
    if (typeof window !== 'undefined') {
      localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(transactionStore));
    }
    
    console.log('Transaction saved to history:', transaction);
  } catch (error) {
    console.error('Error saving transaction:', error);
  }
}

// Get transactions for a specific wallet address
export function getTransactionsForWallet(walletAddress: string): {
  soldNfts: TransactionData[];
  purchasedNfts: TransactionData[];
} {
  try {
    // Filter transactions for sold NFTs - only when this wallet was the original seller
    const soldNfts = transactionStore.filter(tx => 
      // Only include 'sell' transactions where this wallet was the seller (otherParty field)
      tx.type === 'sell' && tx.otherParty === walletAddress
    );
    
    // Filter transactions for purchased NFTs - only when this wallet was the buyer
    const purchasedNfts = transactionStore.filter(tx => 
      // Include 'buy' or 'mint' transactions where this wallet is now the owner
      (tx.type === 'buy' || tx.type === 'mint') && 
      tx.nft.owner === walletAddress
    );
    
    console.log(`Found ${soldNfts.length} sold NFTs and ${purchasedNfts.length} purchased NFTs for wallet ${walletAddress}`);
    
    return { soldNfts, purchasedNfts };
  } catch (error) {
    console.error('Error getting transactions:', error);
    return { soldNfts: [], purchasedNfts: [] };
  }
} 