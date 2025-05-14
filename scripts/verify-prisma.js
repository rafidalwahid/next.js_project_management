// scripts/verify-prisma.js
// Script to verify Prisma client generation before build
/* eslint-disable no-console */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

// Get the directory name using ES modules pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const clientPath = path.join(rootDir, 'prisma', 'generated', 'client');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

// Verify the Prisma client is generated
if (!fs.existsSync(clientPath)) {
  console.error(`${colors.red}[ERROR]${colors.reset} Prisma client not found at ${clientPath}`);
  console.log(`${colors.yellow}[INFO]${colors.reset} Generating Prisma client...`);
  
  try {
    // For ESM compatibility, use dynamic import
    const { execSync } = await import('node:child_process');
    execSync('npx prisma generate', { stdio: 'inherit', cwd: rootDir });
    
    // Check again after generation
    if (!fs.existsSync(clientPath)) {
      console.error(`${colors.red}[ERROR]${colors.reset} Failed to generate Prisma client`);
      process.exit(1);
    }
    
    console.log(`${colors.green}[SUCCESS]${colors.reset} Prisma client generated successfully`);
  } catch (error) {
    console.error(`${colors.red}[ERROR]${colors.reset} Failed to generate Prisma client: ${error.message}`);
    process.exit(1);
  }
} else {
  console.log(`${colors.green}[SUCCESS]${colors.reset} Prisma client exists at ${clientPath}`);
}
