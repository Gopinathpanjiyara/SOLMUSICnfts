'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect, ReactNode } from 'react';
import { userHasProfile, loadUserProfile } from '@/lib/user-profile-manager';
import UsernameModal from './UsernameModal';
import { toast } from 'react-hot-toast';

interface WalletProfileAdapterProps {
  children: ReactNode;
}

export default function WalletProfileAdapter({ children }: WalletProfileAdapterProps) {
  const { publicKey, connected } = useWallet();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  
  // Check if the user has a profile when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      const walletAddress = publicKey.toBase58();
      checkUserProfile(walletAddress);
    } else {
      // Reset state when wallet disconnects
      setHasProfile(null);
      setIsCheckingProfile(false);
    }
  }, [connected, publicKey]);
  
  // Check if the user has a profile in Pinata
  const checkUserProfile = async (walletAddress: string) => {
    if (isCheckingProfile) return;
    
    try {
      setIsCheckingProfile(true);
      
      // Check if user has a profile
      const profileExists = await userHasProfile(walletAddress);
      setHasProfile(profileExists);
      
      console.log(`User profile check: ${profileExists ? 'Found' : 'Not found'}`);
      
      if (profileExists) {
        // If profile exists, load user data
        const { username } = await loadUserProfile(walletAddress);
        if (username) {
          console.log(`Loaded username: ${username}`);
          toast.success(`Welcome back, ${username}!`, { id: 'welcome-back' });
        }
      } else {
        // If no profile, show username modal
        setShowUsernameModal(true);
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
    } finally {
      setIsCheckingProfile(false);
    }
  };
  
  // Handle username creation completion
  const handleUsernameCreated = (username: string) => {
    setShowUsernameModal(false);
    setHasProfile(true);
  };
  
  return (
    <>
      {children}
      
      {/* Username modal */}
      {connected && publicKey && showUsernameModal && (
        <UsernameModal
          walletAddress={publicKey.toBase58()}
          isOpen={showUsernameModal}
          onComplete={handleUsernameCreated}
        />
      )}
    </>
  );
} 