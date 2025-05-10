'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';
import { IconPlayerPlay, IconPlayerPause, IconUser, IconCoin, IconCalendar } from '@tabler/icons-react';
import { AppLayout, LoadingSpinner, ErrorMessage } from '@/components/ui/ui-layout';
import { MusicNftData } from '@/components/music-nft/MusicNftCard';
import Link from 'next/link';

interface NftDetailsClientProps {
  nft: MusicNftData | undefined;
  mintId: string;
}

export default function NftDetailsClient({ nft, mintId }: NftDetailsClientProps) {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  
  const [loading, setLoading] = useState(false);
  const [currentNft, setCurrentNft] = useState<MusicNftData | null>(nft || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [listPrice, setListPrice] = useState('');
  const [showListDialog, setShowListDialog] = useState(false);
  
  const isOwner = publicKey?.toBase58() === currentNft?.owner;
  
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
  
  const handleBuy = () => {
    if (!currentNft) return;
    
    if (!connected) {
      toast.error('Please connect your wallet to buy NFTs');
      return;
    }
    
    // In a real app, this would call the Solana program
    toast.success(`NFT purchase initiated for ${currentNft.mint}`);
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
        <LoadingSpinner />
      </AppLayout>
    );
  }
  
  if (!currentNft) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <ErrorMessage message="NFT not found" />
          <div className="mt-4">
            <Link href="/music-nft/marketplace" className="btn btn-primary">
              Back to Marketplace
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
        {/* Left column - Image and audio */}
        <div>
          <div className="relative aspect-square rounded-lg overflow-hidden shadow-xl">
            <img 
              src={currentNft.coverArt}
              alt={currentNft.title}
              className="w-full h-full object-cover"
            />
            <button 
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <IconPlayerPause className="w-20 h-20 text-white" />
              ) : (
                <IconPlayerPlay className="w-20 h-20 text-white" />
              )}
            </button>
          </div>
          
          {/* Audio controls */}
          <div className="mt-4">
            <div className="flex justify-between items-center bg-base-200 p-3 rounded-lg">
              <div className="flex items-center">
                <button
                  className="btn btn-circle btn-ghost"
                  onClick={togglePlay}
                >
                  {isPlaying ? <IconPlayerPause /> : <IconPlayerPlay />}
                </button>
                <span className="ml-2">{currentNft.title}</span>
              </div>
              <span className="text-sm opacity-70">30 sec clip</span>
            </div>
          </div>
        </div>
        
        {/* Right column - Details */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{currentNft.title}</h1>
          <h2 className="text-xl text-primary mb-6">by {currentNft.artist}</h2>
          
          {/* Sale status */}
          <div className="mb-6">
            {currentNft.forSale ? (
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm opacity-70">Current price</div>
                  <div className="text-2xl font-bold">{Number(currentNft.price).toFixed(2)} SOL</div>
                </div>
                
                {!isOwner && (
                  <button
                    className="btn btn-primary"
                    onClick={handleBuy}
                  >
                    Buy now
                  </button>
                )}
                
                {isOwner && (
                  <button
                    className="btn btn-error"
                    onClick={handleUnlist}
                  >
                    Remove from sale
                  </button>
                )}
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <div className="badge badge-lg">Not for sale</div>
                </div>
                
                {isOwner && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowListDialog(true)}
                  >
                    List for sale
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* NFT details */}
          <div className="space-y-4">
            <div className="flex items-center">
              <IconUser className="w-5 h-5 mr-2 opacity-70" />
              <div>
                <div className="text-sm opacity-70">Owner</div>
                <div className="font-mono text-sm">{currentNft.owner.substring(0, 8)}...{currentNft.owner.substring(currentNft.owner.length - 8)}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <IconUser className="w-5 h-5 mr-2 opacity-70" />
              <div>
                <div className="text-sm opacity-70">Creator</div>
                <div className="font-mono text-sm">{currentNft.creator.substring(0, 8)}...{currentNft.creator.substring(currentNft.creator.length - 8)}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <IconCoin className="w-5 h-5 mr-2 opacity-70" />
              <div>
                <div className="text-sm opacity-70">Mint</div>
                <div className="font-mono text-sm">{currentNft.mint.substring(0, 8)}...{currentNft.mint.substring(currentNft.mint.length - 8)}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <IconCalendar className="w-5 h-5 mr-2 opacity-70" />
              <div>
                <div className="text-sm opacity-70">Created</div>
                <div>April 15, 2023</div>
              </div>
            </div>
          </div>
          
          {/* Back button */}
          <div className="mt-8">
            <Link href="/music-nft/marketplace" className="btn">
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
      
      {/* List for sale dialog */}
      {showListDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-base-100 p-6 rounded-lg w-96">
            <h3 className="font-bold text-lg mb-4">List NFT for sale</h3>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Price (SOL)</span>
              </label>
              <input 
                type="number" 
                className="input input-bordered" 
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
                min="0.001"
                step="0.001"
              />
            </div>
            <div className="modal-action mt-6">
              <button 
                className="btn btn-ghost" 
                onClick={() => setShowListDialog(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
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