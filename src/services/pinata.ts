import axios from 'axios';
import { MusicNftData } from '@/components/music-nft/MusicNftCard';
import env from '@/config/env';

// API credentials from environment variables
// Use client-side variables when running in browser
const PINATA_API_KEY = env.isClient ? env.NEXT_PUBLIC_PINATA_API_KEY : env.PINATA_API_KEY;
const PINATA_API_SECRET = env.isClient ? env.NEXT_PUBLIC_PINATA_API_SECRET : env.PINATA_API_SECRET;
const PINATA_JWT = env.isClient ? env.NEXT_PUBLIC_PINATA_JWT : env.PINATA_JWT;
const PINATA_GATEWAY_URL = env.NEXT_PUBLIC_PINATA_GATEWAY_URL;

// Set up Pinata API client for JWT auth (used for data/pinList endpoint)
const pinataApiJWT = axios.create({
  baseURL: 'https://api.pinata.cloud',
  headers: {
    Authorization: `Bearer ${PINATA_JWT}`,
  },
});

// Set up Pinata API client for API Key/Secret auth (used for pinning endpoints)
const pinataApiKeys = axios.create({
  baseURL: 'https://api.pinata.cloud',
  headers: {
    pinata_api_key: PINATA_API_KEY,
    pinata_secret_api_key: PINATA_API_SECRET,
  },
});

// Define the interface for application use
export interface PinataMetadata {
  name: string;
  keyvalues: {
    artist: string;
    description?: string;
    genre?: string;
    price: number;
    forSale: boolean;
    mint: string;
    owner: string;
    creator?: string;
    audioUrl?: string;
    coverArt?: string;
    fileType?: 'audio' | 'image' | string; // Type of file being uploaded
  };
}

// Internal interface for Pinata API (all values must be strings or numbers)
interface PinataApiMetadata {
  name: string;
  keyvalues: {
    [key: string]: string | number;
  };
}

// Function to upload a file to IPFS
export async function uploadToIPFS(file: File, metadata: PinataMetadata) {
  try {
    // Check file size - Pinata free tier has 100MB limit, but we'll enforce 50MB to be safe
    const MAX_FILE_SIZE_MB = 50;
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please compress your file before uploading.`);
    }

    const formData = new FormData();
    formData.append('file', file);
    
    const pinataOptions = JSON.stringify({
      cidVersion: 0,
    });
    
    // For audio uploads, limit to 7 key fields maximum to be safe
    const isAudio = metadata.keyvalues.fileType === 'audio';
    
    // Select only the essential fields based on file type (max 7 for audio, max 9 for images)
    // This ensures we never exceed Pinata's 10 key limit
    const pinataApiMetadata: PinataApiMetadata = {
      name: metadata.name,
      keyvalues: {
        // Start with the absolute minimum required fields (5)
        artist: metadata.keyvalues.artist,
        mint: metadata.keyvalues.mint,
        owner: metadata.keyvalues.owner,
        price: metadata.keyvalues.price,
        forSale: metadata.keyvalues.forSale ? "true" : "false",
      }
    };
    
    // Add fileType (6th field)
    pinataApiMetadata.keyvalues.fileType = metadata.keyvalues.fileType || 
      (file.type.startsWith('audio/') ? 'audio' : 'image');
    
    // Audio uploads need to reference cover art, so we prioritize differently
    if (isAudio) {
      // For audio files, prioritize coverArt reference (7th field)
      if (metadata.keyvalues.coverArt) {
        pinataApiMetadata.keyvalues.coverArt = metadata.keyvalues.coverArt;
      }
      
      // We're at 7 fields now, which is safe for audio files
    } 
    else {
      // For image uploads, we can include more fields (up to 9)
      // Add creator field for images (7th field)
      if (metadata.keyvalues.creator) {
        pinataApiMetadata.keyvalues.creator = metadata.keyvalues.creator;
      }
      
      // Add genre if available (8th field)
      if (metadata.keyvalues.genre) {
        pinataApiMetadata.keyvalues.genre = metadata.keyvalues.genre;
      }
      
      // Add description if available and short (9th field)
      if (metadata.keyvalues.description && metadata.keyvalues.description.length < 100) {
        pinataApiMetadata.keyvalues.description = metadata.keyvalues.description;
      }
    }
    
    const pinataMetadata = JSON.stringify(pinataApiMetadata);
    
    console.log('Metadata being sent to Pinata:', pinataMetadata);
    console.log('Number of metadata keys:', Object.keys(pinataApiMetadata.keyvalues).length);
    
    formData.append('pinataMetadata', pinataMetadata);
    formData.append('pinataOptions', pinataOptions);
    
    // Use direct fetch API instead of axios for more control over form data
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Pinata error response:', errorData);
      
      // Handle common Pinata API errors with more descriptive messages
      if (response.status === 400) {
        if (errorData?.error?.details?.includes('Payload too large')) {
          throw new Error(`File size too large for Pinata. Audio must be under 15MB and images under 5MB.`);
        } else if (errorData?.error?.details?.includes('Invalid number of metadata key-values')) {
          throw new Error(`Too many metadata fields. This is an internal error, please report it.`);
        } else {
          throw new Error(`Pinata upload failed: ${errorData?.error?.details || 'Bad request'}. Try with a smaller file.`);
        }
      } else if (response.status === 401) {
        throw new Error('Authentication failed with Pinata. Please try again later.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (response.status >= 500) {
        throw new Error('Pinata server error. The service may be down, please try again later.');
      } else {
        throw new Error(`Pinata upload failed with status ${response.status}: ${errorData?.error || 'Unknown error'}`);
      }
    }
    
    const responseData = await response.json();
    return responseData.IpfsHash;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}

// Function to fetch NFTs from Pinata
export async function fetchNFTsFromPinata(forceRefresh: boolean = false): Promise<MusicNftData[]> {
  try {
    console.log('Fetching fresh NFTs from Pinata API...');
    
    // Define cache key
    const CACHE_KEY = '_nft_cache_data';
    
    // Check if we have a recent cache in localStorage
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData && !forceRefresh) {
      try {
        const nfts = JSON.parse(cachedData) as MusicNftData[];
        // If the cache has NFTs, use it; otherwise, fetch fresh data
        if (nfts.length > 0) {
          console.log(`Using cached NFT data (${nfts.length} NFTs)`);
          return nfts;
        } else {
          console.log('Cached data has 0 NFTs, fetching fresh data instead');
          // Continue with the API call if cache has 0 NFTs
        }
      } catch (error) {
        console.error('Error parsing cached NFT data, will fetch fresh data:', error);
        // Continue with the API call if cache parsing fails
      }
    } else if (forceRefresh) {
      console.log('Force refresh requested, fetching fresh data from Pinata');
    }
    
    // Clear existing cache if force refreshing
    if (forceRefresh) {
      localStorage.removeItem(CACHE_KEY);
    }
    
    console.log('Making API request to Pinata...');
    let response;
    try {
      response = await pinataApiJWT.get('/data/pinList?status=pinned', { timeout: 10000 });
      console.log(`Received ${response.data.rows.length} pins from Pinata API`);
    } catch (error) {
      console.error('Error fetching from Pinata API:', error);
      return [];
    }
    
    // Use a more efficient data structure
    const nftMap = new Map<string, any>();
    
    // Process all pins to group them by mint ID
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
          price: 0.5, // Default price
          forSale: keyvalues.forSale === "true" || keyvalues.forSale === true || false,
          mint: mintId,
          owner: keyvalues.owner || 'unknown',
          creator: keyvalues.creator || 'unknown',
          genre: keyvalues.genre || 'other'
        });
      }
      
      const nftData = nftMap.get(mintId);
      
      // Parse price if available
      if (keyvalues.price !== undefined) {
        if (typeof keyvalues.price === 'number') {
          nftData.price = keyvalues.price;
        } else if (typeof keyvalues.price === 'string') {
          const parsedPrice = parseFloat(keyvalues.price);
          if (!isNaN(parsedPrice)) {
            nftData.price = parsedPrice;
          }
        }
      }
      
      // Update URLs based on file type
      if (fileType === 'audio') {
        nftData.audioUrl = keyvalues.audioUrl || `${PINATA_GATEWAY_URL}${pin.ipfs_pin_hash}`;
      } else if (fileType === 'image') {
        nftData.coverArt = keyvalues.coverArt || `${PINATA_GATEWAY_URL}${pin.ipfs_pin_hash}`;
      } else {
        // If file type is not specified, try to guess based on metadata or use as default
        if (!nftData.coverArt) {
          nftData.coverArt = `${PINATA_GATEWAY_URL}${pin.ipfs_pin_hash}`;
        } else if (!nftData.audioUrl) {
          nftData.audioUrl = `${PINATA_GATEWAY_URL}${pin.ipfs_pin_hash}`;
        }
      }
    });
    
    // Convert the map to an array of NFT data
    const nfts: MusicNftData[] = Array.from(nftMap.values())
      .filter(nft => nft.coverArt || nft.audioUrl)
      .map(nft => {
        // Set defaults for missing fields
        if (!nft.audioUrl) {
          nft.audioUrl = 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3';
        }
        if (!nft.coverArt) {
          nft.coverArt = 'https://placehold.co/600x600/3949ab/ffffff?text=Music+NFT';
        }
        return nft;
      });
    
    console.log(`Processed ${nfts.length} NFTs from Pinata data`);
    
    // Only cache if we found NFTs
    if (nfts.length > 0) {
      // Cache the results in localStorage for subsequent calls
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(nfts));
        console.log(`Cached ${nfts.length} NFTs in localStorage`);
      } catch (error) {
        console.error('Error caching NFT data:', error);
      }
    } else {
      console.warn('No NFTs found in Pinata data, not updating cache');
    }
    
    return nfts;
  } catch (error) {
    console.error('Error fetching NFTs from Pinata:', error);
    return []; // Return empty array instead of throwing error
  }
}

// Update NFT ownership in Pinata (in a real app, this would update the metadata on IPFS)
export async function updateNFTOwnership(nft: MusicNftData, newOwner: string): Promise<MusicNftData> {
  try {
    const updatedMetadata = {
      ...nft,
      owner: newOwner,
      lastTransactionDate: new Date().toISOString()
    };
    
    // Log for debug
    console.log(`Updated ownership of NFT ${nft.mint} from ${nft.owner} to ${newOwner}`);
    
    // In a production app, this would update the metadata on IPFS/Pinata
    // For the demo, we need to update our local data to reflect ownership change
    
    // Force clear the cache
    localStorage.removeItem('_nft_cache_data');
    console.log('Cleared NFT cache after ownership transfer');
    
    // Since we are in a demo, we can also manually update any pins that contain this NFT
    // This is a workaround for the lack of a real database
    try {
      // Fetch the latest data (this will trigger a load from Pinata)
      await fetchNFTsFromPinata(true);
      console.log('Successfully refreshed NFT data from Pinata');
    } catch (error) {
      console.error('Error refreshing NFT data after ownership update:', error);
    }
    
    return updatedMetadata;
  } catch (error) {
    console.error('Error updating NFT ownership:', error);
    throw error;
  }
}

// Create a new NFT as a copy with new owner
export async function createNFTCopy(
  nft: MusicNftData, 
  newOwner: string,
  mintAddress?: string
): Promise<MusicNftData | null> {
  try {
    // Use provided mint address from Metaplex if available, otherwise generate a local one
    const newMint = mintAddress || `copy-${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${nft.mint.substring(0, 6)}`;
    
    // Create the new NFT metadata
    const newNFT: MusicNftData = {
      ...nft,
      mint: newMint,
      owner: newOwner,
      creator: nft.creator, // Original creator still gets credit
      forSale: false, // New copy is not for sale by default
      // Include creation timestamp
      creationDate: new Date().toISOString(),
      // Add a flag to indicate this is a minted on-chain NFT if mintAddress was provided
      onChain: !!mintAddress
    };
    
    // Log for debug
    console.log(`Created new NFT copy with mint ${newMint} for owner ${newOwner}`);
    
    // In a production app, this would store the new NFT on IPFS/Pinata
    // For the demo, we just return the new NFT object
    return newNFT;
  } catch (error) {
    console.error('Error creating NFT copy:', error);
    return null;
  }
}

// Add this new function to create combined NFT metadata
export async function createCombinedNFT(
  audioFile: File,
  imageFile: File,
  metadata: {
    title: string;
    artist: string;
    description?: string;
    genre?: string;
    price: number;
    mint: string;
    owner: string;
  }
): Promise<{coverArtIpfsHash: string, audioIpfsHash: string} | null> {
  try {
    console.log('Creating combined NFT with metadata:', metadata);
    
    // First upload the image file with minimal metadata
    const imageMetadata: PinataMetadata = {
      name: metadata.title,
      keyvalues: {
        artist: metadata.artist,
        mint: metadata.mint,
        owner: metadata.owner,
        price: metadata.price,
        forSale: true,
        fileType: 'image',
        // Only include 6 fields to stay safely under the limit
      }
    };
    
    console.log('Uploading cover image with minimal metadata');
    const coverArtIpfsHash = await uploadToIPFS(imageFile, imageMetadata);
    
    // Now upload the audio file with reference to the cover art
    const audioMetadata: PinataMetadata = {
      name: metadata.title,
      keyvalues: {
        artist: metadata.artist, 
        mint: metadata.mint,
        owner: metadata.owner,
        price: metadata.price,
        forSale: true,
        fileType: 'audio',
        // Include reference to cover art as 7th field
        coverArt: `${PINATA_GATEWAY_URL}${coverArtIpfsHash}`
      }
    };
    
    // Only add genre if provided and needed
    if (metadata.genre && metadata.genre !== 'electronic') {
      audioMetadata.keyvalues.genre = metadata.genre;
    }
    
    console.log('Uploading audio with reference to cover art');
    const audioIpfsHash = await uploadToIPFS(audioFile, audioMetadata);
    
    // Return both IPFS hashes for the complete NFT
    return { 
      coverArtIpfsHash,
      audioIpfsHash
    };
  } catch (error) {
    console.error('Error creating combined NFT:', error);
    return null;
  }
} 