'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';
import { IconFilter, IconCoin, IconPlus, IconMusic, IconCircleCheck, IconRefresh, IconPlayerPlay, IconShoppingCart } from '@tabler/icons-react';
import { AppHero, AppLayout, LoadingSpinner } from '@/components/ui/ui-layout';
import MusicNftCard, { MusicNftData } from '@/components/music-nft/MusicNftCard';
import { fetchNFTsFromPinata, createNFTCopy } from '@/services/pinata';
import { buyNFT, mintNFTCopy } from '@/services/solana';
import { Button } from '@/components/ui/button';

type SortOption = 'price-low' | 'price-high' | 'newest';

export default function MarketplacePage() {
  const { connected, publicKey, wallet } = useWallet();
  const { connection } = useConnection();
  const [nfts, setNfts] = useState<MusicNftData[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<MusicNftData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showOnlyForSale, setShowOnlyForSale] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch NFTs from Pinata when the component mounts
  useEffect(() => {
    async function loadNFTs() {
      try {
        setLoading(true);
        let fetchedNfts;
        
        try {
          // Try to fetch from Pinata first
          fetchedNfts = await fetchNFTsFromPinata();
          setNfts(fetchedNfts);
        } catch (error) {
          console.error('Failed to fetch from Pinata:', error);
          toast.error('Failed to load NFTs. Please try again later.');
          setNfts([]);
        }
      } catch (error) {
        console.error('Error loading NFTs:', error);
        toast.error('Failed to load NFTs. Please try again later.');
        setNfts([]);
      } finally {
        // Add a small delay to prevent UI flashing if loading is very fast
        setTimeout(() => {
          setLoading(false);
        }, 300);
      }
    }
    
    loadNFTs();
    // This effect should only run once when the component mounts
  }, []);

  // Add a function to refresh NFTs from Pinata
  const refreshNFTs = async () => {
    try {
      setLoading(true);
      toast.loading('Refreshing NFTs...', { id: 'refresh-nfts' });
      
      // Force a refresh from Pinata by passing true
      const fetchedNfts = await fetchNFTsFromPinata(true);
      setNfts(fetchedNfts);
      
      toast.dismiss('refresh-nfts');
      toast.success('NFTs refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing NFTs:', error);
      toast.dismiss('refresh-nfts');
      toast.error('Failed to refresh NFTs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get unique genres from the NFTs
  const genres = ['all', ...Array.from(new Set(nfts.map(nft => nft.genre || 'other'))).sort()];

  // Filter and sort NFTs based on user selections
  useEffect(() => {
    if (nfts.length === 0) return;
    
    let filtered = [...nfts];
    
    // Apply genre filter
    if (selectedGenre !== 'all') {
      filtered = filtered.filter(nft => nft.genre === selectedGenre);
    }
    
    // Apply for sale filter
    if (showOnlyForSale) {
      filtered = filtered.filter(nft => nft.forSale);
    }
    
    // Apply sorting - use memo to optimize if this becomes a performance issue
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'newest':
        default:
          // For now, just use the mint as a proxy for "newest"
          return b.mint.localeCompare(a.mint);
      }
    });
    
    setFilteredNfts(filtered);
  }, [nfts, selectedGenre, sortOption, showOnlyForSale]);

  const handleBuyNft = async (mint: string) => {
    // Prevent multiple simultaneous purchases
    if (processing) return;
    
    // Log current wallet state for debugging
    console.log("Wallet state:", {
      connected,
      publicKey: publicKey?.toBase58(),
      wallet: wallet ? {
        name: wallet.adapter?.name,
        publicKey: wallet.adapter?.publicKey?.toBase58(),
        connecting: wallet.adapter?.connecting,
        connected: wallet.adapter?.connected
      } : null
    });

    if (!connected || !wallet || !wallet.adapter?.publicKey) {
      toast.error('Please connect your wallet using the button in the header');
      return;
    }
    
    const nft = nfts.find(n => n.mint === mint);
    if (!nft) return;
    
    if (!nft.forSale) {
      toast.error('This NFT is not for sale');
      return;
    }
    
    if (publicKey?.toBase58() === nft.owner) {
      toast.error('You already own this NFT');
      return;
    }
    
    try {
      setProcessing(true);
      
      // Call the Solana service to process the NFT purchase
      const success = await buyNFT(connection, wallet, nft);
      
      if (success) {
        // Force refresh NFTs from Pinata
        await refreshNFTs();
        
        // Show wallet viewing instructions
        setTimeout(() => {
          toast('Check your wallet to view your new NFT!', {
            icon: '🎵',
            duration: 5000,
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error('An error occurred while processing your purchase');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
        <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
            onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 h-[42px] bg-white/5 border-white/10 hover:bg-white/10 text-white"
          >
              <IconFilter className="w-4 h-4" />
            Filters
            </Button>
          
      {showFilters && (
              <>
              <select 
                  className="px-3 py-2 rounded-lg backdrop-blur-md bg-white/10 dark:bg-black/30 border-gray-200/20 dark:border-gray-800/50 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm h-[42px] min-w-[120px] appearance-none pr-8 relative"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.5rem center", backgroundSize: "1.5em 1.5em" }}
              >
                {genres.map(genre => (
                    <option key={genre} value={genre} className="bg-gray-900 text-white">
                    {genre.charAt(0).toUpperCase() + genre.slice(1)}
                  </option>
                ))}
              </select>
            
              <select 
                  className="px-3 py-2 rounded-lg backdrop-blur-md bg-white/10 dark:bg-black/30 border-gray-200/20 dark:border-gray-800/50 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm h-[42px] min-w-[180px] appearance-none pr-8"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.5rem center", backgroundSize: "1.5em 1.5em" }}
              >
                  <option value="newest" className="bg-gray-900 text-white">Newest</option>
                  <option value="price-low" className="bg-gray-900 text-white">Price: Low to High</option>
                  <option value="price-high" className="bg-gray-900 text-white">Price: High to Low</option>
              </select>
            
                <label className="cursor-pointer flex items-center px-3 py-2 rounded-lg backdrop-blur-md bg-white/10 dark:bg-black/30 border border-gray-200/20 dark:border-gray-800/50 text-white h-[42px]">
                <input 
                  type="checkbox"
                    className="h-4 w-4 rounded accent-primary border-2 border-white/20 focus:outline-none mr-2"
                  checked={showOnlyForSale}
                  onChange={() => setShowOnlyForSale(!showOnlyForSale)}
                />
                  <span className="text-sm">For sale only</span>
              </label>
              </>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3 ml-auto">
            <Link href="/music-nft/create">
          <Button
                variant="outline"
            size="sm"
                className="flex items-center gap-2 h-[42px] bg-white/5 border-white/10 hover:bg-white/10 text-white"
          >
                <IconPlus className="w-4 h-4" />
                Create NFT
          </Button>
            </Link>
            
            <Link href="/music-nft/shorts">
          <Button
                variant="outline"
            size="sm"
                className="flex items-center gap-2 h-[42px] bg-white/5 border-white/10 hover:bg-white/10 text-white"
          >
                <IconMusic className="w-4 h-4" />
                Music Shorts
          </Button>
            </Link>
        
          <Button
            variant="outline"
            size="sm"
              onClick={refreshNFTs}
              className="flex items-center gap-2 h-[42px] bg-white/5 border-white/10 hover:bg-white/10 text-white"
          >
              <IconRefresh className="w-4 h-4" />
              Refresh
          </Button>
      </div>
        </div>
      
      {/* NFT grid */}
      {filteredNfts.length > 0 ? (
          <div className="flex flex-col space-y-4">
          {filteredNfts.map((nft) => (
              <div 
              key={nft.mint}
                className="backdrop-blur-md bg-white/10 dark:bg-black/30 border border-gray-200/20 dark:border-gray-800/50 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300"
              >
                <div className="flex flex-row items-center">
                  {/* Album artwork with vinyl effect */}
                  <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 relative group shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-purple-800/30 mix-blend-overlay opacity-60"></div>
                    <div className="relative overflow-hidden h-full">
                      <img 
                        src={nft.coverArt} 
                        alt={nft.title} 
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Play button overlay */}
                      <button 
                        className="absolute inset-0 flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent event bubbling
                          const audioElement = new Audio(nft.audioUrl);
                          
                          // Stop any currently playing audio
                          const allAudios = document.querySelectorAll('audio.nft-audio');
                          allAudios.forEach(audio => {
                            (audio as HTMLAudioElement).pause();
                          });
                          
                          // Create a hidden audio element to track state
                          let existingAudio = document.getElementById(`audio-${nft.mint}`) as HTMLAudioElement;
                          
                          if (existingAudio) {
                            // If audio for this NFT exists, toggle it
                            if (existingAudio.paused) {
                              existingAudio.play()
                                .then(() => {
                                  toast.success(`Playing "${nft.title}" by ${nft.artist}`, { 
                                    id: `playing-${nft.mint}`,
                                    duration: 2000,
                                    icon: '🎵'
                                  });
                                })
                                .catch(err => {
                                  console.error("Error playing audio:", err);
                                  toast.error("Couldn't play audio. Please try again.");
                                });
                            } else {
                              existingAudio.pause();
                              toast.success(`Paused "${nft.title}"`, { 
                                id: `playing-${nft.mint}`,
                                duration: 1000
                              });
                            }
                          } else {
                            // Create new audio element if it doesn't exist
                            const newAudio = document.createElement('audio');
                            newAudio.src = nft.audioUrl;
                            newAudio.id = `audio-${nft.mint}`;
                            newAudio.className = 'nft-audio';
                            document.body.appendChild(newAudio);
                            
                            newAudio.play()
                              .then(() => {
                                toast.success(`Playing "${nft.title}" by ${nft.artist}`, { 
                                  id: `playing-${nft.mint}`,
                                  duration: 2000,
                                  icon: '🎵'
                                });
                              })
                              .catch(err => {
                                console.error("Error playing audio:", err);
                                toast.error("Couldn't play audio. Please try again.");
                              });
                              
                            // Remove audio element when playback ends
                            newAudio.onended = () => {
                              document.body.removeChild(newAudio);
                            };
                          }
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300">
                          <IconPlayerPlay className="w-5 h-5 text-white" />
                        </div>
                      </button>
                    </div>
                    
                    {/* On-chain badge */}
                    {nft.onChain && (
                      <div className="absolute top-1 right-1 backdrop-blur-md bg-primary/80 text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-sm">
                        On-chain
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <Link href={`/music-nft/details/${nft.mint}`} className="hover:text-primary transition-colors">
                          <h2 className="text-lg font-bold truncate">{nft.title}</h2>
                        </Link>
                        <p className="text-sm text-gray-300/80 mb-2">{nft.artist}</p>
                        
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {nft.genre && (
                            <span className="px-2 py-0.5 backdrop-blur-sm bg-white/10 dark:bg-white/5 rounded-full text-xs font-medium">
                              {nft.genre}
                            </span>
                          )}
                          
                          <span className="px-2 py-0.5 backdrop-blur-sm bg-white/10 dark:bg-white/5 rounded-full text-xs font-medium inline-flex items-center">
                            <IconMusic className="w-3 h-3 mr-1" />
                            NFT
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        {nft.forSale && (
                          <div className="flex flex-col items-end">
                            <div className="text-xs text-gray-400">Price</div>
                            <div className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent text-lg font-bold">
                              {Number(nft.price).toFixed(2)} SOL
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700/30">
                      {connected && nft.forSale && (
                        <button 
                          className={`px-3 py-1.5 ${
                            processing 
                              ? "bg-gray-700 cursor-not-allowed" 
                              : "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
                          } text-white font-medium rounded-lg shadow-sm shadow-primary/20 transition-all duration-300 flex items-center text-sm`}
                          onClick={() => handleBuyNft(nft.mint)}
                          disabled={!connected || processing}
                        >
                          {processing ? (
                            <>
                              <div className="w-3.5 h-3.5 mr-1 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <IconShoppingCart className="w-3.5 h-3.5 mr-1" />
                              Buy
                            </>
                          )}
                        </button>
                      )}
                      
                      <Link 
                        href={`/music-nft/details/${nft.mint}`}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-medium rounded-lg transition-colors duration-300 text-sm"
                      >
                        Details
                      </Link>
                      
                      <div className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                        <span className="hidden sm:inline">Owner:</span>
                        <span className="truncate max-w-[80px]">{nft.owner.substring(0, 4)}...{nft.owner.substring(nft.owner.length - 4)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          ))}
        </div>
      ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 bg-muted/60 rounded-full flex items-center justify-center mb-6">
              <IconMusic className="w-12 h-12 text-muted-foreground" />
          </div>
            <h3 className="text-2xl font-semibold mb-3">No NFTs found</h3>
            <p className="text-muted-foreground max-w-md text-base">
            {loading ? 'Loading NFTs...' : nfts.length === 0 ? 'There are no NFTs available. Try creating your own!' : 'No NFTs match your current filter criteria. Try adjusting your filters.'}
          </p>
          
          {connected && !loading && (
              <div className="mt-10 flex flex-col items-center">
                <Link href="/music-nft/create">
                  <Button variant="outline" size="lg" className="px-8">
                    <IconPlus className="w-5 h-5 mr-2" />
                    Create Your Own Music NFT
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
      </div>
    </AppLayout>
  );
} 