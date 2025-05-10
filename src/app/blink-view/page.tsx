'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchNFTsFromPinata } from '@/services/pinata';
import { MusicNftData } from '@/components/music-nft/MusicNftCard';
import Link from 'next/link';
import Image from 'next/image';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function BlinkViewPage() {
  const [nft, setNft] = useState<MusicNftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseCompleted, setPurchaseCompleted] = useState(false);
  const [onChainAddress, setOnChainAddress] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const searchParams = useSearchParams();
  const { publicKey } = useWallet();
  
  // Extract NFT ID from query params
  const nftId = searchParams?.get('nft') || '';
  const title = searchParams?.get('title') || 'Music NFT';
  const artist = searchParams?.get('artist') || 'Artist';
  const coverArt = searchParams?.get('coverArt') || '';
  const amount = searchParams?.get('amount') || '0.1';
  
  useEffect(() => {
    // Check for transaction success message from URL params
    const success = searchParams?.get('success');
    if (success === 'true') {
      setPurchaseCompleted(true);
    }
    
    // Check if this is a transaction return from a Blink
    const txid = searchParams?.get('txid');
    if (txid && nftId && publicKey) {
      // Notify server about successful transaction to update NFT ownership
      setIsProcessing(true);
      notifyPurchaseCompletion(txid, nftId, publicKey.toString());
    }
    
    const loadNFT = async () => {
      try {
        setLoading(true);
        if (nftId) {
          const nfts = await fetchNFTsFromPinata();
          const foundNft = nfts.find(n => n.mint === nftId);
          setNft(foundNft || null);
        }
      } catch (error) {
        console.error('Error loading NFT:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNFT();
  }, [nftId, publicKey, searchParams]);
  
  // Function to notify the server about successful transaction
  const notifyPurchaseCompletion = async (signature: string, nftId: string, walletAddress: string) => {
    try {
      setIsProcessing(true);
      
      const response = await fetch('/api/actions/share-music', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature,
          nftId,
          buyerWallet: walletAddress,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('NFT purchase completed:', data);
        setPurchaseCompleted(true);
        
        // Check if an on-chain address was returned
        if (data.nft && data.nft.onChainAddress) {
          setOnChainAddress(data.nft.onChainAddress);
        }
      } else {
        console.error('Error completing NFT purchase:', data.error);
      }
    } catch (error) {
      console.error('Error notifying purchase completion:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-black p-4">
        <div className="text-white text-lg mb-4">Loading Music NFT...</div>
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Use either loaded NFT data or parameters from the URL
  const displayTitle = nft?.title || title;
  const displayArtist = nft?.artist || artist;
  const displayCoverArt = coverArt || nft?.coverArt || '/share-music.png';
  const displayPrice = nft?.price || parseFloat(amount);
  
  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-purple-900 to-black p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl my-8">
        {/* NFT Image */}
        <div className="w-full aspect-square relative">
          <img 
            src={displayCoverArt}
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* NFT Details */}
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white mb-2">{displayTitle}</h1>
          <p className="text-purple-300 mb-4">by {displayArtist}</p>
          
          <div className="bg-black bg-opacity-40 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Price</span>
              <span className="text-2xl font-bold text-white">{displayPrice} SOL</span>
            </div>
          </div>
          
          {isProcessing ? (
            <div className="bg-gray-800 text-white p-4 rounded-lg mb-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="font-bold text-lg mb-2">Processing Purchase...</h2>
                <p className="text-center text-gray-300">
                  Creating your NFT and adding it to your wallet. This may take a moment.
                </p>
              </div>
            </div>
          ) : purchaseCompleted ? (
            <div className="bg-green-900 text-white p-4 rounded-lg mb-6">
              <h2 className="font-bold text-lg mb-2">Purchase Complete!</h2>
              <p>This NFT has been added to your wallet.</p>
              
              {onChainAddress && (
                <div className="mt-4 p-3 bg-black bg-opacity-40 rounded-lg">
                  <p className="text-sm mb-1 text-gray-300">NFT Address:</p>
                  <p className="text-xs font-mono break-all">{onChainAddress}</p>
                  <a 
                    href={`https://explorer.solana.com/address/${onChainAddress}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block"
                  >
                    View on Solana Explorer
                  </a>
                </div>
              )}
              
              <div className="mt-4">
                <Link 
                  href="/music-nft/collection" 
                  className="block w-full py-3 text-center bg-purple-600 hover:bg-purple-700 rounded-lg font-medium text-white"
                >
                  View Your Collection
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {publicKey ? (
                <Link 
                  href={`/api/actions/share-music?amount=${displayPrice}&nft=${nftId}&title=${encodeURIComponent(displayTitle)}&artist=${encodeURIComponent(displayArtist)}&coverArt=${encodeURIComponent(displayCoverArt)}`}
                  className="block w-full py-3 text-center bg-purple-600 hover:bg-purple-700 rounded-lg font-medium text-white"
                >
                  Buy for {displayPrice} SOL
                </Link>
              ) : (
                <div className="text-center">
                  <p className="text-gray-300 mb-4">Connect your wallet to purchase this NFT</p>
                  <div className="flex justify-center">
                    <WalletMultiButton />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center text-white max-w-md px-4">
        <p className="mb-4 text-sm text-gray-400">
          This NFT will be minted on the Solana devnet and added to your Phantom wallet.
          Make sure you have set your wallet to devnet to view it.
        </p>
        <Link href="/music-nft/marketplace" className="text-purple-300 hover:text-purple-100 underline">
          Browse more Music NFTs
        </Link>
      </div>
    </div>
  );
} 