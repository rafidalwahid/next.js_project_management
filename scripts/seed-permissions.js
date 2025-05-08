// scripts/seed-permissions.js
// Script to run the permission seed

const { execSync } = require('child_process');
const path = require('path');

console.log('Starting permission system seeding...');

try {
  // Run the seed-db-permissions.js script
  execSync('node scripts/seed-db-permissions.js', { stdio: 'inherit' });
  console.log('Permission system seeding completed successfully!');
} catch (error) {
  console.error('Error seeding permissions:', error);
  process.exit(1);
}
