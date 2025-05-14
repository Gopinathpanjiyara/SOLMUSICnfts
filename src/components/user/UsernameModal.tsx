'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconUser, IconCircleCheck } from '@tabler/icons-react';
import { createUserProfile } from '@/lib/user-profile-manager';
import { toast } from 'react-hot-toast';

interface UsernameModalProps {
  walletAddress: string;
  isOpen: boolean;
  onComplete: (username: string) => void;
}

export default function UsernameModal({
  walletAddress,
  isOpen,
  onComplete
}: UsernameModalProps) {
  const [username, setUsername] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Generate a default username based on wallet address
  useEffect(() => {
    if (walletAddress) {
      // Generate a username like User_C1ER (using first 4 characters of wallet)
      const defaultUsername = `User_${walletAddress.slice(0, 4)}`;
      setUsername(defaultUsername);
    }
  }, [walletAddress]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }
    
    setError(null);
    setIsCreating(true);
    
    try {
      // Create profile in Pinata
      const success = await createUserProfile(walletAddress, username);
      
      if (success) {
        toast.success('Profile created successfully!');
        onComplete(username);
      } else {
        toast.error('Failed to create profile');
        setError('Could not create profile. Please try again.');
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card w-full max-w-md rounded-3xl shadow-xl border border-border p-8 animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <IconUser className="w-8 h-8 text-primary" />
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-2">Welcome to solMusic</h2>
        <p className="text-muted-foreground text-center mb-6">
          Please choose a username for your account
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="text-sm font-medium block mb-1.5">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full"
                autoFocus
                required
                disabled={isCreating}
              />
              {error && (
                <p className="text-destructive text-sm mt-1.5">{error}</p>
              )}
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isCreating}
            >
              {isCreating ? 'Creating Profile...' : 'Continue to solMusic'}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              <IconCircleCheck className="inline-block w-4 h-4 mr-1 text-success" />
              Your username will be stored on IPFS via Pinata
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 