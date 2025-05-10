'use client';

import { useEffect, useState } from 'react';
import { fetchNFTsFromPinata } from '@/services/pinata';
import { MusicNftData } from '@/components/music-nft/MusicNftCard';
import { ShareNftBlink } from '@/components/dialect/DialectBlinks';
import { IconPlayerPlay, IconShare } from '@tabler/icons-react';

interface NFTDetailsClientProps {
  mint: string;
}

export default function NFTDetailsClient({ mint }: NFTDetailsClientProps) {
  const [nft, setNft] = useState<MusicNftData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNFT = async () => {
      try {
        setLoading(true);
        const nfts = await fetchNFTsFromPinata();
        const foundNft = nfts.find(n => n.mint === mint);
        setNft(foundNft || null);
      } catch (error) {
        console.error('Error loading NFT:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNFT();
  }, [mint]);

  const handleShareViaBlink = () => {
    if (nft) {
      // Create a blink view URL that will show all NFT info and handle the purchase
      const blinkViewUrl = `/blink-view?nft=${nft.mint}&title=${encodeURIComponent(nft.title)}&artist=${encodeURIComponent(nft.artist)}&price=${nft.price}&coverArt=${encodeURIComponent(nft.coverArt)}&owner=${encodeURIComponent(nft.owner)}`;
      
      // Generate a shareable link for the viewing page
      const shareableLink = `${window.location.origin}${blinkViewUrl}`;
      
      // Copy to clipboard for easy sharing
      navigator.clipboard.writeText(shareableLink)
        .then(() => {
          alert("Shareable link copied to clipboard! You can now paste and share it anywhere.");
        })
        .catch(err => {
          console.error("Failed to copy link: ", err);
          // Fallback - open the blink directly
          window.open(blinkViewUrl, '_blank');
        });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-16 h-16 border-4 border-purple-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-2xl">NFT not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* NFT Image Section */}
          <div className="relative group">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={nft.coverArt} 
                alt={nft.title}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center justify-center w-16 h-16 rounded-full bg-purple-600 hover:bg-purple-700 transition-colors">
                  <IconPlayerPlay className="w-8 h-8" />
                </button>
              </div>
            </div>
          </div>

          {/* NFT Details Section */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-4">{nft.title}</h1>
              <p className="text-xl text-gray-400">by {nft.artist}</p>
            </div>

            <div className="p-6 bg-gray-900 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">Price</span>
                <span className="text-2xl font-mono font-bold">{nft.price} SOL</span>
              </div>
              
              <div className="space-y-4">
                <ShareNftBlink 
                  nft={nft}
                  onPurchaseComplete={() => {
                    // Refresh NFT data after purchase
                    window.location.reload();
                  }}
                />
                
                {/* Solana Blink button for sharing music */}
                <button
                  onClick={handleShareViaBlink}
                  className="w-full flex items-center justify-center py-3 bg-gradient-to-r from-blue-600 to-blue-800 rounded-md font-medium text-white"
                >
                  <IconShare className="w-5 h-5 mr-2" />
                  Copy Purchase Link
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-400">{nft.description || 'No description available.'}</p>
            </div>

            {/* Additional NFT details can be added here */}
          </div>
        </div>
      </div>
    </div>
  );
} 