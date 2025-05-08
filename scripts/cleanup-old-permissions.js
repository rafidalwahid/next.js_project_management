// scripts/cleanup-old-permissions.js
// Script to remove old permission files

const fs = require('fs');
const path = require('path');

const filesToRemove = [
  'lib/permissions/permission-service.ts',
  'lib/permissions/db-permission-service.ts',
  'lib/permissions/edge-permission-service.ts',
  'lib/permissions/client-db-permission-service.ts',
  'lib/permissions/edge-db-permission-service.ts',
  'lib/permissions/permission-constants.ts'
];

console.log('Starting cleanup of old permission files...');

let removedCount = 0;
let errorCount = 0;

for (const file of filesToRemove) {
  const filePath = path.join(process.cwd(), file);
  
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Removed: ${file}`);
      removedCount++;
    } else {
      console.log(`File not found: ${file}`);
    }
  } catch (error) {
    console.error(`Error removing ${file}:`, error);
    errorCount++;
  }
}

console.log(`Cleanup completed. Removed ${removedCount} files with ${errorCount} errors.`);
