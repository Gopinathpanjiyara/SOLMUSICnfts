'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  Connection
} from '@solana/web3.js';
import { useMemo, ReactNode } from 'react';
import {
  Dialect,
  DialectSdk,
  ThreadMemberScope,
  type DialectCloudEnvironment,
} from '@dialectlabs/sdk';
import {
  Solana,
  SolanaSdkFactory,
} from '@dialectlabs/blockchain-sdk-solana';
import { 
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { MusicNftData } from '../music-nft/MusicNftCard';

interface ShareNftBlinkProps {
  nft: MusicNftData;
  onPurchaseComplete?: () => void;
}

interface DialectBlinksProviderProps {
  children: ReactNode;
}

// Initialize Dialect SDK
const initializeDialectSdk = (wallet: any): DialectSdk<Solana> | undefined => {
  if (typeof window === 'undefined') return undefined;
  
  // Log the environment variables (without revealing secrets)
  console.log("Dialect API URL defined:", !!process.env.NEXT_PUBLIC_DIALECT_API_URL);
  console.log("Solana RPC URL defined:", !!process.env.NEXT_PUBLIC_SOLANA_RPC_URL);
  
  // Don't proceed if wallet is not connected
  if (!wallet.publicKey) {
    console.warn('Wallet not connected, cannot initialize Dialect SDK');
    return undefined;
  }

  try {
    // Create a proper wallet adapter for Dialect SDK
    const dialectWalletAdapter = {
      publicKey: wallet.publicKey,
      signMessage: wallet.signMessage,
      signTransaction: wallet.signTransaction,
      signAllTransactions: wallet.signAllTransactions,
    };

    // Initialize the SDK with explicit configuration for dApp usage
    // Using dapp authentication which doesn't require API key
    const sdk = Dialect.sdk(
      {
        environment: 'production' as DialectCloudEnvironment,
        dialectCloud: {
          tokenStore: 'local-storage',
          environment: 'production' as DialectCloudEnvironment,
        }
      },
      SolanaSdkFactory.create({
        wallet: dialectWalletAdapter,
      })
    );
    
    console.log("Dialect SDK initialized successfully");
    return sdk;
  } catch (error) {
    console.error('Error initializing Dialect SDK:', error);
    return undefined;
  }
};

// Component for the actual message content
const NftBlinkContent = ({ nft, onPurchaseComplete }: ShareNftBlinkProps) => {
  const { publicKey, sendTransaction } = useWallet();

  const handlePurchase = async () => {
    if (!publicKey || !sendTransaction) return;

    try {
      // Create transaction for NFT purchase
      const transaction = await createNftPurchaseTransaction(nft, publicKey);
      
      // Send transaction
      const signature = await sendTransaction(transaction, new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'));
      
      onPurchaseComplete?.();
    } catch (error) {
      console.error('Error purchasing NFT:', error);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center space-x-4 mb-4">
        <img 
          src={nft.coverArt} 
          alt={nft.title} 
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div>
          <h3 className="font-bold text-lg">{nft.title}</h3>
          <p className="text-sm text-gray-400">by {nft.artist}</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-400">Price</span>
        <span className="font-mono font-bold">{nft.price} SOL</span>
      </div>
      
      <button
        onClick={handlePurchase}
        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors"
      >
        Buy Now
      </button>
    </div>
  );
};

// Main component that generates sharing links
export const ShareNftBlink = ({ nft, onPurchaseComplete }: ShareNftBlinkProps) => {
  const wallet = useWallet();
  const sdk = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      console.log("Initializing Dialect SDK with wallet:", wallet.publicKey?.toString());
      return initializeDialectSdk(wallet);
    } catch (error) {
      console.error('Error initializing Dialect SDK:', error);
      return null;
    }
  }, [wallet]);
  
  const handleShare = async () => {
    console.log("Share button clicked, SDK:", !!sdk, "PublicKey:", wallet.publicKey?.toString());
    if (!sdk || !wallet.publicKey) {
      console.warn("Cannot share: SDK or wallet not available");
      return;
    }

    try {
      // Open Dialect dApp in a new window instead of using API directly
      const dialectUrl = `https://dialect.io/?recipient=${nft.owner}&message=${encodeURIComponent(
        JSON.stringify({
          type: 'nft-share',
          content: {
            title: `${nft.title} - Music NFT`,
            description: `Check out this music NFT by ${nft.artist}`,
            image: nft.coverArt,
            price: nft.price,
            mint: nft.mint
          }
        })
      )}`;
      
      console.log("Opening Dialect dApp:", dialectUrl);
      window.open(dialectUrl, '_blank', 'noopener,noreferrer');
      
      console.log("Dialect dApp opened!");
      // Show feedback to the user
      alert("Dialect messaging opened in a new window!");
    } catch (error) {
      console.error('Error sharing NFT:', error);
      alert("Failed to share NFT. See console for details.");
    }
  };

  // Debugging render conditions
  console.log("ShareNftBlink render conditions:", {
    windowDefined: typeof window !== 'undefined',
    walletConnected: !!wallet.publicKey,
    sdkInitialized: !!sdk,
    willRender: typeof window !== 'undefined' && !!wallet.publicKey && !!sdk
  });

  if (typeof window === 'undefined') return null;
  if (!wallet.publicKey) {
    // If no wallet is connected, show a message
    return (
      <button
        onClick={() => alert("Please connect your wallet to share NFTs")}
        className="w-full flex items-center justify-center px-4 py-2 bg-gray-500 text-white rounded-md font-medium cursor-not-allowed opacity-70"
      >
        Connect Wallet to Share
      </button>
    );
  }
  
  // Even if SDK isn't initialized, still show the button but handle the error inside
  return (
    <div className="space-y-2 w-full">
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors"
      >
        Share NFT
      </button>
      
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => {
            // Test button to check if wallet and SDK are working properly
            try {
              console.log("Debug button clicked");
              console.log("Wallet connected:", !!wallet.publicKey?.toString());
              console.log("SDK initialized:", !!sdk);
              
              // Open the Dialect interface directly 
              window.open(`https://dialect.io/?recipient=${nft.owner}`, '_blank', 'noopener,noreferrer');
              alert("Opened Dialect directly. Check the new window.");
            } catch (error) {
              console.error("Debug button error:", error);
            }
          }}
          className="w-full text-xs px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
        >
          Open Dialect dApp
        </button>
      )}
    </div>
  );
};

// Provider component to wrap your app
export const DialectBlinksProvider = ({ children }: DialectBlinksProviderProps) => {
  const wallet = useWallet();
  const sdk = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      return initializeDialectSdk(wallet);
    } catch (error) {
      console.error('Error initializing Dialect SDK:', error);
      return null;
    }
  }, [wallet]);

  return <>{children}</>;
};

// Helper function to create NFT purchase transaction
async function createNftPurchaseTransaction(nft: MusicNftData, buyerPublicKey: PublicKey): Promise<Transaction> {
  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
  const transaction = new Transaction();

  try {
    // Convert price from SOL to lamports
    const price = Number(nft.price) * LAMPORTS_PER_SOL;
    
    // Get the seller's public key
    const sellerPublicKey = new PublicKey(nft.owner);
    
    // Get the NFT mint address
    const mintPublicKey = new PublicKey(nft.mint);
    
    // Get the buyer's and seller's associated token accounts
    const buyerATA = await getAssociatedTokenAddress(
      mintPublicKey,
      buyerPublicKey
    );
    
    const sellerATA = await getAssociatedTokenAddress(
      mintPublicKey,
      sellerPublicKey
    );

    // Check if buyer's ATA exists, if not create it
    const buyerATAInfo = await connection.getAccountInfo(buyerATA);
    if (!buyerATAInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          buyerPublicKey,
          buyerATA,
          buyerPublicKey,
          mintPublicKey
        )
      );
    }

    // Add payment instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: buyerPublicKey,
        toPubkey: sellerPublicKey,
        lamports: price,
      })
    );

    // Add NFT transfer instruction
    transaction.add(
      createTransferInstruction(
        sellerATA,
        buyerATA,
        sellerPublicKey,
        1 // NFTs have amount 1
      )
    );

    // Get the latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = buyerPublicKey;

    return transaction;
  } catch (error) {
    console.error('Error creating purchase transaction:', error);
    throw error;
  }
} 