import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import DialectWrapper from '@/components/dialect/DialectWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Music NFT Marketplace',
  description: 'A marketplace for music NFTs on Solana',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DialectWrapper>
          {children}
        </DialectWrapper>
      </body>
    </html>
  );
}
