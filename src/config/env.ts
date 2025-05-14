// Environment variables with type safety
interface EnvVars {
  PINATA_API_KEY: string;
  PINATA_API_SECRET: string;
  PINATA_JWT: string;
  NEXT_PUBLIC_PINATA_API_KEY: string;
  NEXT_PUBLIC_PINATA_API_SECRET: string;
  NEXT_PUBLIC_PINATA_JWT: string;
  NEXT_PUBLIC_SOLANA_NETWORK: string;
  NEXT_PUBLIC_PINATA_GATEWAY_URL: string;
  validateEnv: () => void;
  isClient: boolean;
  [key: string]: any; // Index signature to allow string indexing
}

const env: EnvVars = {
  // Pinata API Credentials - Server-side only
  PINATA_API_KEY: process.env.PINATA_API_KEY || process.env.NEXT_PUBLIC_PINATA_API_KEY || '',
  PINATA_API_SECRET: process.env.PINATA_API_SECRET || process.env.NEXT_PUBLIC_PINATA_API_SECRET || '',
  PINATA_JWT: process.env.PINATA_JWT || process.env.NEXT_PUBLIC_PINATA_JWT || '',
  
  // Public environment variables (available in browser)
  NEXT_PUBLIC_PINATA_API_KEY: process.env.NEXT_PUBLIC_PINATA_API_KEY || '',
  NEXT_PUBLIC_PINATA_API_SECRET: process.env.NEXT_PUBLIC_PINATA_API_SECRET || '',
  NEXT_PUBLIC_PINATA_JWT: process.env.NEXT_PUBLIC_PINATA_JWT || '',
  NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
  NEXT_PUBLIC_PINATA_GATEWAY_URL: process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/',

  // Helper function to validate required env vars
  validateEnv: () => {
    const requiredVars = [
      'PINATA_API_KEY',
      'PINATA_API_SECRET', 
      'PINATA_JWT'
    ];

    for (const envVar of requiredVars) {
      if (!env[envVar]) {
        console.warn(`Missing required environment variable: ${envVar}`);
      }
    }
  },

  // Helper function to check if code is running on client side
  isClient: typeof window !== 'undefined'
};

// Only validate in development to avoid console warnings in production
if (process.env.NODE_ENV !== 'production') {
  env.validateEnv();
}

export default env; 