import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AppWalletProvider } from '@/components/wallet/AppWalletProvider';
import './globals.css';
import dynamic from 'next/dynamic';

// Dynamically import Analytics with no SSR to avoid hydration issues
const Analytics = dynamic(() => import('@/components/Analytics').then(mod => mod.Analytics), {
  ssr: false,
});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Music NFT - Web3 Music Streaming Platform',
  description: 'Buy, sell, and collect unique 30-second music NFTs on the Solana blockchain.',
  icons: {
    icon: '/favicon.ico',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AppWalletProvider>
          {children}
        </AppWalletProvider>
        <Toaster position="bottom-right" toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }} />
        <Analytics />
      </body>
    </html>
  );
}
