'use client';

import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Set dark theme on mount and ensure it persists
  useEffect(() => {
    // Apply dark theme immediately
    applyDarkTheme();
    
    // Also set it on a short delay to ensure it applies after any browser-specific behaviors
    const timeoutId = setTimeout(applyDarkTheme, 100);
    
    // And set an interval to keep checking/enforcing dark theme
    const intervalId = setInterval(applyDarkTheme, 1000);
    
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);
  
  // Function to apply dark theme to various elements
  const applyDarkTheme = () => {
    // Set dark theme on the document element
    document.documentElement.setAttribute('data-theme', 'dark');
    
    // Add dark class for compatibility with Tailwind
    document.documentElement.classList.add('dark');
    
    // Apply dark background directly to HTML and body
    document.documentElement.style.backgroundColor = '#0f1729'; // Dark blue background
    document.body.style.backgroundColor = '#0f1729'; // Dark blue background
    
    // Find and force dark background on marketplace container if it exists
    const marketplaceContainers = document.querySelectorAll('[data-page="marketplace"]');
    marketplaceContainers.forEach(container => {
      if (container instanceof HTMLElement) {
        container.style.backgroundColor = '#0f1729';
      }
    });
  };

  return <>{children}</>;
} 