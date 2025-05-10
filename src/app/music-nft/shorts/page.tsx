'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';
import { IconPlayerPlay, IconPlayerPause, IconHeart, IconInfoCircle, IconShoppingCart } from '@tabler/icons-react';
import { AppLayout } from '@/components/ui/ui-layout';
import { MusicNftData } from '@/components/music-nft/MusicNftCard';
import Link from 'next/link';
import { fetchNFTsFromPinata } from '@/services/pinata';
import { buyNFT, mintNFTCopy } from '@/services/solana';
import { Connection } from '@solana/web3.js';

// Define keyframes animation
const vinylRotateKeyframes = `
  @keyframes vinylRotate {
    from {
      transform: translate(-50%, -50%) rotate(0deg);
    }
    to {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }
  
  @keyframes counterRotate {
    from {
      transform: translate(-50%, -50%) rotate(0deg);
    }
    to {
      transform: translate(-50%, -50%) rotate(-360deg);
    }
  }
`;

interface MusicShortCardProps {
  nft: MusicNftData;
  active: boolean;
  onBuy: () => void;
  onMint: () => void;
}

function MusicShortCard({ nft, active, onBuy, onMint }: MusicShortCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const vinylRef = useRef<HTMLDivElement>(null);
  const { connected } = useWallet();
  
  // Auto-hide controls after a delay
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showControls) {
      timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showControls]);
  
  // Set up audio element and load audio
  useEffect(() => {
    if (audioRef.current) {
      // Add event handlers
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onloadeddata = () => {
        console.log('Audio loaded:', nft.title);
        setAudioLoaded(true);
      };
      audioRef.current.onerror = () => {
        console.error('Audio error for:', nft.title);
        setAudioError(true);
      };
      
      // Try to load the audio
      audioRef.current.load();
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.onended = null;
        audioRef.current.onloadeddata = null;
        audioRef.current.onerror = null;
      }
    };
  }, [nft.audioUrl]);
  
  // Handle auto-play only when card becomes active (and user hasn't manually controlled playback)
  useEffect(() => {
    // Only auto-play if this card is active and user hasn't interacted
    if (active && !userInteracted && audioRef.current && audioLoaded && !audioError) {
      console.log('Attempting auto-play for:', nft.title);
      
      // We need to manually set volume to ensure it's audible
      if (audioRef.current) {
        audioRef.current.volume = 1.0;
      }
      
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Auto-play started successfully');
            setIsPlaying(true);
          })
          .catch(error => {
            console.error('Auto-play failed:', error);
        setIsPlaying(false);
          });
      }
    }
    
    // Pause when card becomes inactive
    if (!active && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
  }, [active, audioLoaded, audioError, userInteracted, nft.title]);
  
  // Vinyl disc rotation animation
  useEffect(() => {
    if (vinylRef.current) {
      if (isPlaying) {
        vinylRef.current.style.animationPlayState = 'running';
      } else {
        vinylRef.current.style.animationPlayState = 'paused';
      }
    }
  }, [isPlaying]);
  
  // Explicit control for play/pause state to ensure UI reflects actual audio state
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      // Ensure audio is actually playing
      if (audioRef.current.paused) {
        console.log('Audio should be playing but is paused - restarting');
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Play restart failed:', error);
            setIsPlaying(false);
          });
        }
      }
    } else {
      // Ensure audio is actually paused
      if (!audioRef.current.paused) {
        console.log('Audio should be paused but is playing - pausing');
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);
  
  const togglePlayPause = () => {
    // Mark that user has manually controlled playback
    setUserInteracted(true);
    
    if (audioError) {
      toast.error('Could not play audio. The file may be unavailable.');
      return;
    }
    
    if (!audioRef.current) {
      console.error('Audio element not available');
      return;
    }
    
    console.log('Toggle play/pause, current state:', isPlaying, 'audio paused:', audioRef.current.paused);
    
    // Toggle the playing state - the effect above will handle the actual audio control
    setIsPlaying(!isPlaying);
  };
  
  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent element clicks
    
    if (!connected) {
      toast.error('Please connect your wallet to buy NFTs');
      return;
    }
    
    onBuy();
  };
  
  const handleMint = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent element clicks
    
    if (!connected) {
      toast.error('Please connect your wallet to mint NFTs');
      return;
    }
    
    onMint();
  };
  
  const handleCardClick = () => {
    togglePlayPause();
    setShowControls(true);
  };
  
  return (
    <div 
      className="relative h-full w-full overflow-hidden bg-gradient-to-b from-gray-900 to-black"
      onClick={handleCardClick}
    >
      {/* Add keyframes animation to document */}
      <style jsx global>{vinylRotateKeyframes}</style>
      
      {/* Background image - blurred */}
      <div className="absolute inset-0">
        <img
          src={nft.coverArt}
          alt={nft.title}
          className="h-full w-full object-cover blur-md scale-110 opacity-30"
        />
        <div className="absolute inset-0 bg-black/70"></div>
      </div>
      
      {/* Audio element (hidden) */}
      <audio
        ref={audioRef}
        src={nft.audioUrl}
        loop
        preload="auto"
        className="hidden"
      />
      
      {/* Vinyl record player */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Turntable */}
        <div className="relative w-[75vw] max-w-sm aspect-square rounded-full bg-neutral-800 shadow-xl flex items-center justify-center mb-8">
          {/* Record grooves background */}
          <div className="absolute w-[95%] h-[95%] rounded-full bg-neutral-900 overflow-hidden">
            <div className="absolute inset-0 bg-[repeating-radial-gradient(circle,rgba(30,30,30,1)_2px,rgba(10,10,10,1)_3px)]"></div>
          </div>
          
          {/* Vinyl disc with cover art */}
          <div 
            ref={vinylRef}
            className="absolute top-1/2 left-1/2 w-[85%] h-[85%] rounded-full bg-black overflow-hidden shadow-lg"
            style={{
              transform: "translate(-50%, -50%)",
              animation: "vinylRotate 4s linear infinite",
              animationPlayState: isPlaying ? 'running' : 'paused',
            }}
          >
            {/* Vinyl grooves */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              {/* Concentric circles for vinyl grooves */}
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute rounded-full border border-gray-800" 
                  style={{
                    top: `${5 + i * 3}%`,
                    left: `${5 + i * 3}%`,
                    width: `${90 - i * 6}%`,
                    height: `${90 - i * 6}%`,
                  }}
                ></div>
              ))}
            </div>
            
            {/* Vinyl reflections */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/10"></div>
          </div>
          
          {/* Album art in fixed position */}
          <div className="absolute top-1/2 left-1/2 w-[55%] h-[55%] rounded-full overflow-hidden border-8 border-black z-10"
               style={{transform: "translate(-50%, -50%)"}}>
            <img
              src={nft.coverArt}
              alt={nft.title}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Center spindle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-300 z-20"></div>
          
          {/* Play button overlay */}
          {!isPlaying && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center z-30 border border-white/20">
              <IconPlayerPlay className="w-12 h-12 text-white" />
            </div>
          )}
          
          {/* Turntable arm */}
          <div className={`absolute top-[15%] right-[15%] w-[30%] h-2 bg-neutral-700 rounded transform origin-right rotate-${isPlaying ? '0' : '-15'} shadow-md transition-transform duration-700`}>
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full bg-red-500"></div>
          </div>
        </div>
        
        {/* Track info */}
        <div className="text-center text-white px-6 w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-1 truncate">{nft.title}</h2>
          <p className="text-lg text-white/70 mb-6">{nft.artist}</p>
          
          <div className="flex justify-center gap-3">
            {nft.forSale && (
                <button 
                className="btn btn-sm btn-primary"
                  onClick={handleBuy}
                >
                <IconShoppingCart className="w-4 h-4 mr-1" />
                <span>{nft.price} SOL</span>
                </button>
            )}
            
            <button 
              className="btn btn-sm btn-secondary"
              onClick={handleMint}
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
              <span>Mint NFT</span>
            </button>
            
            <Link 
              href={`/music-nft/details/${nft.mint}`}
              className="btn btn-sm border border-white/20 bg-black/30 hover:bg-black/50 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <IconInfoCircle className="w-4 h-4" />
              <span className="ml-1">Details</span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* NFT badge */}
      <div className="absolute top-6 right-6 z-10">
        <div className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
          <span>NFT</span>
        </div>
      </div>
      
      {/* Exit button */}
      <div className="absolute top-6 left-6 z-10">
        <Link href="/music-nft/marketplace" className="btn btn-circle btn-sm bg-black/50 border-white/20 text-white hover:bg-black/70">
          ✕
        </Link>
      </div>
    </div>
  );
}

export default function ShortsPage() {
  const { connected, publicKey, wallet } = useWallet();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nfts, setNfts] = useState<MusicNftData[]>([]);
  
  // Initialize Solana connection
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    'confirmed'
  );
  
  // Fetch NFTs from Pinata
  useEffect(() => {
    async function loadNFTs() {
      try {
        setLoading(true);
        const fetchedNfts = await fetchNFTsFromPinata();
        
        // Filter to include only NFTs with audio files
        const audioNfts = fetchedNfts.filter(nft => 
          nft.audioUrl && nft.audioUrl.trim() !== '' && 
          nft.coverArt && nft.coverArt.trim() !== ''
        );
        
        if (audioNfts.length === 0) {
          toast.error('No audio NFTs found');
        }
        
        setNfts(audioNfts);
      } catch (error) {
        console.error('Error loading NFTs:', error);
        toast.error('Failed to load NFTs');
      } finally {
        setLoading(false);
      }
    }
    
    loadNFTs();
  }, []);
  
  const handlers = useSwipeable({
    onSwipedUp: () => {
      if (currentIndex < nfts.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    },
    onSwipedDown: () => {
      if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true
  });
  
  const handleBuyNft = async () => {
    if (!connected || !wallet || !publicKey) {
      toast.error('Please connect your wallet to buy NFTs');
      return;
    }
    
    const nft = nfts[currentIndex];
    
    // Call the real buy function
    try {
      toast.loading('Initiating purchase...', { id: 'buying-nft' });
      const success = await buyNFT(connection, wallet, nft);
      
      toast.dismiss('buying-nft');
      if (success) {
        toast.success(`Successfully purchased "${nft.title}"`);
      }
    } catch (error) {
      toast.dismiss('buying-nft');
      toast.error('Error purchasing NFT');
      console.error('Buy error:', error);
    }
  };
  
  const handleMintNft = async () => {
    if (!connected || !wallet || !publicKey) {
      toast.error('Please connect your wallet to mint NFTs');
      return;
    }
    
    const nft = nfts[currentIndex];
    
    // Call the mint function
    try {
      toast.loading('Initiating minting process...', { id: 'minting-nft' });
      const success = await mintNFTCopy(connection, wallet, nft);
      
      toast.dismiss('minting-nft');
      if (success) {
        toast.success(`Successfully minted "${nft.title}" to your wallet!`);
      }
    } catch (error) {
      toast.dismiss('minting-nft');
      toast.error('Error minting NFT');
      console.error('Mint error:', error);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (e.key === 'ArrowDown' && currentIndex < nfts.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };
  
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-white"></span>
      </div>
    );
  }
  
  if (nfts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <div className="text-center p-6">
          <IconPlayerPlay className="w-16 h-16 mx-auto mb-4 text-white" />
          <h2 className="text-2xl font-bold mb-2">No Audio NFTs Found</h2>
          <p className="mb-6">There are no music NFTs available in the shorts format.</p>
          <Link href="/music-nft/marketplace" className="btn btn-primary">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="fixed inset-0 bg-black z-[100]"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      {...handlers}
    >
      {/* Shorts viewer */}
      <div className="h-full overflow-hidden">
        {nfts.map((nft, index) => (
          <div
            key={nft.mint}
            className={`h-full w-full absolute transition-transform duration-500 ease-in-out ${
              index === currentIndex ? 'translate-y-0' : 
              index < currentIndex ? '-translate-y-full' : 'translate-y-full'
            }`}
          >
            <MusicShortCard
              nft={nft}
              active={index === currentIndex}
              onBuy={handleBuyNft}
              onMint={handleMintNft}
            />
          </div>
        ))}
      </div>
      
      {/* Navigation indicator */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col items-center gap-1">
        {nfts.map((_, index) => (
          <div
            key={index}
            className={`w-1.5 h-${index === currentIndex ? '6' : '1.5'} rounded-full transition-all ${
              index === currentIndex ? 'bg-white' : 'bg-white/40'
            }`}
          ></div>
        ))}
      </div>
      
      {/* Exit button */}
      <div className="absolute top-6 left-6 z-50">
        <Link href="/music-nft/marketplace" className="btn btn-circle btn-sm bg-black/50 border-white/20 text-white hover:bg-black/70">
          ✕
        </Link>
      </div>
      
      {/* Swipe indicators */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white opacity-70 text-sm pointer-events-none">
        Swipe up/down or use arrow keys
      </div>
    </div>
  );
} 