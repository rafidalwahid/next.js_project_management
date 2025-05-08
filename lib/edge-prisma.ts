// lib/edge-prisma.ts
// Edge-compatible Prisma client for middleware and edge functions

import { PrismaClient } from '@prisma/client/edge';

// Create a new PrismaClient instance for edge environments
// This will use the edge runtime compatible version of Prisma
let prisma: PrismaClient;

try {
  prisma = new PrismaClient({
    // Configure minimal logging for edge environments
    log: ['error'],
  });
} catch (error) {
  console.error('Failed to initialize Edge PrismaClient:', error);
  
  // Provide a dummy client that logs errors instead of crashing
  prisma = new Proxy({} as PrismaClient, {
    get(target, prop) {
      if (prop === 'then') {
        // Special case for promise resolution
        return undefined;
      }
      
      // Return a function that logs the error
      return () => {
        console.error(`Edge PrismaClient method ${String(prop)} called but client failed to initialize`);
        return Promise.reject(new Error('Edge PrismaClient not available'));
      };
    },
  });
}

export default prisma;
