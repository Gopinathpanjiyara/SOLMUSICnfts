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
    // Re-fetch transactions from localStorage to ensure we have the latest data
    if (typeof window !== 'undefined') {
      try {
        const storedData = localStorage.getItem(TRANSACTION_STORAGE_KEY);
        if (storedData) {
          transactionStore = JSON.parse(storedData);
        }
      } catch (error) {
        console.error('Error refreshing transactions from storage:', error);
      }
    }
    
    // Print all transactions for debugging
    console.log('All transactions in store:', transactionStore);
    
    // Filter transactions for sold NFTs - when this wallet sold an NFT to someone else
    const soldNfts = transactionStore.filter(tx => {
      // Only include transactions of type 'sell'
      if (tx.type !== 'sell') return false;
      
      // For a sell transaction, otherParty should match this wallet address
      // This is because in solana.ts, we set otherParty to the SELLER address for sell transactions
      const isSellerMatch = tx.otherParty === walletAddress;
      
      if (tx.type === 'sell') {
        console.log(`Sell transaction filter for ${walletAddress}:`, {
          txType: tx.type,
          nftTitle: tx.nft.title,
          txOtherParty: tx.otherParty,
          nftOwner: tx.nft.owner,
          walletAddress,
          isSellerMatch,
          result: isSellerMatch
        });
      }
      
      return isSellerMatch;
    });
    
    // Filter transactions for purchased NFTs - when this wallet bought or minted an NFT
    const purchasedNfts = transactionStore.filter(tx => {
      if (tx.type === 'buy') {
        // For a buy transaction, this wallet should be the current owner
        // AND this should NOT be a transaction that appears in the sold list
        const isBuyerMatch = tx.nft.owner === walletAddress;
        
        // Make sure this transaction is not already in the sold list
        // This prevents duplicate display of the same NFT in both sections
        const isDuplicate = soldNfts.some(soldTx => 
          soldTx.nft.id === tx.nft.id && 
          soldTx.date === tx.date
        );
        
        console.log(`Buy transaction filter for ${walletAddress}:`, {
          txType: tx.type,
          nftTitle: tx.nft.title,
          nftOwner: tx.nft.owner, 
          walletAddress,
          isBuyerMatch,
          isDuplicate,
          result: isBuyerMatch && !isDuplicate
        });
        
        return isBuyerMatch && !isDuplicate;
      } 
      else if (tx.type === 'mint') {
        // For a mint transaction, this wallet should be the owner
        const isMinterMatch = tx.nft.owner === walletAddress;
        
        console.log(`Mint transaction filter for ${walletAddress}:`, {
          txType: tx.type,
          nftTitle: tx.nft.title,
          nftOwner: tx.nft.owner,
          walletAddress,
          isMinterMatch,
          result: isMinterMatch
        });
        
        return isMinterMatch;
      }
      return false;
    });
    
    console.log(`Found ${soldNfts.length} sold NFTs and ${purchasedNfts.length} purchased NFTs for wallet ${walletAddress}`);
    
    return { soldNfts, purchasedNfts };
  } catch (error) {
    console.error('Error getting transactions:', error);
    return { soldNfts: [], purchasedNfts: [] };
  }
} 