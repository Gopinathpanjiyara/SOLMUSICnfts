'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { clearAllStoredData, clearTransactionData } from '@/lib/clear-cache';
import { IconRefresh, IconTrash } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function ClearCacheButton() {
  const [isClearing, setIsClearing] = useState(false);
  const router = useRouter();

  const handleClearData = async () => {
    try {
      setIsClearing(true);
      clearAllStoredData();
      
      // Give a brief moment for localStorage to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refresh the page to show the cleared state
      router.refresh();
      
      // Reload the page completely to ensure everything is reset
      window.location.reload();
    } catch (error) {
      console.error('Error clearing data:', error);
    } finally {
      setIsClearing(false);
    }
  };
  
  const handleClearTransactions = async () => {
    try {
      setIsClearing(true);
      clearTransactionData();
      
      // Give a brief moment for localStorage to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refresh the page to show the cleared state
      router.refresh();
      
      // Reload the page completely to ensure everything is reset
      window.location.reload();
    } catch (error) {
      console.error('Error clearing transactions:', error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex gap-2 mt-2">
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={handleClearTransactions} 
        disabled={isClearing}
        className="flex items-center gap-1"
      >
        <IconTrash className="h-4 w-4" />
        Clear Transaction History
      </Button>
      
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={handleClearData} 
        disabled={isClearing}
        className="flex items-center gap-1"
      >
        <IconRefresh className="h-4 w-4" />
        Reset All Data
      </Button>
    </div>
  );
} 