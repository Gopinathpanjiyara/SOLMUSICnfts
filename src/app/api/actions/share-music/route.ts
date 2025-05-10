import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  BLOCKCHAIN_IDS,
} from "@solana/actions";

import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  Keypair,
} from "@solana/web3.js";

import { fetchNFTsFromPinata, updateNFTOwnership, createNFTCopy } from "@/services/pinata";
import { Metaplex, keypairIdentity, toBigNumber } from "@metaplex-foundation/js";

// CAIP-2 format for Solana
const blockchain = BLOCKCHAIN_IDS.devnet;

// Create a connection to the Solana blockchain
const connection = new Connection("https://api.devnet.solana.com");

// Create headers with CAIP blockchain ID
const headers = {
  ...ACTIONS_CORS_HEADERS,
  "x-blockchain-ids": blockchain,
  "x-action-version": "2.4",
};

// OPTIONS endpoint is required for CORS preflight requests
export const OPTIONS = async () => {
  return new Response(null, { headers });
};

// Helper to get the absolute URL for assets
function getAbsoluteUrl(req: Request, path: string): string {
  // Get the host from the request
  const host = req.headers.get('host') || 'localhost:3001';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  
  // Make sure we use the correct port for localhost
  const finalHost = host.includes('localhost') && !host.includes(':3001') ? 
    'localhost:3001' : host;
    
  return `${protocol}://${finalHost}${path}`;
}

// GET endpoint returns the Blink metadata (JSON) and UI configuration
export const GET = async (req: Request) => {
  // Extract parameters from the URL to populate the Blink with NFT data
  const url = new URL(req.url);
  const amount = url.searchParams.get("amount") || "0.1";
  const nftId = url.searchParams.get("nft") || "";
  const title = url.searchParams.get("title") || "Music NFT";
  const artist = url.searchParams.get("artist") || "Artist";
  
  // Use the cover art if provided, otherwise fall back to default image
  let iconUrl = getAbsoluteUrl(req, "/share-music.png");
  
  // If coverArt URL was provided directly in the URL params, use it
  const coverArtParam = url.searchParams.get("coverArt");
  if (coverArtParam) {
    iconUrl = coverArtParam;
  } else {
    // Only try to fetch from Pinata if no direct coverArt URL was provided
    try {
      // Try to fetch the NFT details from Pinata to get the cover art
      if (nftId) {
        const nfts = await fetchNFTsFromPinata();
        const nftDetails = nfts.find(nft => nft.mint === nftId);
        
        if (nftDetails && nftDetails.coverArt) {
          // Use the actual NFT cover art
          iconUrl = nftDetails.coverArt;
        }
      }
    } catch (error) {
      console.error("Error fetching NFT details:", error);
      // Continue with default icon if error occurs
    }
  }
  
  // This JSON is used to render the Blink UI
  const response: ActionGetResponse = {
    type: "action",
    icon: iconUrl,
    label: "Get Music",
    title: title,
    description:
      `${artist} shared this music NFT with you. Purchase it directly with SOL.`,
    links: {
      actions: [
        {
          type: "transaction",
          label: `Buy for ${amount} SOL`,
          href: `/api/actions/share-music?amount=${amount}&nft=${nftId}&title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`,
        },
        {
          type: "transaction",
          href: `/api/actions/share-music?amount={custom_amount}&nft=${nftId}&title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`,
          label: "Custom Amount",
          parameters: [
            {
              name: "custom_amount",
              label: "Enter SOL amount",
              type: "number",
            }
          ],
        },
      ],
    },
  };

  // Log the response for debugging
  console.log("Blink response:", JSON.stringify(response, null, 2));

  // Return the response with proper headers
  return new Response(JSON.stringify(response), {
    status: 200,
    headers,
  });
};

// POST endpoint handles the actual transaction creation
export const POST = async (req: Request) => {
  try {
    // Step 1: Extract parameters from the URL
    const url = new URL(req.url);

    // Amount of SOL to transfer is passed in the URL
    const amount = Number(url.searchParams.get("amount") || "0.1");
    
    // NFT ID parameter
    const nftId = url.searchParams.get("nft") || "";
    
    // Title and artist for the NFT
    const title = url.searchParams.get("title") || "Music NFT";
    const artist = url.searchParams.get("artist") || "Artist";
    
    // Cover art URL
    const coverArt = url.searchParams.get("coverArt") || "";
    
    // Owner address parameter (if provided directly)
    const ownerParam = url.searchParams.get("owner") || "";

    // Get seller wallet address from owner param or look it up
    const sellerWallet = ownerParam || await getNFTOwnerWallet(nftId);
    
    // Payer public key is passed in the request body
    const request: ActionPostRequest = await req.json();
    const payer = new PublicKey(request.account);

    // Receiver is the NFT owner's wallet address
    const receiver = new PublicKey(sellerWallet);

    // We need to create multiple instructions:
    // 1. A SOL transfer to pay for the NFT
    // 2. A transaction to mint the NFT to the buyer's wallet 
    
    // First, create the SOL transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: receiver,
      lamports: amount * LAMPORTS_PER_SOL,
    });

    // Get the latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    
    // Create a transaction message with just the transfer instruction
    // We handle the NFT minting separately after the transaction is successful
    const message = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash,
      instructions: [transferInstruction],
    }).compileToV0Message();

    // Create a versioned transaction
    const transaction = new VersionedTransaction(message);

    // Create a response with the serialized transaction
    const response: ActionPostResponse = {
      type: "transaction",
      transaction: Buffer.from(transaction.serialize()).toString("base64"),
    };

    // Also process NFT ownership transfer here, since we can't guarantee a webhook will work
    try {
      // Fetch NFT details
      if (nftId) {
        console.log(`Processing ownership transfer for NFT ${nftId} to ${payer.toBase58()}`);
        
        const nfts = await fetchNFTsFromPinata();
        const nft = nfts.find(n => n.mint === nftId);
        
        if (nft) {
          // Generate a new mint ID for the copy that includes the wallet address
          // This will help identify and track this NFT
          const newMintId = `${nftId}-${Date.now()}`;
          
          // Create a copy of the NFT with the new owner
          const nftCopy = await createNFTCopy(nft, payer.toBase58(), newMintId);
          
          if (nftCopy) {
            console.log(`Successfully created NFT copy in database: ${nftCopy.mint} for ${payer.toBase58()}`);
            console.log(`Will mint on-chain NFT for the buyer when transaction completes`);
          } else {
            console.error(`Failed to create NFT copy for ${payer.toBase58()}`);
          }
        }
      }
    } catch (transferError) {
      // Log error but don't fail the transaction - ownership can be updated later
      console.error("Error transferring NFT ownership:", transferError);
    }

    // Return the response with proper headers
    return Response.json(response, { status: 200, headers });
  } catch (error) {
    // Log and return an error response
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers,
    });
  }
};

// API endpoint to notify the server of a successful transaction and update NFT ownership
export async function PUT(req: Request) {
  try {
    const data = await req.json();
    
    // Extract transaction signature and wallet details
    const { 
      signature,
      buyerWallet,
      nftId
    } = data;
    
    if (!buyerWallet || !nftId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers }
      );
    }
    
    // In a production application, we would verify the transaction
    // by checking the signature on the Solana blockchain
    
    // Get the NFT details
    console.log(`Completing purchase for NFT ID: ${nftId}`);
    const nfts = await fetchNFTsFromPinata();
    const nft = nfts.find(n => n.mint === nftId);
    
    if (!nft) {
      console.error(`NFT with ID ${nftId} not found`);
      return new Response(
        JSON.stringify({ success: false, error: "NFT not found" }),
        { status: 404, headers }
      );
    }
    
    console.log(`Creating NFT copy for ${buyerWallet}`);
    
    try {
      // Now create an actual on-chain NFT and send it to the buyer
      
      // Create a temporary keypair for the minting operation
      // In a production app, this would be a secure server wallet
      const mintAuthority = Keypair.generate();
      
      // Airdrop SOL to the temporary wallet for gas fees
      const airdropSignature = await connection.requestAirdrop(
        mintAuthority.publicKey,
        0.5 * LAMPORTS_PER_SOL // Increased amount for storage fees
      );
      
      // Wait for the airdrop to confirm
      await connection.confirmTransaction(airdropSignature);
      
      // Initialize Metaplex with the mint authority
      const metaplex = Metaplex.make(connection)
        .use(keypairIdentity(mintAuthority));
      
      // Format NFT metadata
      const buyerPublicKey = new PublicKey(buyerWallet);
      const nftName = nft.title;
      const nftSymbol = nft.artist.substring(0, 4).toUpperCase();
      const nftDescription = `Music NFT by ${nft.artist}`;
      const coverArtUrl = nft.coverArt;
      const audioUrl = nft.audioUrl || undefined; // Use undefined instead of null
      
      console.log(`Minting on-chain NFT "${nftName}" to ${buyerWallet}`);
      
      // Create proper NFT metadata that follows Metaplex standard
      // This is critical for the NFT to show up in wallets
      const { uri } = await metaplex.nfts().uploadMetadata({
        name: nftName,
        symbol: nftSymbol,
        description: nftDescription,
        image: coverArtUrl,
        animation_url: audioUrl,
        external_url: `https://music-nft-marketplace.com/nft/${nftId}`,
        attributes: [
          {
            trait_type: 'Artist',
            value: nft.artist
          },
          {
            trait_type: 'Genre',
            value: nft.genre || 'Music'
          },
          {
            trait_type: 'Type',
            value: 'Music NFT'
          }
        ],
        properties: {
          files: [
            {
              uri: coverArtUrl,
              type: 'image/jpeg'
            },
            ...(audioUrl ? [{
              uri: audioUrl,
              type: 'audio/mp3'
            }] : [])
          ],
          category: 'music'
        }
      });
      
      console.log('Metadata URI:', uri);
      
      // Create NFT using Metaplex with the proper metadata URI
      const { nft: onChainNft } = await metaplex.nfts().create({
        uri: uri,
        name: nftName,
        symbol: nftSymbol,
        sellerFeeBasisPoints: 500, // 5% royalty
        tokenOwner: buyerPublicKey,
        // Don't set update authority - it defaults to the mint authority which is correct
        isMutable: true,
      });
      
      console.log(`Successfully minted on-chain NFT: ${onChainNft.address.toString()}`);
      
      // Update the local NFT copy with the on-chain mint address
      const newMintId = `onchain-${onChainNft.address.toString()}`;
      const nftCopy = await createNFTCopy(nft, buyerWallet, newMintId);
      
      if (!nftCopy) {
        throw new Error('Failed to record NFT in database after on-chain minting');
      }
      
      // Return success response with the on-chain NFT address
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "NFT successfully minted on-chain and transferred to purchaser",
          nft: {
            ...nftCopy,
            onChainAddress: onChainNft.address.toString()
          }
        }),
        { status: 200, headers }
      );
    } catch (mintError: any) {
      console.error("Error minting on-chain NFT:", mintError);
      
      // If on-chain minting fails, still create a regular copy in the database
      // This way the user at least gets something, and we can try minting again later
      const newMintId = `purchased-${nftId}-${Date.now()}`;
      const nftCopy = await createNFTCopy(nft, buyerWallet, newMintId);
      
      if (!nftCopy) {
        return new Response(
          JSON.stringify({ success: false, error: "Failed to create NFT copy" }),
          { status: 500, headers }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "NFT transferred to purchaser (off-chain only, on-chain minting failed)",
          error: mintError.message,
          nft: nftCopy
        }),
        { status: 200, headers }
      );
    }
  } catch (error) {
    console.error("Error processing purchase completion:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers }
    );
  }
}

// Helper function to get the NFT owner's wallet address
// In a real application, this would query your database or blockchain
async function getNFTOwnerWallet(nftId: string): Promise<string> {
  try {
    // Try to fetch the NFT details from Pinata
    if (nftId) {
      const nfts = await fetchNFTsFromPinata();
      const nftDetails = nfts.find(nft => nft.mint === nftId);
      
      if (nftDetails && nftDetails.owner) {
        // Return the actual owner's wallet address
        return nftDetails.owner;
      }
    }
  } catch (error) {
    console.error("Error fetching NFT owner:", error);
  }
  
  // Default fallback wallet if the NFT ID is not found
  return "BijikHHEuzpQJG5CZn5FW5ewfuUbGJNzABCRUQfnSZjY";
} 