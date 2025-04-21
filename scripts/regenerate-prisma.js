/**
 * Script to regenerate Prisma client
 * 
 * This script ensures the Prisma client is regenerated correctly.
 * Run with: node scripts/regenerate-prisma.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra');

// Main function to regenerate Prisma client
async function regeneratePrisma() {
  console.log('Regenerating Prisma client...');
  
  // Paths
  const prismaClientDir = path.join(__dirname, '..', 'lib', 'prisma-client');
  
  try {
    // Clean the existing client directory if it exists
    if (fs.existsSync(prismaClientDir)) {
      console.log('Removing existing Prisma client...');
      // Use fs-extra's remove instead of rm command for cross-platform compatibility
      await fsExtra.remove(prismaClientDir);
    }
    
    // Generate the Prisma client
    console.log('Generating new Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('Prisma client regenerated successfully!');
  } catch (error) {
    console.error('Error regenerating Prisma client:', error);
    process.exit(1);
  }
}

// Run the main function
regeneratePrisma()
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
