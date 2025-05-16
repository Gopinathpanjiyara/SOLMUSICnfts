'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { IconMusic, IconMenu2, IconX } from '@tabler/icons-react';

// Custom wallet button wrapper to fix z-index issues
function WalletButtonWrapper() {
  const portalRef = useRef<HTMLElement | null>(null);
  
  // Create portal element on mount
  useEffect(() => {
    // Find or create portal container
    let portalContainer = document.getElementById('wallet-adapter-portal');
    if (!portalContainer) {
      portalContainer = document.createElement('div');
      portalContainer.id = 'wallet-adapter-portal';
      portalContainer.style.position = 'fixed';
      portalContainer.style.zIndex = '99999';
      document.body.appendChild(portalContainer);
    }
    
    // Store ref for cleanup
    portalRef.current = portalContainer;
    
    return () => {
      // No cleanup needed for the container itself
    };
  }, []);
  
  return (
    <div className="wallet-wrapper relative z-[9999]">
      <WalletMultiButton className="btn btn-primary btn-sm md:btn-md" />
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      // Close mobile menu on scroll
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  // Check if we're on a details page to highlight Marketplace in the nav
  const isDetailsPage = pathname?.includes('/music-nft/details/');
  
  // Function to determine if a link is active
  const isActive = (path: string) => {
    if (!pathname) return false;
    
    // Special case for the marketplace when viewing NFT details
    if (path === '/music-nft/marketplace' && isDetailsPage) {
      return true;
    }
    
    // For homepage, only exact match
    if (path === '/') {
      return pathname === '/';
    }
    
    // For other pages, check if pathname starts with path
    return pathname.startsWith(path) && (!isDetailsPage || path === '/music-nft/details/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Marketplace', path: '/music-nft/marketplace/' },
    { name: 'Shorts', path: '/music-nft/shorts/' },
    { name: 'Create', path: '/music-nft/create/' },
  ];
  
  // Add profile link only when connected
  if (connected) {
    navLinks.push({ name: 'Profile', path: '/profile/' });
  }
  
  // Handle navigation with your own function to work with static exports
  const handleNavigation = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(path);
    setMobileMenuOpen(false);
  };
  
  return (
    <>
      <style jsx global>{`
        @keyframes gradientAnimation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .header-gradient {
          background: linear-gradient(45deg, rgba(128, 0, 255, 0.3), rgba(0, 0, 0, 0.9), rgba(128, 0, 255, 0.4), rgba(0, 0, 0, 0.95));
          background-size: 400% 400%;
          animation: gradientAnimation 15s ease infinite;
        }
        
        .header-glow {
          position: absolute;
          bottom: -50px;
          left: 40px;
          width: 60%;
          height: 80px;
          background: radial-gradient(circle, rgba(128, 0, 255, 0.2) 0%, rgba(128, 0, 255, 0.05) 40%, transparent 70%);
          filter: blur(40px);
          opacity: 0.5;
          border-radius: 50%;
          z-index: 0;
          pointer-events: none;
        }
        
        /* Force wallet adapter dropdown to the front */
        #wallet-adapter-portal {
          position: fixed;
          z-index: 99999;
          pointer-events: none;
        }
        
        #wallet-adapter-portal .wallet-adapter-dropdown-list {
          pointer-events: auto;
        }
        
        /* Force all main content to have a lower z-index than header and mobile nav */
        main {
          position: relative;
          z-index: 1;
        }
        
        /* Fix for any specific elements that might be appearing above the header */
        .container:not(.header-container) {
          position: relative;
          z-index: 1;
        }
        
        /* Mobile menu animation */
        .mobile-menu {
          animation: slideDown 0.2s ease-out;
        }
        
        @keyframes slideDown {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <header className={`sticky top-0 z-[1000] ${scrolled ? 'backdrop-blur-xl bg-black/80' : 'bg-transparent'} transition-all duration-300`} style={{ backgroundColor: scrolled ? '#0f1729e6' : 'transparent' }}>
        <div className="header-gradient">
          <div className="header-glow"></div>
          <div className="container mx-auto px-4 py-3 header-container">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link href="/" className="flex items-center gap-2">
                  <IconMusic stroke={3} className="text-white w-8 h-8" />
                  <span className="text-xl font-bold text-white tracking-tight">solMusic</span>
                </Link>
              </div>
              
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map(link => (
                <Link 
                  key={link.path}
                  href={link.path} 
                    onClick={handleNavigation(link.path)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive(link.path) 
                        ? 'text-purple-400 bg-purple-500/10' 
                        : 'text-gray-200 hover:text-purple-300 hover:bg-purple-900/20'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
            
              {/* Right section with wallet */}
            <div className="flex items-center gap-2">
              {/* Wallet Button */}
              <div className="hidden md:block">
                  <WalletButtonWrapper />
              </div>
              
              {/* Mobile Menu Button */}
              <button 
                  className="md:hidden btn btn-circle btn-sm bg-purple-900/30 border-0 text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <IconX className="w-5 h-5" />
                ) : (
                  <IconMenu2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          </div>
        </div>
      </header>
          
      {/* Mobile navigation menu */}
          {mobileMenuOpen && (
        <div className="md:hidden fixed top-[60px] left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-gray-800 z-[999] mobile-menu" style={{ backgroundColor: '#0f1729e6' }}>
          <div className="container mx-auto p-4">
            <nav className="flex flex-col space-y-2">
                {navLinks.map(link => (
                  <Link 
                    key={link.path}
                    href={link.path} 
                  onClick={handleNavigation(link.path)}
                  className={`px-4 py-3 rounded-lg font-medium ${
                    isActive(link.path) 
                      ? 'text-purple-400 bg-purple-500/10' 
                      : 'text-gray-200 hover:text-purple-300 hover:bg-purple-900/20'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              
              <div className="pt-4 border-t border-gray-800 mt-4">
                <WalletButtonWrapper />
                </div>
              </nav>
            </div>
        </div>
      )}
    </>
  );
} 