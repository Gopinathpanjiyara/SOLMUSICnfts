'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/ui/ui-layout';
import { IconMusic, IconPlayerPlay, IconCoin, IconPalette, IconUserCircle, IconTrendingUp, IconArrowRight } from '@tabler/icons-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { MusicNftData } from '@/components/music-nft/MusicNftCard';
import { fetchNFTsFromPinata } from '@/services/pinata';
import { ShareNftBlink } from '@/components/dialect/DialectBlinks';
import { IconShare } from '@tabler/icons-react';

export default function HomePage() {
  const { connected } = useWallet();
  const [nfts, setNfts] = useState<MusicNftData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Move loadNFTs into component scope so it can be referenced by child components
  const loadNFTs = async () => {
    try {
      setLoading(true);
      const fetchedNfts = await fetchNFTsFromPinata();
      setNfts(fetchedNfts);
    } catch (error) {
      console.error('Error loading NFTs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Use loadNFTs in useEffect
  useEffect(() => {
    loadNFTs();
  }, []);
  
  // Get the first 3 NFTs for the featured section
  const featuredNfts = nfts.slice(0, 3);
  
  return (
    <AppLayout>
      {/* Add styles for button borders, animated background, and text transitions */}
      <style jsx global>{`
        .neo-brutalism {
          background: black;
          border: 3px solid white;
          box-shadow: 6px 6px 0 rgba(168, 85, 247, 0.8);
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        
        .neo-brutalism:hover {
          transform: translate(-3px, -3px);
          box-shadow: 9px 9px 0 rgba(168, 85, 247, 1);
        }

        .neo-brutalism::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
          transform: rotate(45deg);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .neo-brutalism:hover::before {
          opacity: 1;
          animation: shineEffect 1s forwards;
        }
        
        @keyframes shineEffect {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }

        @keyframes gradientAnimation {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animated-gradient {
          background: linear-gradient(45deg, rgba(128, 0, 255, 0.4), rgba(0, 0, 0, 0.95), rgba(168, 85, 247, 0.5), rgba(0, 0, 0, 0.95));
          background-size: 400% 400%;
          animation: gradientAnimation 15s ease infinite;
          position: relative;
        }
        
        .animated-gradient::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMTI4LCAwLCAyNTUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==');
          opacity: 0.1;
          z-index: 1;
          pointer-events: none;
        }

        .glow {
          position: absolute;
          top: 30%;
          left: 10%;
          width: 60%;
          height: 40%;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, rgba(168, 85, 247, 0.2) 40%, transparent 70%);
          filter: blur(80px);
          opacity: 0.8;
          border-radius: 50%;
          z-index: 0;
          pointer-events: none;
          animation: pulseGlow 8s infinite alternate ease-in-out;
        }
        
        @keyframes pulseGlow {
          0% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
          100% { opacity: 0.6; transform: scale(1); }
        }

        /* Text animation keyframes */
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInLeft {
          0% {
            opacity: 0;
            transform: translateX(-20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInRight {
          0% {
            opacity: 0;
            transform: translateX(20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .fade-in {
          opacity: 0;
          animation: fadeIn 0.8s ease forwards;
        }
        
        .fade-in-left {
          opacity: 0;
          animation: fadeInLeft 0.8s ease forwards;
        }
        
        .fade-in-right {
          opacity: 0;
          animation: fadeInRight 0.8s ease forwards;
        }

        .delay-1 {
          animation-delay: 0.2s;
        }
        
        .delay-2 {
          animation-delay: 0.4s;
        }
        
        .delay-3 {
          animation-delay: 0.6s;
        }
        
        .delay-4 {
          animation-delay: 0.8s;
        }
        
        .delay-5 {
          animation-delay: 1s;
        }
        
        .hero-text a {
          position: relative;
          overflow: hidden;
        }
        
        .hero-text a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: white;
          transition: width 0.3s ease;
        }
        
        .hero-text a:hover::after {
          width: 100%;
        }

      `}</style>
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-black overflow-hidden">
        <div className="absolute inset-0 animated-gradient"></div>
        <div className="glow"></div>
        <div className="glow" style={{ top: '50%', left: '60%', width: '40%', opacity: 0.5 }}></div>
        
        {/* Starfield background */}
        <div className="stars">
          {[...Array(50)].map((_, i) => {
            const duration = Math.random() * 3 + 2;
            const delay = Math.random() * 5;
            return (
              <div 
                key={i}
                className="star"
                style={{
                  width: `${Math.random() * 2 + 1}px`,
                  height: `${Math.random() * 2 + 1}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`,
                }}
              ></div>
            );
          })}
        </div>
        {/* Hero Image */}
<div className="absolute z-20 top-1/2 right-[12%] transform -translate-y-1/2 w-[380px] h-[380px]">
  <div className="relative w-full h-full overflow-hidden rounded-xl shadow-2xl">
    <img 
      src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1470&auto=format&fit=crop"
      alt="Music NFT Visualization" 
      className="w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-br from-purple-800/40 to-transparent"></div>
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
      <p className="text-white font-bold text-lg">Next-Gen Music NFTs</p>
      <p className="text-gray-300 text-sm">Own the sound. Support artists.</p>
    </div>
  </div>
</div>
        
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-20 relative z-10 hero-text">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full">
              <h1 className="text-5xl md:text-7xl font-black mb-6 md:mb-10 tracking-tight text-white">
                <span className="block fade-in delay-1">NEXT GEN</span>
                <span className="block text-purple-500 fade-in-right delay-2">MUSIC NFTs</span>
                <span className="block fade-in-left delay-3">ON SOLANA</span>
              </h1>
              <p className="text-xl text-gray-300 mb-10 max-w-xl fade-in delay-4">
                Own the sound. Buy, sell and create unique music NFTs. Support artists directly on the fastest blockchain.
              </p>
              <div className="flex flex-wrap gap-4 fade-in delay-5">
                <Link href="/music-nft/marketplace/" className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-md transition-all text-lg hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-600/30 neo-brutalism">
                  EXPLORE MARKETPLACE
                </Link>
                <Link href="/music-nft/create/" className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-md transition-all text-lg hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-600/30 neo-brutalism">
                  CREATE NFT
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="w-full bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center bg-black neo-brutalism p-6 rounded-xl">
              <div className="w-16 h-16 bg-purple-900/30 rounded-xl flex items-center justify-center mr-5">
                <IconMusic className="w-8 h-8 text-purple-400" />
            </div>
              <div>
                <p className="text-4xl font-bold text-white">{nfts.length || "1,257"}</p>
                <p className="text-gray-400 font-medium uppercase tracking-wider text-sm">Total NFTs</p>
              </div>
          </div>
          
            <div className="flex items-center bg-black neo-brutalism p-6 rounded-xl">
              <div className="w-16 h-16 bg-blue-900/30 rounded-xl flex items-center justify-center mr-5">
                <IconUserCircle className="w-8 h-8 text-blue-400" />
            </div>
              <div>
                <p className="text-4xl font-bold text-white">{new Set(nfts.map(nft => nft.artist)).size || "325"}</p>
                <p className="text-gray-400 font-medium uppercase tracking-wider text-sm">Artists</p>
              </div>
          </div>
          
            <div className="flex items-center bg-black neo-brutalism p-6 rounded-xl">
              <div className="w-16 h-16 bg-cyan-900/30 rounded-xl flex items-center justify-center mr-5">
                <IconCoin className="w-8 h-8 text-cyan-400" />
            </div>
              <div>
                <p className="text-4xl font-bold text-white">
              {nfts.length > 0 ? 
                Number(nfts.reduce((sum, nft) => sum + (Number(nft.price) || 0), 0)).toFixed(2) + " SOL" 
                : "4,783 SOL"}
            </p>
                <p className="text-gray-400 font-medium uppercase tracking-wider text-sm">Volume</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured NFTs */}
      <section className="w-full bg-black py-24 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-gray-900 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-gray-900 to-transparent"></div>
        <div className="absolute left-0 top-1/4 w-72 h-72 bg-purple-500/20 rounded-full filter blur-3xl"></div>
        <div className="absolute right-0 bottom-1/4 w-80 h-80 bg-blue-500/20 rounded-full filter blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="flex justify-between items-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white relative">
              Featured NFTs
              <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-gradient-to-r from-purple-600 to-transparent"></span>
            </h2>
            <Link href="/music-nft/marketplace/" className="text-purple-400 font-medium flex items-center hover:text-purple-300 transition-colors group text-lg">
            View All
              <IconArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        {loading ? (
            <div className="py-32 flex justify-center">
              <div className="w-16 h-16 border-4 border-purple-700 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {featuredNfts.length > 0 ? (
                featuredNfts.map((nft, index) => (
                  <div key={nft.mint} className="bg-gray-900 rounded-xl overflow-hidden shadow-xl border border-purple-500/10 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 group">
                  <div className="relative aspect-square">
                    <img 
                      src={nft.coverArt} 
                      alt={nft.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button className="flex items-center justify-center w-16 h-16 rounded-full bg-purple-600 hover:bg-purple-700 transition-colors transform scale-0 group-hover:scale-100 transition-transform duration-300 hover:shadow-lg hover:shadow-purple-500/50">
                          <IconPlayerPlay className="w-8 h-8 text-white" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                      <div>
                          <h3 className="font-bold text-xl text-white group-hover:text-purple-400 transition-colors">{nft.title}</h3>
                          <p className="text-gray-400">by {nft.artist}</p>
                      </div>
                        <div className="bg-purple-500/10 px-3 py-1 rounded-md group-hover:bg-purple-500/20 transition-colors">
                          <p className="text-purple-300 font-mono font-bold">{Number(nft.price || 0).toFixed(2)} SOL</p>
                      </div>
                    </div>
                      <div className="mt-5 space-y-3">
                        <Link href={`/music-nft/details/${nft.mint}`} className="block w-full py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-center rounded-md font-medium text-white neo-brutalism relative overflow-hidden group-hover:from-purple-700 group-hover:to-purple-900">
                          <span className="relative z-10">View Details</span>
                        </Link>
                        <ShareNftBlink 
                          nft={nft}
                          onPurchaseComplete={() => {
                            // Refresh NFT data after purchase
                            loadNFTs();
                          }}
                        />
                      </div>
                  </div>
                </div>
              ))
            ) : (
                <div className="col-span-full py-32 text-center bg-gray-900 rounded-xl border border-purple-500/10 neo-brutalism">
                  <p className="text-gray-400 mb-8 text-xl">No NFTs found. Be the first to create a music NFT!</p>
                  <Link href="/music-nft/create" className="inline-flex items-center px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-md neo-brutalism">
                    <IconPalette className="w-6 h-6 mr-3" />
                    Create Your First NFT
                </Link>
              </div>
            )}
          </div>
        )}
        </div>
      </section>
      
      {/* How It Works */}
      <section className="w-full bg-gradient-to-b from-gray-900 to-black py-32 relative">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070')] bg-cover bg-center bg-no-repeat"></div>
        
        {/* Add light rays effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-1/2 h-full bg-gradient-to-b from-purple-500/30 to-transparent transform -rotate-45 opacity-30 blur-3xl"></div>
          <div className="absolute top-0 right-1/4 w-1/2 h-full bg-gradient-to-b from-blue-500/20 to-transparent transform rotate-45 opacity-20 blur-3xl"></div>
                </div>
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-center text-white mb-6">How It Works</h2>
          <p className="text-xl text-purple-300/70 text-center mb-20 max-w-3xl mx-auto">Simple steps to start creating, collecting and trading your music NFTs on the fastest blockchain.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-black/70 backdrop-blur-sm border border-purple-500/20 p-10 rounded-xl shadow-lg relative z-10 hover:shadow-purple-500/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-20 h-20 -mt-16 mb-6 bg-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-purple-800/30 rounded">
                <IconPalette className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-center text-white mb-4">Create</h3>
              <p className="text-gray-300 text-center mb-8">Upload your 30-second music clip, set royalties, and mint your music as an NFT on Solana&apos;s high-speed network.</p>
              <div className="text-center">
                <Link href="/music-nft/create/" className="inline-block px-8 py-3 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 transition-colors hover:shadow-lg hover:shadow-purple-600/20 neo-brutalism">
                Start Creating
              </Link>
            </div>
          </div>
          
            <div className="bg-black/70 backdrop-blur-sm border border-blue-500/20 p-10 rounded-xl shadow-lg relative z-10 hover:shadow-blue-500/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-20 h-20 -mt-16 mb-6 bg-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-800/30 rounded">
                <IconMusic className="w-10 h-10 text-white" />
          </div>
              <h3 className="text-2xl font-bold text-center text-white mb-4">Collect</h3>
              <p className="text-gray-300 text-center mb-8">Discover and buy music NFTs from your favorite artists and build your collection with secure blockchain ownership.</p>
              <div className="text-center">
                <Link href="/music-nft/marketplace/" className="inline-block px-8 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors hover:shadow-lg hover:shadow-blue-600/20 neo-brutalism">
                Browse NFTs
              </Link>
            </div>
          </div>
          
            <div className="bg-black/70 backdrop-blur-sm border border-cyan-500/20 p-10 rounded-xl shadow-lg relative z-10 hover:shadow-cyan-500/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-20 h-20 -mt-16 mb-6 bg-cyan-600 flex items-center justify-center mx-auto shadow-lg shadow-cyan-800/30 rounded">
                <IconTrendingUp className="w-10 h-10 text-white" />
          </div>
              <h3 className="text-2xl font-bold text-center text-white mb-4">Trade</h3>
              <p className="text-gray-300 text-center mb-8">List your NFTs for sale and trade with other collectors, with creator royalties on every sale, all secured by Solana.</p>
              <div className="text-center">
                <Link href="/music-nft/marketplace/" className="inline-block px-8 py-3 bg-cyan-600 text-white rounded-md font-medium hover:bg-cyan-700 transition-colors hover:shadow-lg hover:shadow-cyan-600/20 neo-brutalism">
                  Trade NFTs
              </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Experience Section */}
      <section className="w-full bg-black py-20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-gray-900 to-purple-900/40 overflow-hidden shadow-2xl">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 p-10 md:p-16">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Experience Music Shorts</h2>
                <p className="text-gray-300 text-xl mb-10">
                  Swipe through 30-second clips in our TikTok-style music player. Discover new artists and collect your favorites in just a few taps.
                </p>
                <div>
                  <Link href="/music-nft/shorts/" className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold rounded-md hover:from-purple-700 hover:to-purple-900 transition-all hover:shadow-lg hover:shadow-purple-600/30 neo-brutalism">
                    <IconPlayerPlay className="w-6 h-6 mr-3" />
                    Launch Music Shorts
                </Link>
                </div>
              </div>
              
              <div className="md:w-1/2 relative">
                <div className="h-full min-h-[400px] md:min-h-[500px]">
                  {nfts.length > 2 ? (
                    <div className="relative h-full">
                    <img 
                      src={nfts[2].coverArt} 
                      alt="Music Shorts Experience" 
                        className="w-full h-full object-cover"
                    />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/30 backdrop-blur-sm rounded-full p-5 hover:bg-purple-600/80 transition-colors cursor-pointer hover:scale-110">
                          <IconPlayerPlay className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                      <IconMusic className="w-24 h-24 text-purple-600/50" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="w-full bg-black py-32 relative overflow-hidden">
        {/* Add dynamic background elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-purple-600/10 filter blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-blue-600/10 filter blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-40 bg-gradient-to-r from-purple-900/20 via-pink-600/20 to-purple-900/20 filter blur-3xl rotate-12"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-purple-900 to-purple-700 rounded-2xl p-12 md:p-20 text-center shadow-2xl shadow-purple-900/30 relative overflow-hidden backdrop-blur-sm">
            {/* Add decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full filter blur-xl -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full filter blur-xl translate-y-1/2 -translate-x-1/4"></div>
            
            <h2 className="text-3xl md:text-6xl font-bold text-white mb-8 relative">
              Ready to Enter the Future of Music?
              <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white/30"></span>
            </h2>
            <p className="text-xl text-purple-100 mb-12 max-w-2xl mx-auto">
              Start exploring the world of music NFTs today and join the community of artists and collectors on Solana.
          </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/music-nft/marketplace/" className="px-10 py-5 bg-white text-purple-900 font-bold rounded-md hover:bg-gray-100 transition-colors text-lg hover:shadow-xl hover:shadow-white/20 hover:-translate-y-1 neo-brutalism">
                EXPLORE MARKETPLACE
            </Link>
              <Link href="/music-nft/create/" className="px-10 py-5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-md transition-all text-lg hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-600/30 neo-brutalism">
                CREATE NFT
            </Link>
            </div>
      </div>
    </div>
      </section>
    </AppLayout>
  );
}
