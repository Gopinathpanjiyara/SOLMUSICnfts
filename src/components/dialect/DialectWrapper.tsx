'use client';

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo, type ReactNode } from 'react';
import { DialectBlinksProvider } from './DialectBlinks';

require('@solana/wallet-adapter-react-ui/styles.css');

interface DialectWrapperProps {
  children: ReactNode;
}

export default function DialectWrapper({ children }: DialectWrapperProps) {
  // You can change network to 'devnet' or 'mainnet-beta' as needed
  const network = WalletAdapterNetwork.Devnet;
  
  // Always use Devnet endpoint
  const endpoint = useMemo(() => 
    clusterApiUrl(network), 
    [network]
  );

  // Initialize multiple wallet adapters for better compatibility
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network }),
  ], [network]);

  // Log the environment variables for debugging
  console.log("Wallet wrapper initialized with network:", network);
  console.log("Using RPC endpoint:", endpoint);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <DialectBlinksProvider>
            {children}
          </DialectBlinksProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
} 