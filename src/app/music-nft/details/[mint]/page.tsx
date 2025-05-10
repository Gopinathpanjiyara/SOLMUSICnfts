import { fetchNFTs } from '@/services/server-utils';
import ClientComponent from './client';

/**
 * Generate static paths for each NFT at build time
 */
export async function generateStaticParams() {
  try {
    const nfts = await fetchNFTs();
    return nfts.map((nft) => ({
      mint: nft.mint,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    // Return hardcoded test data to ensure at least some pages are generated
    return [
      { mint: 'sample-mint-1' },
      { mint: 'sample-mint-2' },
      { mint: 'sample-mint-3' },
      { mint: 'fallback-mint-1' }
    ];
  }
}

/**
 * The page component that renders NFT details
 */
export default function Page({ params }: { params: { mint: string } }) {
  return <ClientComponent mint={params.mint} />;
} 