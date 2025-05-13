/**
 * Script to update route handlers to use Promise-based params in Next.js 15
 *
 * This script finds all route.ts files in the app directory and updates
 * the params type to use Promise<T> instead of T.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Function to recursively find all route.ts files
async function findRouteFiles(dir) {
  const routeFiles = [];

  async function scan(directory) {
    const files = await readdir(directory);

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await stat(filePath);

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

// Function to update a route file
async function updateRouteFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;

    // Pattern 1: { params }: { params: { key: string } }
    const pattern1 = /\{\s*params\s*\}:\s*\{\s*params:\s*\{([^}]*)\}\s*\}/g;
    content = content.replace(pattern1, (match, paramsContent) => {
      modified = true;
      return `{ params }: { params: Promise<{${paramsContent}}> }`;
    });

    // Pattern 2: const { key } = params;
    const pattern2 = /const\s*\{([^}]*)\}\s*=\s*params;/g;
    content = content.replace(pattern2, (match, destructuring) => {
      modified = true;
      return `const {${destructuring}} = await params;`;
    });

    if (modified) {
      await writeFile(filePath, content, 'utf8');
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

// Main function
async function main() {
  try {
    const routeFiles = await findRouteFiles(path.join(process.cwd(), 'app'));

    let updatedCount = 0;

    for (const file of routeFiles) {
      const updated = await updateRouteFile(file);
      if (updated) {
        updatedCount++;
      }
    }
  } catch (error) {
    process.exit(1);
  }
}

main();
