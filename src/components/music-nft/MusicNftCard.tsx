import { useState, memo, useCallback } from 'react';
import Link from 'next/link';
import { IconPlayerPlay, IconPlayerPause, IconShoppingCart, IconDots, IconCoin, IconMusic } from '@tabler/icons-react';
import { useWallet } from '@solana/wallet-adapter-react';

export interface MusicNftData {
  title: string;
  artist: string;
  coverArt: string;
  audioUrl: string;
  price: number;
  forSale: boolean;
  mint: string;
  owner: string;
  creator: string;
  genre?: string;
  lastTransactionDate?: string;
  creationDate?: string;
  onChain?: boolean;
}

interface MusicNftCardProps {
  nft: MusicNftData;
  onBuy?: (mint: string) => void;
  onList?: (mint: string, price: number) => void;
  onUnlist?: (mint: string) => void;
  showActions?: boolean;
}

const MusicNftCard = memo(({ 
  nft, 
  onBuy, 
  onList, 
  onUnlist,
  showActions = true
}: MusicNftCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [listPrice, setListPrice] = useState('');
  const [showListDialog, setShowListDialog] = useState(false);
  
  const { publicKey } = useWallet();
  
  const isOwner = publicKey?.toBase58() === nft.owner;
  
  const togglePlay = useCallback(() => {
    if (!audioElement) {
      const audio = new Audio(nft.audioUrl);
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
  }, [audioElement, isPlaying, nft.audioUrl]);
  
  const handleBuy = useCallback(() => {
    if (onBuy) onBuy(nft.mint);
  }, [onBuy, nft.mint]);
  
  const handleList = () => {
    if (onList && listPrice) {
      const priceInSol = parseFloat(listPrice);
      if (!isNaN(priceInSol) && priceInSol > 0) {
        onList(nft.mint, priceInSol);
        setShowListDialog(false);
        setListPrice('');
      }
    }
  };
  
  const handleUnlist = () => {
    if (onUnlist) onUnlist(nft.mint);
    setShowMenu(false);
  };
  
  return (
    <div className="card bg-base-100 shadow-xl overflow-hidden group h-full">
      <figure className="relative aspect-square">
        <Link href={`/music-nft/details/${nft.mint}`}>
          <img 
            src={nft.coverArt} 
            alt={nft.title} 
            className="w-full h-full object-cover transform-gpu group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
        <button 
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <IconPlayerPause className="w-16 h-16 text-white" />
          ) : (
            <IconPlayerPlay className="w-16 h-16 text-white" />
          )}
        </button>
        
        {/* On-chain badge */}
        {nft.onChain && (
          <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded-md text-xs font-medium">
            On-chain
          </div>
        )}
      </figure>
      <div className="card-body p-6 pb-4">
        <Link href={`/music-nft/details/${nft.mint}`} className="hover:underline">
          <h2 className="card-title text-lg mb-1">{nft.title}</h2>
        </Link>
        <p className="text-sm opacity-70 mb-3">{nft.artist}</p>
        
        <div className="card-actions justify-between items-center mt-auto">
          <div className="text-primary font-semibold">
            {nft.forSale 
              ? `${Number(nft.price).toFixed(2)} SOL` 
              : 'Not for sale'
            }
          </div>
          
          {showActions && (
            <div className="flex items-center gap-2">
              {/* Show Buy button for non-owners when NFT is for sale */}
              {!isOwner && nft.forSale && onBuy && (
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={handleBuy}
                  aria-label="Buy NFT"
                >
                  <IconShoppingCart className="w-4 h-4 mr-1" />
                  Buy
                </button>
              )}
              
              <div className="relative">
                <button 
                  className="btn btn-sm btn-circle"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <IconDots />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-base-200 rounded-md shadow-lg z-10">
                    <div className="py-1">
                      {isOwner && !nft.forSale && (
                        <button 
                          className="block w-full text-left px-4 py-2 hover:bg-base-300"
                          onClick={() => {
                            setShowListDialog(true);
                            setShowMenu(false);
                          }}
                        >
                          List for sale
                        </button>
                      )}
                      {isOwner && nft.forSale && (
                        <button 
                          className="block w-full text-left px-4 py-2 hover:bg-base-300"
                          onClick={handleUnlist}
                        >
                          Remove from sale
                        </button>
                      )}
                      {/* Add Buy option to the menu for non-owners */}
                      {!isOwner && nft.forSale && onBuy && (
                        <button 
                          className="block w-full text-left px-4 py-2 hover:bg-base-300"
                          onClick={handleBuy}
                        >
                          Buy NFT
                        </button>
                      )}
                      <Link 
                        href={`/music-nft/details/${nft.mint}`}
                        className="block px-4 py-2 hover:bg-base-300"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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
    </div>
  );
});

MusicNftCard.displayName = 'MusicNftCard';

export default MusicNftCard; 