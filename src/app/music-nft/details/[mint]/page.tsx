// Remove 'use client' directive from this file since it has generateStaticParams
// 'use client';

import React from 'react';
import { getMockNFTs, findNftByMint } from '@/lib/nft-utils';
import NftDetailsClient from '@/components/music-nft/NftDetailsClient';

/**
 * Generates static parameters for each NFT mint ID for static site generation
 * This is crucial when using output: 'export' in next.config.js
 */
export function generateStaticParams() {
  // Return an array of params to generate statically
  return getMockNFTs().map(nft => ({
    mint: nft.mint,
  }));
}

export default function NftDetailsPage({ params }: { params: { mint: string } }) {
  const mintId = params.mint;
  
  // We don't need to pre-fetch the NFT data here
  // It will be fetched in the client component
  
  // Use the client component for all the interactive parts
  return <NftDetailsClient mintId={mintId} />;
} 