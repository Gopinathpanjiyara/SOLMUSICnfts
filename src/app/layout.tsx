import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AppWalletProvider } from '@/components/wallet/AppWalletProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import './globals.css';
import dynamic from 'next/dynamic';
import Script from 'next/script';

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
    <html lang="en" suppressHydrationWarning data-theme="dark" className="dark" style={{ backgroundColor: '#0f1729' }}>
      <head>
        <Script id="apply-dark-theme" strategy="beforeInteractive">
          {`
            (function() {
              document.documentElement.setAttribute('data-theme', 'dark');
              document.documentElement.classList.add('dark');
              document.documentElement.style.backgroundColor = '#0f1729';
            })();
          `}
        </Script>
      </head>
      <body className={`${inter.className} bg-background`} style={{ backgroundColor: '#0f1729', color: 'white' }}>
        <ThemeProvider>
          <AppWalletProvider>
            {children}
          </AppWalletProvider>
        </ThemeProvider>
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
