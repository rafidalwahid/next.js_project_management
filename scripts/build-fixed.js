// scripts/build-fixed.js
// Improved build script for Node.js 22 compatibility
/* eslint-disable no-console */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Get the directory name using ES modules pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to run a command and return a promise
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const childProcess = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${command} ${args.join(' ')}`));
      }
    });

    childProcess.on('error', (error) => {
      reject(new Error(`Failed to start command: ${error.message}`));
    });
  });
}

// Main build function
async function build() {
  console.log('Starting build process...');
  console.log('Node.js version:', process.version);
  console.log('Current working directory:', process.cwd());

  try {
    // Step 1: Generate Prisma client
    console.log('\n=== Generating Prisma client ===');
    await runCommand('npx', ['prisma', 'generate']);
    console.log('Prisma client generated successfully');

    // Step 2: Run the fixed edge permissions update script
    console.log('\n=== Updating edge permissions ===');
    await runCommand('node', ['scripts/update-edge-permissions-fixed.js']);
    console.log('Edge permissions updated successfully');

    // Step 3: Build Next.js application
    console.log('\n=== Building Next.js application ===');
    await runCommand('next', ['build']);
    console.log('Next.js application built successfully');

    console.log('\n=== Build completed successfully ===');
    return true;
  } catch (error) {
    console.error('\n=== Build failed ===');
    console.error(error.message);
    return false;
  }
}

// Run the build function
build()
  .then(success => {
    if (success) {
      console.log('Build process completed successfully');
      process.exit(0);
    } else {
      console.error('Build process failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unhandled error during build:', error);
    process.exit(1);
  });
