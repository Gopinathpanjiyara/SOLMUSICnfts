'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconCloud, IconCloudUpload } from '@tabler/icons-react';
import { syncUserTransactionsWithPinata } from '@/services/user-profile';
import { MusicNftData } from '@/components/music-nft/MusicNftCard';
import { TransactionData } from '@/lib/transaction-utils';
import { toast } from 'react-hot-toast';

interface PinataSyncButtonProps {
  walletAddress: string;
  username: string;
  ownedNFTs: MusicNftData[];
  transactions: TransactionData[];
}

export default function PinataSyncButton({
  walletAddress,
  username,
  ownedNFTs,
  transactions
}: PinataSyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (isSyncing) return;
    
    try {
      setIsSyncing(true);
      
      if (!walletAddress || !username) {
        toast.error('Wallet address or username is missing');
        return;
      }
      
      const success = await syncUserTransactionsWithPinata(
        walletAddress,
        username,
        ownedNFTs,
        transactions
      );
      
      if (success) {
        // Success toast is already shown inside the syncUserTransactionsWithPinata function
      }
    } catch (error) {
      console.error('Error syncing with Pinata:', error);
      toast.error('Error syncing with Pinata');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleSync} 
      disabled={isSyncing}
      className="flex items-center gap-1"
    >
      {isSyncing ? (
        <IconCloudUpload className="h-4 w-4 animate-pulse" />
      ) : (
        <IconCloud className="h-4 w-4" />
      )}
      {isSyncing ? 'Syncing...' : 'Sync to Pinata'}
    </Button>
  );
} 