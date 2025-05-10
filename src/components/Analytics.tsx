'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Only run analytics in production
    if (process.env.NODE_ENV !== 'production') return;
    
    // Simple page view tracking
    console.log(`Analytics: Page view - ${pathname}`);
    
    // In a real app, you would send this to your analytics provider
    // Example: mixpanel.track('Page View', { path: pathname });
  }, [pathname]);
  
  // This component doesn't render anything
  return null;
} 