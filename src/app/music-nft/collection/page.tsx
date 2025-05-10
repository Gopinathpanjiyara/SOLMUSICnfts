'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { fetchNFTsFromPinata } from '@/services/pinata';
import { MusicNftData } from '@/components/music-nft/MusicNftCard';
import MusicNftCard from '@/components/music-nft/MusicNftCard';
import Link from 'next/link';
import { Connection, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';

export default function CollectionPage() {
  const [nfts, setNfts] = useState<MusicNftData[]>([]);
  const [onChainNfts, setOnChainNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const { publicKey } = useWallet();
  
  // Check for on-chain NFTs when wallet connects
  useEffect(() => {
    const fetchOnChainNFTs = async () => {
      if (!publicKey) return;
      
      try {
        setNetworkError(null);
        // Connect to Solana devnet
        const connection = new Connection('https://api.devnet.solana.com');
        const metaplex = new Metaplex(connection);
        
        // Fetch NFTs owned by this wallet
        const nfts = await metaplex.nfts().findAllByOwner({
          owner: publicKey,
        });
        
        console.log('On-chain NFTs:', nfts);
        
        // Filter for NFTs that appear to be music (based on naming pattern or metadata)
        const musicNfts = nfts.filter(nft => {
          // Include all minted NFTs for now since our app only mints music NFTs
          return true;
        });
        
        setOnChainNfts(musicNfts);
      } catch (error: any) {
        console.error('Error fetching on-chain NFTs:', error);
        
        // Check if this looks like a network error
        if (error.message && (
          error.message.includes('network') || 
          error.message.includes('connection') ||
          error.message.includes('fetch') ||
          error.message.includes('timeout')
        )) {
          setNetworkError("Network error: Make sure your wallet is connected to Solana Devnet");
        }
      }
    };
    
    fetchOnChainNFTs();
  }, [publicKey]);
  
  useEffect(() => {
    const loadNFTs = async () => {
      try {
        setLoading(true);
        // Force refresh from Pinata to get the latest data
        const allNfts = await fetchNFTsFromPinata(true);
        
        if (publicKey) {
          // Filter NFTs owned by the current wallet
          const userNfts = allNfts.filter(nft => 
            nft.owner === publicKey.toString()
          );
          setNfts(userNfts);
        } else {
          setNfts([]);
        }
      } catch (error) {
        console.error('Error loading NFTs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadNFTs();
  }, [publicKey]);
  
  return (
    <div className="bg-black min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Your Music NFT Collection</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            View and manage the Music NFTs you own. These are digital assets stored on the Solana blockchain.
          </p>
        </div>
        
        {/* DEVNET Instructions - Enhanced */}
        <div className="bg-purple-900 bg-opacity-30 rounded-lg p-6 mb-10 text-white">
          <h2 className="text-xl font-semibold mb-3">⚠️ Important: Viewing NFTs in Phantom Wallet</h2>
          <div className="mb-4">
            <p className="mb-2"><span className="font-bold text-purple-300">Step 1:</span> Open Phantom and click the gear icon ⚙️ to open Settings</p>
            <p className="mb-2"><span className="font-bold text-purple-300">Step 2:</span> Select "Developer Settings"</p>
            <p className="mb-2"><span className="font-bold text-purple-300">Step 3:</span> Click "Change Network" and select "Devnet"</p>
            <p className="mb-2"><span className="font-bold text-purple-300">Step 4:</span> Your NFTs will appear in the "Collectibles" tab</p>
          </div>
          <div className="text-sm text-purple-200 border-t border-purple-700 pt-3">
            Note: Newly purchased NFTs might take a few moments to appear in your wallet. If they're not showing up,
            try refreshing your browser and wallet.
          </div>
        </div>
        
        {/* Network Error Alert */}
        {networkError && (
          <div className="bg-red-900 bg-opacity-70 rounded-lg p-4 mb-6 text-white">
            <h3 className="font-bold text-lg mb-1">⚠️ {networkError}</h3>
            <p className="text-sm">
              To view your on-chain NFTs, make sure Phantom wallet is connected to Devnet following the steps above.
            </p>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : publicKey ? (
          <>
            {/* On-chain NFTs Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                On-Chain NFTs ({onChainNfts.length})
              </h2>
              
              {onChainNfts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {onChainNfts.map((nft) => (
                    <div key={nft.address.toString()} className="card bg-base-100 shadow-xl overflow-hidden group h-full">
                      <figure className="relative aspect-square">
                        <img 
                          src={nft.json?.image || '/share-music.png'} 
                          alt={nft.name || 'NFT'} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback image if loading fails
                            (e.target as HTMLImageElement).src = '/share-music.png';
                          }}
                        />
                        <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-md">
                          On-chain
                        </div>
                      </figure>
                      <div className="card-body p-4">
                        <h3 className="card-title text-lg">{nft.name || 'Unnamed NFT'}</h3>
                        <p className="text-sm text-gray-400">{nft.json?.description || 'No description'}</p>
                        
                        {/* Added audio player if animation_url exists */}
                        {nft.json?.animation_url && (
                          <div className="mt-3 mb-1">
                            <audio 
                              controls 
                              className="w-full h-8"
                              src={nft.json.animation_url}
                            >
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        )}
                        
                        <div className="mt-3 pt-3 border-t border-gray-700 flex flex-col gap-2">
                          <a 
                            href={`https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            View on Solana Explorer
                          </a>
                          <p className="text-xs text-gray-500 break-all">
                            {nft.address.toString().substring(0, 16)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 text-center">
                  <p className="text-gray-300">
                    No on-chain NFTs found on Devnet. Purchase NFTs from the marketplace to get started.
                  </p>
                </div>
              )}
            </div>
            
            {/* App NFTs Section */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-6">
                {onChainNfts.length > 0 ? 'Off-Chain NFTs' : 'Your NFTs'}
                ({nfts.length})
              </h2>
              
              {nfts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {nfts.map((nft) => (
                    <MusicNftCard key={nft.mint} nft={nft} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-900 rounded-lg">
                  <h2 className="text-2xl font-semibold text-white mb-4">No NFTs Found</h2>
                  <p className="text-gray-400 mb-6">
                    You don't own any Music NFTs yet. Visit the marketplace to discover and purchase NFTs!
                  </p>
                  <Link 
                    href="/music-nft/marketplace" 
                    className="btn btn-primary"
                  >
                    Browse Marketplace
                  </Link>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-gray-900 rounded-lg">
            <h2 className="text-2xl font-semibold text-white mb-4">Wallet Not Connected</h2>
            <p className="text-gray-400 mb-6">
              Please connect your wallet to view your NFT collection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 