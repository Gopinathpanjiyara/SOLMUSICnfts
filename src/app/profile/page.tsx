'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { IconMusic, IconCoin, IconPlayerPlay, IconPlayerPause, IconEdit, IconTrash, IconUser, IconCircleCheck, IconWallet, IconReceipt, IconSend, IconShoppingCart, IconRefresh } from '@tabler/icons-react';
import { AppHero, AppLayout, LoadingSpinner } from '@/components/ui/ui-layout';
import { MusicNftData } from '@/components/music-nft/MusicNftCard';
import { fetchNFTsFromPinata } from '@/services/pinata';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { TransactionData } from '@/lib/transaction-utils';
import { loadUserProfile, recordTransaction } from '@/lib/user-profile-manager';

// solMusic Logo component
const SolMusicLogo = () => (
  <div className="flex items-center">
    <svg width="40" height="40" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
      <rect width="60" height="60" rx="12" fill="url(#paint0_linear)" />
      <path d="M15 20C15 17.2386 17.2386 15 20 15H40C42.7614 15 45 17.2386 45 20V40C45 42.7614 42.7614 45 40 45H20C17.2386 45 15 42.7614 15 40V20Z" fill="url(#paint1_radial)" />
      <path d="M26 22V35.5C26 36.8807 24.8807 38 23.5 38C22.1193 38 21 36.8807 21 35.5C21 34.1193 22.1193 33 23.5 33C24.1 33 24.6 33.2 25 33.5V25L36 22V31.5C36 32.8807 34.8807 34 33.5 34C32.1193 34 31 32.8807 31 31.5C31 30.1193 32.1193 29 33.5 29C34.1 29 34.6 29.2 35 29.5V24.5L26 27V22Z" fill="white" />
      <defs>
        <linearGradient id="paint0_linear" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(var(--primary))" />
          <stop offset="1" stopColor="hsl(var(--secondary))" />
        </linearGradient>
        <radialGradient id="paint1_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(30 30) rotate(90) scale(15)">
          <stop stopColor="white" stopOpacity="0.2" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
    <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">solMusic</span>
  </div>
);

export default function ProfilePage() {
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const [nfts, setNfts] = useState<MusicNftData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingNftId, setPlayingNftId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'owned' | 'sold' | 'purchased'>('owned');
  const [soldNfts, setSoldNfts] = useState<TransactionData[]>([]);
  const [purchasedNfts, setPurchasedNfts] = useState<TransactionData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [redirectFromBuy, setRedirectFromBuy] = useState(false);
  const [pinataProfileLoaded, setPinataProfileLoaded] = useState(false);

  // Check if we were redirected from a purchase
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wasConnected = sessionStorage.getItem('walletConnected') === 'true';
      const lastWalletAddress = sessionStorage.getItem('lastWalletAddress');
      
      // If we have stored wallet info but aren't currently connected, we've been redirected
      if (wasConnected && lastWalletAddress && !connected) {
        setRedirectFromBuy(true);
        console.log('Detected redirect from purchase, wallet connection may have been lost');
      } else if (connected && publicKey) {
        // If we are connected, clear the temporary session data
        sessionStorage.removeItem('walletConnected');
        sessionStorage.removeItem('lastWalletAddress');
      }
    }
  }, [connected, publicKey]);

  // Define a function to load NFTs
  const loadNFTs = async (forceRefresh: boolean = false) => {
    try {
      if (!connected || !publicKey) {
        setNfts([]);
        setSoldNfts([]);
        setPurchasedNfts([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Always clear the cache when forcing a refresh to ensure fresh data
        if (forceRefresh) {
          console.log('Forced refresh requested, will fetch from Pinata');
          // We'll keep this for NFT data which is still using cache
          localStorage.removeItem('_nft_cache_data');
          sessionStorage.removeItem('_refresh_transactions');
        }
        
        // Pass forceRefresh parameter to fetchNFTsFromPinata
        const fetchedNfts = await fetchNFTsFromPinata(forceRefresh);
        
        // Check if there are any pending NFT updates in session storage
        let pendingUpdates: MusicNftData[] = [];
        try {
          const pendingNFTsJson = sessionStorage.getItem('_pending_nft_updates');
          if (pendingNFTsJson) {
            pendingUpdates = JSON.parse(pendingNFTsJson);
            console.log(`Found ${pendingUpdates.length} pending NFT updates in session storage`);
            // Clear pending updates after retrieving them
            sessionStorage.removeItem('_pending_nft_updates');
          }
        } catch (error) {
          console.error('Error processing pending NFT updates:', error);
        }
        
        // Merge pending updates with fetched NFTs
        // Replace any fetched NFT with its pending update version if mint matches
        const mergedNfts = [...fetchedNfts];
        
        // Process each pending update
        pendingUpdates.forEach(pendingNft => {
          const existingIndex = mergedNfts.findIndex(nft => nft.mint === pendingNft.mint);
          if (existingIndex >= 0) {
            // Replace the existing NFT with the pending update
            mergedNfts[existingIndex] = pendingNft;
          } else {
            // Add the new NFT to the list
            mergedNfts.push(pendingNft);
          }
        });
        
        // Filter NFTs to only include those owned by the current user
        const userAddress = publicKey.toBase58();
        console.log(`Loading NFTs for user: ${userAddress}`);
        const userNfts = mergedNfts.filter(nft => nft.owner === userAddress);
        console.log(`Found ${userNfts.length} NFTs for user (including ${pendingUpdates.length} pending updates)`);
        setNfts(userNfts);
        
        // Load transaction data using the profile manager
        const { username, soldNfts, purchasedNfts } = await loadUserProfile(userAddress);
        
        // Update state with loaded data
        if (username) {
          setUsername(username);
        }
        
        setSoldNfts(soldNfts);
        setPurchasedNfts(purchasedNfts);
        
        console.log(`Profile data: ${soldNfts.length} sold, ${purchasedNfts.length} purchased`);
        
      } catch (error) {
        console.error('Error fetching from Pinata:', error);
        toast.error('Failed to load NFTs. Please try again later.');
        setNfts([]);
        setSoldNfts([]);
        setPurchasedNfts([]);
      }
    } catch (error) {
      console.error('Error loading NFTs:', error);
      toast.error('Failed to load your NFTs');
      setNfts([]);
      setSoldNfts([]);
      setPurchasedNfts([]);
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not connected and get username
  useEffect(() => {
    if (!connected) {
      // We keep this separate from the if(connected) check below
      // to allow the UI to show the "connect wallet" message
    } else if (publicKey) {
      // Username and profile data will be loaded by WalletProfileAdapter 
      // and in the loadNFTs function
    }
  }, [connected, publicKey]);

  // New function to update username with profile manager
  const updateUsername = () => {
    if (!publicKey) return;
    
    const walletAddress = publicKey.toBase58();
    const newUsername = window.prompt('Enter new username:', username || '');
    
    if (newUsername) {
      // This would need a new function in the profile manager to update username
      // For now, we'll just show a message
      toast.error('Username updates are not supported in this version');
    }
  };

  // Fetch NFTs only when connected changes
  useEffect(() => {
    // Don't attempt to load NFTs on server side
    if (typeof window === 'undefined') return;
    
    if (connected) {
      // Always force a refresh when loading the profile
      loadNFTs(true);
    } else {
      setNfts([]);
      setSoldNfts([]);
      setPurchasedNfts([]);
      setLoading(false);
    }
  }, [connected, publicKey]);

  // Stop audio when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }
    };
  }, [currentAudio]);

  const togglePlay = (nft: MusicNftData) => {
    // If we already have an audio playing, stop it
    if (currentAudio) {
      currentAudio.pause();
      
      // If we're clicking the same NFT that's currently playing, just stop it
      if (playingNftId === nft.mint) {
        setCurrentAudio(null);
        setPlayingNftId(null);
        return;
      }
    }
    
    // Play the new audio
    const audio = new Audio(nft.audioUrl);
    audio.play().catch(error => console.error('Audio playback error:', error));
    
    // Set up event listener for when the audio ends
    audio.onended = () => {
      setCurrentAudio(null);
      setPlayingNftId(null);
    };
    
    setCurrentAudio(audio);
    setPlayingNftId(nft.mint);
  };

  const handleListNft = (nft: MusicNftData) => {
    // In a real app, this would call a Solana program to list the NFT
    toast.success(`${nft.title} listed for sale at ${nft.price} SOL`);
  };

  const handleUnlistNft = (nft: MusicNftData) => {
    // In a real app, this would call a Solana program to unlist the NFT
    toast.success(`${nft.title} removed from sale`);
  };

  // Format date 
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate statistics
  const totalNfts = nfts.length;
  const totalValue = nfts.reduce((sum, nft) => sum + (Number(nft.price) || 0), 0);
  const listedNfts = nfts.filter(nft => nft.forSale).length;
  const createdNfts = nfts.filter(nft => nft.creator === publicKey?.toBase58()).length;
  const totalSold = soldNfts.length;
  const totalPurchased = purchasedNfts.length;
  const soldValue = soldNfts.reduce((sum, transaction) => sum + transaction.price, 0);
  const purchasedValue = purchasedNfts.reduce((sum, transaction) => sum + transaction.price, 0);

  // Add a refresh button to manually reload NFTs
  const refreshNFTs = () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    toast.loading('Refreshing your NFTs...', { id: 'refreshing-nfts' });
    
    // Always force a refresh by clearing the cache
    loadNFTs(true).then(() => {
      toast.dismiss('refreshing-nfts');
      toast.success('NFTs refreshed successfully!');
      setIsRefreshing(false);
    }).catch((error) => {
      toast.dismiss('refreshing-nfts');
      toast.error('Failed to refresh NFTs');
      console.error('Error refreshing NFTs:', error);
      setIsRefreshing(false);
    });
  };

  // Check for refresh parameters in URL
  useEffect(() => {
    // Only run this on client side
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const shouldRefresh = urlParams.get('refresh') === 'true';
      
      if (shouldRefresh && connected && publicKey) {
        console.log('Detected refresh parameter, refreshing data automatically');
        // Clear the parameter from URL without page reload
        window.history.replaceState({}, '', window.location.pathname);
        // Force refresh data
        refreshNFTs();
      }
    }
  }, [connected, publicKey]);

  if (!connected) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12 mt-8">
          <IconWallet className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Wallet not connected</h2>
          <p className="text-muted-foreground max-w-md text-center mb-6">
            {redirectFromBuy 
              ? "You were redirected after a purchase, but your wallet connection was lost. Please reconnect your wallet using the button in the header to view your NFTs."
              : "Connect your wallet using the button in the header to view your NFTs and transaction history."
            }
          </p>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="py-12 mt-8">
        <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6">
        {/* User Profile Header - Matching with app theme */}
        <div className="relative mb-16 bg-background/60 rounded-3xl overflow-hidden shadow-2xl border border-border">
          {/* Abstract background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary))_0%,transparent_50%)]"></div>
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_60%,hsl(var(--secondary))_0%,transparent_50%)]"></div>
        </div>
          
          <div className="relative pt-16 pb-12 px-8">
            <div className="absolute top-6 right-6 flex items-center gap-4">
              <button 
                onClick={refreshNFTs}
                disabled={isRefreshing}
                className={`p-2 rounded-full transition-all duration-300 ${
                  isRefreshing ? 'bg-muted cursor-not-allowed' : 'bg-background hover:bg-muted'
                }`}
                title="Refresh NFT data"
              >
                <IconRefresh className={`w-5 h-5 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <SolMusicLogo />
            </div>
            
            <div className="flex flex-col lg:flex-row gap-10 items-start">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-4 border-background ring-4 ring-primary/30 shadow-xl transform -rotate-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-80"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <IconUser className="w-20 h-20 text-white" />
                  </div>
                </div>
              </div>
              
              {/* User info */}
            <div className="flex-1">
                <div className="flex flex-col lg:flex-row gap-6 justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-5xl font-extrabold text-foreground tracking-tight">
                        {username || "User"}
                      </h1>
                    <button 
                        className="btn btn-circle btn-sm bg-background border-border hover:bg-muted"
                      onClick={updateUsername}
                      title="Edit username"
                    >
                        <IconEdit className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                    <div className="flex items-center text-success mb-4">
                      <IconCircleCheck className="w-5 h-5 mr-2" />
                      <span className="font-medium">Verified solMusic Collector</span>
                </div>
                
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-background backdrop-blur-sm border border-border">
                      <IconWallet className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="font-mono text-muted-foreground text-sm">{publicKey?.toBase58().slice(0, 6)}...{publicKey?.toBase58().slice(-4)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-4 my-4">
                      <div className="flex items-center">
                        <div className="bg-secondary/10 w-10 h-10 rounded-full flex items-center justify-center mr-2">
                          <IconMusic className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">NFTs</p>
                          <p className="font-bold text-foreground">{totalNfts}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="bg-secondary/10 w-10 h-10 rounded-full flex items-center justify-center mr-2">
                          <IconCoin className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Volume</p>
                          <p className="font-bold text-foreground">{totalValue.toFixed(2)} SOL</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Refresh button */}
                    <div className="flex mt-2">
                      <button
                        className="btn btn-outline btn-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
                        onClick={refreshNFTs}
                        disabled={isRefreshing}
                      >
                        <IconRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Section - Card Based */}
        <div className="mb-16">
          <h2 className="inline-block text-2xl font-bold mb-8 pb-2 text-foreground border-b-4 border-primary">
            solMusic Collection Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Total NFTs Card */}
            <div className="relative overflow-hidden bg-card rounded-3xl shadow-xl border border-border transform hover:-translate-y-1 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
              <div className="relative p-8">
                <div className="absolute top-4 right-4 bg-background rounded-full p-3">
                  <IconMusic className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground mb-2">Total NFTs</h3>
                <p className="text-5xl font-bold text-foreground mt-6">{totalNfts}</p>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary"></div>
      </div>
            </div>
            
            {/* Sold NFTs Card */}
            <div className="relative overflow-hidden bg-card rounded-3xl shadow-xl border border-border transform hover:-translate-y-1 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent"></div>
              <div className="relative p-8">
                <div className="absolute top-4 right-4 bg-background rounded-full p-3">
                  <IconSend className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground mb-2">Sold</h3>
                <p className="text-5xl font-bold text-foreground mt-6">{totalSold}</p>
                <p className="text-sm text-muted-foreground mt-2">{soldValue.toFixed(2)} SOL</p>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-secondary"></div>
          </div>
          </div>
          
            {/* Purchased NFTs Card */}
            <div className="relative overflow-hidden bg-card rounded-3xl shadow-xl border border-border transform hover:-translate-y-1 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
              <div className="relative p-8">
                <div className="absolute top-4 right-4 bg-background rounded-full p-3">
                  <IconShoppingCart className="w-6 h-6 text-primary" />
            </div>
                <h3 className="text-lg font-medium text-muted-foreground mb-2">Purchased</h3>
                <p className="text-5xl font-bold text-foreground mt-6">{totalPurchased}</p>
                <p className="text-sm text-muted-foreground mt-2">{purchasedValue.toFixed(2)} SOL</p>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary"></div>
          </div>
            </div>
          </div>
        </div>
      
      {/* Tabs Navigation */}
        <div className="mb-16">
          <h2 className="inline-block text-2xl font-bold mb-8 pb-2 text-foreground border-b-4 border-primary">
            Your solMusic Collection
          </h2>
          <div className="bg-card border border-border rounded-3xl p-1.5 shadow-xl mb-6">
            <div className="flex flex-col sm:flex-row">
            <button 
                className={`flex items-center justify-center gap-2 px-8 py-5 rounded-2xl text-base font-medium flex-1 transition-all duration-200 ${
                activeTab === 'owned' 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background'
              }`}
              onClick={() => setActiveTab('owned')}
            >
              <IconMusic className="w-5 h-5" />
                <span>My solMusic NFTs</span>
            </button>
            <button 
                className={`flex items-center justify-center gap-2 px-8 py-5 rounded-2xl text-base font-medium flex-1 transition-all duration-200 ${
                activeTab === 'sold' 
                    ? 'bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background'
              }`}
              onClick={() => setActiveTab('sold')}
            >
              <IconSend className="w-5 h-5" />
                <span>Sold</span>
            </button>
            <button 
                className={`flex items-center justify-center gap-2 px-8 py-5 rounded-2xl text-base font-medium flex-1 transition-all duration-200 ${
                activeTab === 'purchased' 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background'
              }`}
              onClick={() => setActiveTab('purchased')}
            >
              <IconShoppingCart className="w-5 h-5" />
                <span>Purchased</span>
            </button>
          </div>
        </div>
          
          {/* Tab description */}
          <div className="text-sm text-muted-foreground mb-10 px-2 flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-3 ${
              activeTab === 'owned' ? 'bg-primary' : 
              activeTab === 'sold' ? 'bg-secondary' : 'bg-primary'
            }`}></span>
            {activeTab === 'owned' && <span>Browse your complete solMusic NFT collection.</span>}
            {activeTab === 'sold' && <span>View all solMusic NFTs you've sold to other collectors.</span>}
            {activeTab === 'purchased' && <span>See the solMusic NFTs you've bought or minted.</span>}
      </div>
      
      {/* Content sections */}
          <div className="mb-16">
        {loading ? (
              <div className="py-20 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* Owned NFTs Tab */}
            {activeTab === 'owned' && (
                  <div className="bg-card rounded-3xl shadow-xl overflow-hidden border border-border">
                    <div className="border-b border-border px-8 py-6 flex items-center justify-between">
                      <h2 className="text-xl font-bold flex items-center text-foreground">
                        <IconMusic className="w-5 h-5 mr-3 text-primary" />
                        My solMusic Collection
                  </h2>
                </div>
                
                    <div className="p-8">
                  {nfts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                      {nfts.map(nft => (
                            <div key={nft.mint} className="group relative bg-background rounded-3xl overflow-hidden border border-border shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-primary/10">
                          <div className="relative aspect-square">
                            <img 
                              src={nft.coverArt} 
                              alt={nft.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                            <button 
                                  className="absolute inset-0 flex items-center justify-center z-10"
                              onClick={() => togglePlay(nft)}
                            >
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-110 bg-primary/80 w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                              {playingNftId === nft.mint ? (
                                      <IconPlayerPause className="w-10 h-10 text-white" />
                              ) : (
                                      <IconPlayerPlay className="w-10 h-10 text-white" />
                              )}
                                  </div>
                            </button>
                                <div className="absolute top-4 right-4 bg-background/50 backdrop-blur-sm px-3 py-1 rounded-full">
                                  <p className="text-foreground font-semibold">{Number(nft.price).toFixed(2)} SOL</p>
                          </div>
                              </div>
                              <div className="absolute inset-x-0 bottom-0 p-6 z-10">
                                <h3 className="font-bold text-xl text-foreground mb-1">{nft.title}</h3>
                                <p className="text-muted-foreground text-sm mb-4">Artist: {nft.artist}</p>
                                
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0">
                                <Link 
                                  href={`/music-nft/details/${nft.mint}`} 
                                    className="btn bg-primary hover:bg-primary/90 border-0 text-primary-foreground flex-1"
                                >
                                    Details
                                </Link>
                                
                                {nft.forSale ? (
                                  <button 
                                      className="btn bg-background hover:bg-muted border-border text-foreground" 
                                    onClick={() => handleUnlistNft(nft)}
                                  >
                                    Unlist
                                  </button>
                                ) : (
                                  <button 
                                      className="btn bg-background hover:bg-muted border-border text-foreground" 
                                    onClick={() => handleListNft(nft)}
                                  >
                                      List
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-20 border border-dashed border-border rounded-3xl bg-background/50">
                          <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 bg-card">
                            <IconMusic className="w-16 h-16 text-primary/50" />
                    </div>
                          <h3 className="text-2xl font-bold mb-3 text-foreground">No solMusic NFTs Found</h3>
                          <p className="text-muted-foreground mb-8 max-w-md mx-auto">You don't have any solMusic NFTs yet</p>
                          <Link href="/music-nft/create" className="btn bg-primary hover:bg-primary/90 border-0 text-primary-foreground btn-lg">
                            Create Your First solMusic NFT
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Sold NFTs Tab */}
            {activeTab === 'sold' && (
              <div className="bg-card rounded-3xl shadow-xl overflow-hidden border border-border">
                <div className="border-b border-border px-8 py-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center text-foreground">
                    <IconSend className="w-5 h-5 mr-3 text-secondary" />
                    Sales History
                  </h2>
                </div>
                
                <div className="p-8">
                  {soldNfts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full divide-y divide-border">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground tracking-wider">NFT</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground tracking-wider">Title</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground tracking-wider">Sale Price</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground tracking-wider">Buyer</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {soldNfts.map((transaction, index) => (
                            <tr key={index} className="hover:bg-muted/50">
                              <td className="px-4 py-4">
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                                  <img 
                                    src={transaction.nft.coverArt} 
                                    alt={transaction.nft.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="font-medium text-foreground">{transaction.nft.title}</div>
                                <div className="text-sm text-muted-foreground">{transaction.nft.artist}</div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary/10 text-secondary font-medium">
                                  {transaction.price.toFixed(2)} SOL
                                </div>
                              </td>
                              <td className="px-4 py-4 text-muted-foreground">{formatDate(transaction.date)}</td>
                              <td className="px-4 py-4">
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-background border border-border">
                                  {transaction.otherParty.slice(0, 6)}...{transaction.otherParty.slice(-4)}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <Link 
                                  href={`/music-nft/details/${transaction.nft.mint}`} 
                                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                                >
                                  View NFT
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-background/50">
                      <IconSend className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                      <h3 className="text-xl font-bold mb-2 text-foreground">No Sales Yet</h3>
                      <p className="text-muted-foreground mb-6">You haven't sold any NFTs yet</p>
                      <Link href="/music-nft/marketplace" className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium">
                        Go to Marketplace
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Purchased NFTs Tab */}
            {activeTab === 'purchased' && (
              <div className="bg-card rounded-3xl shadow-xl overflow-hidden border border-border">
                <div className="border-b border-border px-8 py-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center text-foreground">
                    <IconShoppingCart className="w-5 h-5 mr-3 text-primary" />
                    Purchase History
                  </h2>
                </div>
                
                <div className="p-8">
                  {purchasedNfts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full divide-y divide-border">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground tracking-wider">NFT</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground tracking-wider">Title</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground tracking-wider">Price</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground tracking-wider">From</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {purchasedNfts.map((transaction, index) => (
                            <tr key={index} className="hover:bg-muted/50">
                              <td className="px-4 py-4">
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                                  <img 
                                    src={transaction.nft.coverArt} 
                                    alt={transaction.nft.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="font-medium text-foreground">{transaction.nft.title}</div>
                                <div className="text-sm text-muted-foreground">{transaction.nft.artist}</div>
                              </td>
                              <td className="px-4 py-4">
                                <div className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${
                                  transaction.type === 'mint' 
                                    ? 'bg-secondary/10 text-secondary' 
                                    : 'bg-primary/10 text-primary'
                                }`}>
                                  {transaction.type === 'buy' ? 'Purchased' : 'Minted Copy'}
                                </div>
                              </td>
                              <td className="px-4 py-4 font-medium text-foreground">
                                {transaction.price.toFixed(2)} SOL
                              </td>
                              <td className="px-4 py-4 text-muted-foreground">{formatDate(transaction.date)}</td>
                              <td className="px-4 py-4">
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-background border border-border">
                                  {transaction.otherParty.slice(0, 6)}...{transaction.otherParty.slice(-4)}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <Link 
                                  href={`/music-nft/details/${transaction.nft.mint}`} 
                                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                                >
                                  View NFT
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-background/50">
                      <IconShoppingCart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                      <h3 className="text-xl font-bold mb-2 text-foreground">No Purchases Yet</h3>
                      <p className="text-muted-foreground mb-6">You haven't purchased any NFTs yet</p>
                      <Link href="/music-nft/marketplace" className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium">
                        Browse Marketplace
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 