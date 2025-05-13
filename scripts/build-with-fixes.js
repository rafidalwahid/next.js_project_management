#!/usr/bin/env node
// scripts/build-with-fixes.js
// Comprehensive build script with Prisma fixes for Node.js 22 compatibility
/* eslint-disable no-console */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Get the directory name using ES modules pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper function to log with colors
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to log errors
function logError(message, error = null) {
  console.error(`${colors.red}${colors.bright}ERROR: ${message}${colors.reset}`);
  if (error) {
    console.error(`${colors.dim}${error.stack || error}${colors.reset}`);
  }
}

// Helper function to log section headers
function logSection(title) {
  console.log('\n');
  console.log(`${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}`);
  console.log('-'.repeat(title.length + 8));
}

// Function to run a command and return a promise
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    log(`Running: ${colors.bright}${command} ${args.join(' ')}${colors.reset}`, colors.yellow);
    
    const env = {
      ...process.env,
      ...options.env
    };
    
    const childProcess = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env,
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

// Function to check if a file exists
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Function to fix Prisma imports in API routes
async function fixPrismaImports() {
  logSection('Fixing Prisma Imports in API Routes');
  
  try {
    // Find all route.ts files in the app directory
    const appDir = path.join(rootDir, 'app');
    log(`Scanning directory: ${appDir}`, colors.dim);
    
    // Function to recursively find all route.ts files
    async function findRouteFiles(dir) {
      const routeFiles = [];
      
      async function scan(directory) {
        const files = await fs.readdir(directory);
        
        for (const file of files) {
          const filePath = path.join(directory, file);
          const stats = await fs.stat(filePath);
          
          if (stats.isDirectory()) {
            await scan(filePath);
          } else if (file === 'route.ts' || file === 'route.js') {
            routeFiles.push(filePath);
          }
        }
      }
      
      await scan(dir);
      return routeFiles;
    }
    
    const routeFiles = await findRouteFiles(appDir);
    log(`Found ${routeFiles.length} route files`, colors.green);
    
    let updatedCount = 0;
    
    // Function to update a route file
    async function updateRouteFile(filePath) {
      try {
        let content = await fs.readFile(filePath, 'utf8');
        let modified = false;
        
        // Check for direct Prisma imports
        const directPrismaImport = /import\s+{\s*PrismaClient\s*}\s+from\s+['"]@prisma\/client['"]/g;
        if (directPrismaImport.test(content)) {
          log(`Found direct PrismaClient import in ${filePath}`, colors.yellow);
          content = content.replace(
            directPrismaImport,
            `// Using singleton Prisma client\nimport prisma from '@/lib/prisma'`
          );
          modified = true;
        }
        
        // Check for direct Prisma client instantiation
        const prismaInstantiation = /const\s+prisma\s*=\s*new\s+PrismaClient/g;
        if (prismaInstantiation.test(content)) {
          log(`Found PrismaClient instantiation in ${filePath}`, colors.yellow);
          content = content.replace(
            prismaInstantiation,
            `// Using singleton Prisma client from @/lib/prisma`
          );
          modified = true;
        }
        
        // Check if the file already imports prisma from lib/prisma
        const hasPrismaImport = /import\s+prisma\s+from\s+['"]@\/lib\/prisma['"]/g.test(content);
        
        // If the file doesn't have a prisma import but uses prisma, add the import
        if (!hasPrismaImport && content.includes('prisma.')) {
          log(`Adding prisma import to ${filePath}`, colors.yellow);
          
          // Check if there are any imports
          if (content.includes('import ')) {
            // Add after the last import
            const importLines = content.split('\n').filter(line => line.trim().startsWith('import '));
            const lastImportLine = importLines[importLines.length - 1];
            content = content.replace(
              lastImportLine,
              `${lastImportLine}\nimport prisma from '@/lib/prisma';`
            );
          } else {
            // Add at the beginning of the file
            content = `import prisma from '@/lib/prisma';\n${content}`;
          }
          
          modified = true;
        }
        
        if (modified) {
          await fs.writeFile(filePath, content, 'utf8');
          return true;
        }
        
        return false;
      } catch (error) {
        logError(`Error updating ${filePath}:`, error);
        return false;
      }
    }
    
    // Update all route files
    for (const file of routeFiles) {
      const updated = await updateRouteFile(file);
      if (updated) {
        updatedCount++;
        log(`Updated ${file}`, colors.green);
      }
    }
    
    log(`Updated ${updatedCount} files`, colors.green);
    
    // Specifically check and fix the activities route
    const activitiesRoutePath = path.join(rootDir, 'app', 'api', 'activities', 'route.ts');
    
    if (existsSync(activitiesRoutePath)) {
      log(`Checking activities route at ${activitiesRoutePath}`, colors.cyan);
      let content = await fs.readFile(activitiesRoutePath, 'utf8');
      
      // Ensure it has the correct prisma import
      if (!content.includes("import prisma from '@/lib/prisma';")) {
        log('Adding prisma import to activities route', colors.yellow);
        
        // Check if there are any imports
        if (content.includes('import ')) {
          // Add after the last import
          const importLines = content.split('\n').filter(line => line.trim().startsWith('import '));
          const lastImportLine = importLines[importLines.length - 1];
          content = content.replace(
            lastImportLine,
            `${lastImportLine}\nimport prisma from '@/lib/prisma';`
          );
        } else {
          // Add at the beginning of the file
          content = `import prisma from '@/lib/prisma';\n${content}`;
        }
      }
      
      // Remove any direct PrismaClient imports
      if (content.includes("import { PrismaClient }")) {
        log('Removing direct PrismaClient import from activities route', colors.yellow);
        content = content.replace(
          /import\s+{\s*PrismaClient\s*}\s+from\s+['"]@prisma\/client['"]/g,
          '// Using singleton Prisma client from @/lib/prisma'
        );
      }
      
      // Write the fixed content back
      await fs.writeFile(activitiesRoutePath, content, 'utf8');
      log('Fixed activities route', colors.green);
    } else {
      log('Activities route not found', colors.yellow);
    }
    
    return true;
  } catch (error) {
    logError('Error fixing Prisma imports:', error);
    return false;
  }
}

// Main build function
async function build() {
  log(`Starting build process with fixes...`, colors.bright);
  log(`Node.js version: ${process.version}`, colors.dim);
  log(`Current working directory: ${process.cwd()}`, colors.dim);

  try {
    // Step 1: Clean up any previous build artifacts
    logSection('Cleaning Previous Build Artifacts');
    const nextDir = path.join(rootDir, '.next');
    if (await fileExists(nextDir)) {
      log('Removing .next directory', colors.yellow);
      await fs.rm(nextDir, { recursive: true, force: true });
    }
    log('Previous build artifacts cleaned up', colors.green);

    // Step 2: Generate Prisma client
    logSection('Generating Prisma Client');
    await runCommand('npx', ['prisma', 'generate']);
    log('Prisma client generated successfully', colors.green);

    // Step 3: Fix Prisma imports in API routes
    await fixPrismaImports();

    // Step 4: Update edge permissions
    logSection('Updating Edge Permissions');
    
    // Check if the update-edge-permissions-fixed.js file exists
    const edgePermissionsScript = path.join(rootDir, 'scripts', 'update-edge-permissions-fixed.js');
    if (await fileExists(edgePermissionsScript)) {
      await runCommand('node', ['scripts/update-edge-permissions-fixed.js']);
      log('Edge permissions updated successfully', colors.green);
    } else {
      log('Edge permissions script not found, skipping this step', colors.yellow);
    }

    // Step 5: Build Next.js application with NODE_OPTIONS to suppress warnings
    logSection('Building Next.js Application');
    await runCommand('next', ['build'], {
      env: {
        NODE_OPTIONS: '--no-warnings'
      }
    });
    log('Next.js application built successfully', colors.green);

    logSection('Build Completed Successfully');
    return true;
  } catch (error) {
    logSection('Build Failed');
    logError(error.message, error);
    return false;
  }
}

// Run the build function
build()
  .then(success => {
    if (success) {
      log('Build process completed successfully', colors.green);
      process.exit(0);
    } else {
      logError('Build process failed');
      process.exit(1);
    }
  })
  .catch(error => {
    logError('Unhandled error during build:', error);
    process.exit(1);
  });
