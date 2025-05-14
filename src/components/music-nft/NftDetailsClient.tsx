'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';
import { IconPlayerPlay, IconPlayerPause, IconUser, IconCoin, IconCalendar, IconArrowLeft } from '@tabler/icons-react';
import { AppLayout, LoadingSpinner, ErrorMessage } from '@/components/ui/ui-layout';
import { MusicNftData } from '@/components/music-nft/MusicNftCard';
import { fetchNFTsFromPinata } from '@/services/pinata';
import { buyNFT } from '@/services/solana';
import Link from 'next/link';

interface NftDetailsClientProps {
  nft?: MusicNftData; // Make nft optional since we'll fetch it
  mintId: string;
}

export default function NftDetailsClient({ nft: initialNft, mintId }: NftDetailsClientProps) {
  const router = useRouter();
  const { publicKey, connected, wallet } = useWallet();
  const { connection } = useConnection();
  
  const [loading, setLoading] = useState(!initialNft);
  const [currentNft, setCurrentNft] = useState<MusicNftData | null>(initialNft || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [listPrice, setListPrice] = useState('');
  const [showListDialog, setShowListDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const isOwner = publicKey?.toBase58() === currentNft?.owner;
  
  // Fetch NFT data from Pinata if not provided
  useEffect(() => {
    async function fetchNftData() {
      if (initialNft) {
        setCurrentNft(initialNft);
        return;
      }
      
      setLoading(true);
      try {
        // Fetch all NFTs from Pinata
        const nfts = await fetchNFTsFromPinata();
        
        // Find the NFT with matching mint ID
        const foundNft = nfts.find(nft => nft.mint === mintId);
        
        if (foundNft) {
          console.log('Found NFT:', foundNft);
          setCurrentNft(foundNft);
        } else {
          console.error('NFT not found with mint ID:', mintId);
          toast.error('NFT not found');
        }
      } catch (error) {
        console.error('Error fetching NFT data:', error);
        toast.error('Failed to load NFT details');
      } finally {
        setLoading(false);
      }
    }
    
    fetchNftData();
  }, [initialNft, mintId]);

  const togglePlay = () => {
    if (!currentNft) return;
    
    if (!audioElement) {
      const audio = new Audio(currentNft.audioUrl);
      setAudioElement(audio);
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(error => console.error('Audio playback error:', error));
    } else {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play()
          .then(() => setIsPlaying(true))
          .catch(error => console.error('Audio playback error:', error));
      }
    }
  };
  
  const handleBuy = async () => {
    if (!currentNft) return;
    if (processing) return;
    
    if (!connected || !wallet) {
      toast.error('Please connect your wallet to buy NFTs');
      return;
    }
    
    try {
      setProcessing(true);
      
      // Call the Solana service to buy the NFT
      const success = await buyNFT(connection, wallet, currentNft);
      
      if (success) {
        toast.success('NFT purchased successfully! Redirecting to profile...');
        
        // Give the user a moment to see the success message, then redirect
        setTimeout(() => {
          router.push('/profile?refresh=true');
        }, 3000);
      }
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error('An error occurred while processing your purchase');
    } finally {
      setProcessing(false);
    }
  };
  
  const handleList = () => {
    if (!currentNft) return;
    
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    const priceInSol = parseFloat(listPrice);
    if (!isNaN(priceInSol) && priceInSol > 0) {
      // In a real app, this would call the Solana program
      toast.success(`NFT listed for ${priceInSol} SOL`);
      setShowListDialog(false);
      setListPrice('');
      
      // Update the local state for demo purposes
      setCurrentNft({
        ...currentNft,
        forSale: true,
        price: priceInSol
      });
    } else {
      toast.error('Please enter a valid price');
    }
  };
  
  const handleUnlist = () => {
    if (!currentNft) return;
    
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    // In a real app, this would call the Solana program
    toast.success('NFT removed from sale');
    
    // Update the local state for demo purposes
    setCurrentNft({
      ...currentNft,
      forSale: false,
      price: 0
    });
  };
  
  // Stop audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        setAudioElement(null);
      }
    };
  }, [audioElement]);
  
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner />
          <span className="ml-4 text-lg font-medium">Loading NFT details...</span>
        </div>
      </AppLayout>
    );
  }
  
  if (!currentNft) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <ErrorMessage message="NFT not found" />
          <div className="mt-4">
            <Link href="/music-nft/marketplace" className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium">
              <IconArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/music-nft/marketplace" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <IconArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-card rounded-3xl overflow-hidden border border-border shadow-xl p-6">
          {/* Left column - Image and audio */}
          <div>
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-xl">
              <img 
                src={currentNft.coverArt}
                alt={currentNft.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-50"></div>
              <button 
                className="absolute inset-0 flex items-center justify-center transition-opacity"
                onClick={togglePlay}
              >
                <div className="bg-primary/80 backdrop-blur-sm w-20 h-20 rounded-full flex items-center justify-center transform hover:scale-110 transition-transform">
                  {isPlaying ? (
                    <IconPlayerPause className="w-10 h-10 text-white" />
                  ) : (
                    <IconPlayerPlay className="w-10 h-10 text-white" />
                  )}
                </div>
              </button>
            </div>
            
            {/* Audio controls */}
            <div className="mt-4">
              <div className="flex justify-between items-center bg-background/50 p-4 rounded-xl border border-border backdrop-blur-sm">
                <div className="flex items-center">
                  <button
                    className="p-2 rounded-full bg-primary/10 text-primary mr-3"
                    onClick={togglePlay}
                  >
                    {isPlaying ? <IconPlayerPause className="w-5 h-5" /> : <IconPlayerPlay className="w-5 h-5" />}
                  </button>
                  <div>
                    <div className="font-medium">{currentNft.title}</div>
                    <div className="text-sm text-muted-foreground">{currentNft.artist}</div>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">Preview</span>
              </div>
            </div>
          </div>
          
          {/* Right column - Details */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{currentNft.title}</h1>
            <h2 className="text-xl text-primary mb-6">by {currentNft.artist}</h2>
            
            {/* Sale status */}
            <div className="p-6 bg-background/50 rounded-xl border border-border backdrop-blur-sm mb-6">
              {currentNft.forSale ? (
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Current price</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {Number(currentNft.price).toFixed(2)} SOL
                    </div>
                  </div>
                  
                  {!isOwner && (
                    <button
                      className={`inline-flex items-center px-5 py-3 rounded-lg ${
                        processing 
                          ? "bg-muted text-muted-foreground cursor-not-allowed" 
                          : "bg-primary hover:bg-primary/90 text-primary-foreground"
                      } font-medium shadow-lg shadow-primary/20 transition-all`}
                      onClick={handleBuy}
                      disabled={processing}
                    >
                      {processing ? (
                        <>
                          <div className="w-4 h-4 mr-2 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        'Buy Now'
                      )}
                    </button>
                  )}
                  
                  {isOwner && (
                    <button
                      className="inline-flex items-center px-5 py-3 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium"
                      onClick={handleUnlist}
                    >
                      Remove from sale
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-background border border-border text-sm font-medium">
                      Not for sale
                    </div>
                  </div>
                  
                  {isOwner && (
                    <button
                      className="inline-flex items-center px-5 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/20"
                      onClick={() => setShowListDialog(true)}
                    >
                      List for sale
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* NFT details */}
            <div className="p-6 bg-background/50 rounded-xl border border-border backdrop-blur-sm space-y-4">
              <h3 className="text-lg font-medium mb-4">NFT Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <IconUser className="w-5 h-5 mr-3 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Owner</div>
                    <div className="font-mono text-sm">{currentNft.owner.substring(0, 8)}...{currentNft.owner.substring(currentNft.owner.length - 8)}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <IconUser className="w-5 h-5 mr-3 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Creator</div>
                    <div className="font-mono text-sm">{currentNft.creator.substring(0, 8)}...{currentNft.creator.substring(currentNft.creator.length - 8)}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <IconCoin className="w-5 h-5 mr-3 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Mint</div>
                    <div className="font-mono text-sm">{currentNft.mint.substring(0, 8)}...{currentNft.mint.substring(currentNft.mint.length - 8)}</div>
                  </div>
                </div>
                
                {currentNft.genre && (
                  <div className="flex items-center">
                    <IconCalendar className="w-5 h-5 mr-3 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Genre</div>
                      <div className="capitalize">{currentNft.genre}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* List for sale dialog */}
      {showListDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-xl shadow-xl w-96 border border-border">
            <h3 className="text-xl font-bold mb-4">List NFT for sale</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Price (SOL)
              </label>
              <input 
                type="number" 
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none" 
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
                min="0.001"
                step="0.001"
                placeholder="Enter price in SOL"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                className="px-4 py-2 rounded-lg bg-background border border-border hover:bg-muted text-foreground transition-colors" 
                onClick={() => setShowListDialog(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors" 
                onClick={handleList}
                disabled={!listPrice || parseFloat(listPrice) <= 0}
              >
                List for sale
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
} 