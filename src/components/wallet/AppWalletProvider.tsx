'use client';

import { useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import the styles for the wallet adapter
import '@solana/wallet-adapter-react-ui/styles.css';

export function AppWalletProvider({ children }: { children: React.ReactNode }) {
  // Set up the network
  const network = WalletAdapterNetwork.Devnet;

  // Memoize the connection endpoint and wallet adapters for better performance
  const endpoint = useMemo(() => {
    return clusterApiUrl(network);
  }, [network]);

  // Limit to only a few wallets to reduce initial load time
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: 'confirmed' }}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
} 