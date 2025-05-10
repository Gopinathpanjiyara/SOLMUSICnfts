'use client';

import React from 'react';
import Link from 'next/link';
import { IconBrandGithub, IconBrandTwitter, IconBrandDiscord } from '@tabler/icons-react';

export function Footer() {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-black text-white relative overflow-hidden">
      <div className="footer-glow"></div>
      <style jsx>{`
        .footer-glow {
          position: absolute;
          top: 0;
          left: 30%;
          width: 40%;
          height: 60px;
          background: radial-gradient(circle, rgba(128, 0, 255, 0.3) 0%, rgba(128, 0, 255, 0.05) 50%, transparent 70%);
          filter: blur(50px);
          opacity: 0.6;
          pointer-events: none;
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div>
            <h3 className="text-xl font-bold mb-4 text-purple-400">solMusic</h3>
            <p className="text-gray-400 mb-4">
              Discover, collect and trade music NFTs on Solana. Support your favorite artists directly.
            </p>
            <div className="flex space-x-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-900/20 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors">
                <IconBrandTwitter size={20} />
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-900/20 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors">
                <IconBrandDiscord size={20} />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-900/20 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors">
                <IconBrandGithub size={20} />
              </a>
            </div>
          </div>
          
            <div>
            <h3 className="text-xl font-bold mb-4 text-purple-400">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/music-nft/marketplace" className="text-gray-400 hover:text-purple-300 transition-colors">Marketplace</Link></li>
              <li><Link href="/music-nft/shorts" className="text-gray-400 hover:text-purple-300 transition-colors">Music Shorts</Link></li>
              <li><Link href="/music-nft/create" className="text-gray-400 hover:text-purple-300 transition-colors">Create NFT</Link></li>
              <li><Link href="/profile" className="text-gray-400 hover:text-purple-300 transition-colors">Profile</Link></li>
              </ul>
            </div>
            
            <div>
            <h3 className="text-xl font-bold mb-4 text-purple-400">Resources</h3>
            <ul className="space-y-2">
              <li><Link href="/faq" className="text-gray-400 hover:text-purple-300 transition-colors">FAQ</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-purple-300 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-purple-300 transition-colors">Privacy Policy</Link></li>
              <li><a href="https://solana.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-300 transition-colors">Learn About Solana</a></li>
              </ul>
            </div>
          </div>
          
        <div className="mt-10 pt-8 border-t border-purple-900/20 text-center">
          <p className="text-gray-500">
            &copy; {year} solMusic. All rights reserved.
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Built on Solana
          </p>
        </div>
      </div>
    </footer>
  );
} 