// scripts/run-seed.js
const { execSync } = require('child_process');
const path = require('path');

// Get the path to the seed.js file
const seedPath = path.join(__dirname, 'seed.js');

console.log('Running database seed script...');
try {
  // Execute the seed.js file
  execSync(`node ${seedPath}`, { stdio: 'inherit' });
  console.log('Seed script completed successfully!');
} catch (error) {
  console.error('Error running seed script:', error);
  process.exit(1);
}
