/**
 * Utility to clear all cached data in the application.
 * This can help resolve issues with stale or duplicate data.
 */

/**
 * Clears all application data from localStorage and sessionStorage.
 */
export function clearAllStoredData(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear localStorage items
    localStorage.removeItem('_nft_transactions');
    localStorage.removeItem('_nft_cache_data');
    
    // Clear sessionStorage items
    sessionStorage.removeItem('walletConnected');
    sessionStorage.removeItem('lastWalletAddress');
    sessionStorage.removeItem('_pending_nft_updates');
    sessionStorage.removeItem('_refresh_transactions');
    
    console.log('All stored data has been cleared successfully');
  } catch (error) {
    console.error('Error clearing stored data:', error);
  }
}

/**
 * Clears only transaction data while preserving other app state.
 */
export function clearTransactionData(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('_nft_transactions');
    sessionStorage.removeItem('_refresh_transactions');
    console.log('Transaction data has been cleared successfully');
  } catch (error) {
    console.error('Error clearing transaction data:', error);
  }
} 