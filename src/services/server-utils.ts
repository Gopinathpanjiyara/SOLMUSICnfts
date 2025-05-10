import axios from 'axios';
import { MusicNftData } from '@/components/music-nft/MusicNftCard';

// API credentials
const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0OWRlZjY3Yi02MzZmLTQxYTItYjYxNi0zNGI1NGNjM2FmY2IiLCJlbWFpbCI6ImFtYW5wbGF5ejIwMDRAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImQ0MDJkOTQ4YTZlZTQ1YWEyZDlhIiwic2NvcGVkS2V5U2VjcmV0IjoiNDBkMjEwMGQzZGI2NmZmNGNjYmVmYzUyM2QzMTIzZDMxM2NkZjFmNzM0NzJjYjE4NWNhMjQ1OTMyOTFiMzMxMCIsImV4cCI6MTc3NjE4ODI1OH0.mDdyRude-XTee32G2yI175dcqfcIgUgYax3TQ_U890E';

// Set up Pinata API client for JWT auth
const pinataApiJWT = axios.create({
  baseURL: 'https://api.pinata.cloud',
  headers: {
    Authorization: `Bearer ${PINATA_JWT}`,
  },
});

/**
 * Server-side version of fetchNFTsFromPinata that doesn't use localStorage
 * This is used for static generation
 */
export async function fetchNFTs(): Promise<MusicNftData[]> {
  try {
    console.log('Fetching NFTs from Pinata API (server-side)...');
    
    let response;
    try {
      response = await pinataApiJWT.get('/data/pinList?status=pinned', { timeout: 10000 });
      console.log(`Received ${response.data.rows.length} pins from Pinata API`);
    } catch (error) {
      console.error('Error fetching from Pinata API:', error);
      return [];
    }
    
    // Use a Map to efficiently process NFTs
    const nftMap = new Map<string, MusicNftData>();
    
    // Static test NFTs to ensure at least some are available
    const testNfts: MusicNftData[] = [
      {
        title: "Sample NFT 1",
        artist: "Test Artist",
        coverArt: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        price: 1.2,
        forSale: true,
        mint: "sample-mint-1",
        owner: "DjXn8YK3HEHzXnPiNBmKZgMRMeFTSsPeTrRYojGNZUpV",
        creator: "DjXn8YK3HEHzXnPiNBmKZgMRMeFTSsPeTrRYojGNZUpV",
        description: "This is a sample NFT for testing",
        genre: "Electronic"
      },
      {
        title: "Sample NFT 2",
        artist: "Another Artist",
        coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1470",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        price: 0.8,
        forSale: true,
        mint: "sample-mint-2",
        owner: "DjXn8YK3HEHzXnPiNBmKZgMRMeFTSsPeTrRYojGNZUpV",
        creator: "DjXn8YK3HEHzXnPiNBmKZgMRMeFTSsPeTrRYojGNZUpV",
        description: "Another sample NFT for testing",
        genre: "Rock"
      },
      {
        title: "Sample NFT 3",
        artist: "Third Artist",
        coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1470",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        price: 1.5,
        forSale: true,
        mint: "sample-mint-3",
        owner: "DjXn8YK3HEHzXnPiNBmKZgMRMeFTSsPeTrRYojGNZUpV",
        creator: "DjXn8YK3HEHzXnPiNBmKZgMRMeFTSsPeTrRYojGNZUpV",
        description: "Third sample NFT for testing",
        genre: "Pop"
      }
    ];
    
    // Add test NFTs to ensure we always have data for static generation
    testNfts.forEach(nft => {
      nftMap.set(nft.mint, nft);
    });
    
    // Process all pins to group them by mint ID
    if (response?.data?.rows) {
      response.data.rows.forEach((pin: any) => {
        const metadata = pin.metadata;
        const keyvalues = metadata?.keyvalues || {};
        
        // Skip pins without mint IDs
        if (!keyvalues.mint) return;
        
        const mintId = keyvalues.mint;
        const fileType = keyvalues.fileType || 'unknown';
        
        // Initialize the NFT data if this is the first file with this mint ID
        if (!nftMap.has(mintId)) {
          nftMap.set(mintId, {
            title: metadata?.name || 'Untitled NFT',
            artist: keyvalues.artist || 'Unknown Artist',
            coverArt: '',
            audioUrl: '',
            price: keyvalues.price ? parseFloat(keyvalues.price.toString()) : 0.5,
            forSale: keyvalues.forSale === "true" || keyvalues.forSale === true || false,
            mint: mintId,
            owner: keyvalues.owner || 'unknown',
            creator: keyvalues.creator || 'unknown',
            genre: keyvalues.genre || 'other',
            description: keyvalues.description || 'No description available'
          });
        }
        
        // Get the NFT data safely
        const nftData = nftMap.get(mintId);
        if (nftData) {
          // Update URLs based on file type
          if (fileType === 'audio') {
            nftData.audioUrl = `https://gateway.pinata.cloud/ipfs/${pin.ipfs_pin_hash}`;
          } else if (fileType === 'image') {
            nftData.coverArt = `https://gateway.pinata.cloud/ipfs/${pin.ipfs_pin_hash}`;
          }
        }
      });
    }
    
    // Convert the Map values to an array
    const nfts = Array.from(nftMap.values());
    
    // Filter out NFTs without both audio and cover art
    const validNfts = nfts.filter(nft => {
      // Keep test NFTs always
      if (nft.mint.startsWith('sample-mint-')) return true;
      
      // For real NFTs, ensure they have both audio and image
      return nft.audioUrl && nft.coverArt;
    });
    
    console.log(`Processed ${validNfts.length} valid NFTs`);
    return validNfts;
  } catch (error) {
    console.error('Error processing NFTs:', error);
    // Return test NFTs in case of any error
    return [
      {
        title: "Fallback NFT",
        artist: "Fallback Artist",
        coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1470",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        price: 1.0,
        forSale: true,
        mint: "fallback-mint-1",
        owner: "DjXn8YK3HEHzXnPiNBmKZgMRMeFTSsPeTrRYojGNZUpV",
        creator: "DjXn8YK3HEHzXnPiNBmKZgMRMeFTSsPeTrRYojGNZUpV",
        description: "Fallback NFT when API fails",
        genre: "Other"
      }
    ];
  }
} 