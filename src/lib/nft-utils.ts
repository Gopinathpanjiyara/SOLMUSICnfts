import { MusicNftData } from '@/components/music-nft/MusicNftCard';

/**
 * Generates a static list of mock NFTs for development and testing
 */
export function getMockNFTs(): MusicNftData[] {
  return [
    {
      title: 'Sunset Groove',
      artist: 'Chillwave Masters',
      coverArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop',
      audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
      price: 0.5,
      forSale: true,
      mint: 'mock-mint-1',
      owner: 'mock-owner-1',
      creator: 'mock-creator-1',
      genre: 'chillwave',
    },
    {
      title: 'Neon Dreams',
      artist: 'Future Beats',
      coverArt: 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=500&auto=format&fit=crop',
      audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-hip-hop-02-614.mp3',
      price: 1.2,
      forSale: true,
      mint: 'mock-mint-2',
      owner: 'mock-owner-2',
      creator: 'mock-creator-2',
      genre: 'electronic',
    },
    {
      title: 'Cyber Punk',
      artist: 'Digital Nomad',
      coverArt: 'https://images.unsplash.com/photo-1504159506876-f8338247a14a?q=80&w=500&auto=format&fit=crop',
      audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-deep-urban-623.mp3',
      price: 0.8,
      forSale: true,
      mint: 'mock-mint-3',
      owner: 'mock-owner-3',
      creator: 'mock-creator-3',
      genre: 'synthwave',
    },
    {
      title: 'Midnight Serenade',
      artist: 'Luna Nova',
      coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop',
      audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
      price: 1.5,
      forSale: false,
      mint: 'mock-mint-4',
      owner: 'mock-owner-4',
      creator: 'mock-creator-4',
      genre: 'ambient',
    },
    // Add dynamic routes for testing
    {
      title: 'Electric Dreams',
      artist: 'Synth Wave',
      coverArt: 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=500&auto=format&fit=crop',
      audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-hip-hop-02-614.mp3',
      price: 2.1,
      forSale: true,
      mint: 'c4dc2668-361b-46d3-a46d-fcfadd70a1d6',
      owner: 'mock-owner-5',
      creator: 'mock-creator-5',
      genre: 'electronic',
    },
    // More dynamic route samples
    {
      title: 'Retro Wave',
      artist: 'Outrun',
      coverArt: 'https://images.unsplash.com/photo-1504159506876-f8338247a14a?q=80&w=500&auto=format&fit=crop',
      audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-deep-urban-623.mp3',
      price: 1.8,
      forSale: true,
      mint: '3e8d7a69-0f91-47b5-9c8c-b9d9c42621f9',
      owner: 'mock-owner-6',
      creator: 'mock-creator-6',
      genre: 'retrowave',
    },
    {
      title: 'Space Journey',
      artist: 'Cosmic Sounds',
      coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop',
      audioUrl: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
      price: 0.9,
      forSale: true,
      mint: '9a1d2c5e-7f4b-48e3-baf2-1d70e6aa2b56',
      owner: 'mock-owner-7',
      creator: 'mock-creator-7',
      genre: 'ambient',
    },
  ];
}

/**
 * Find an NFT by its mint ID
 */
export function findNftByMint(mint: string): MusicNftData | undefined {
  return getMockNFTs().find(nft => nft.mint === mint);
}

/**
 * Create a new NFT with a unique mint ID
 */
export function createNFT(data: Partial<MusicNftData>): MusicNftData {
  const mint = crypto.randomUUID();
  
  return {
    title: data.title || 'Untitled Track',
    artist: data.artist || 'Unknown Artist',
    coverArt: data.coverArt || 'https://placehold.co/400x400?text=Music+NFT',
    audioUrl: data.audioUrl || 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
    price: data.price || 0.5,
    forSale: data.forSale !== undefined ? data.forSale : false,
    mint,
    owner: data.owner || 'unknown-owner',
    creator: data.creator || 'unknown-creator',
    genre: data.genre || 'other',
    creationDate: new Date().toISOString(),
  };
} 