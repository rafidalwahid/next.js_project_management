/**
 * This script regenerates the Prisma client to match the schema
 * Run this script when you encounter errors related to missing fields or relations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to check if a file or directory exists
function exists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch (err) {
    return false;
  }
}

// Function to delete a directory recursively
function deleteFolderRecursive(folderPath) {
  if (exists(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
}

console.log('Starting Prisma client regeneration...');

try {
  // Step 1: Delete the generated Prisma client directory
  const generatedDir = path.join(__dirname, '..', 'lib', 'prisma-client');

  console.log(`Checking if generated directory exists: ${generatedDir}`);
  if (exists(generatedDir)) {
    console.log('Deleting existing generated Prisma client...');
    deleteFolderRecursive(generatedDir);
    console.log('Deleted successfully.');
  } else {
    console.log('Generated directory does not exist, will create it.');
  }

  // Step 2: Run prisma generate
  console.log('Running prisma generate...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('\nPrisma client regenerated successfully!');
  console.log('The subtask functionality should now work correctly.');
} catch (error) {
  console.error('Error regenerating Prisma client:', error.message);
  console.error('\nTroubleshooting tips:');
  console.error('1. Make sure no processes are using the Prisma client files');
  console.error('2. Try stopping your development server before running this script');
  console.error('3. If permission issues persist, try running this script with administrator privileges');
  process.exit(1);
}
