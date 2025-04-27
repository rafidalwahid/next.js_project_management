// This script runs prisma generate to ensure the Prisma client is up-to-date
const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Generating Prisma client...');

try {
  // Run prisma generate
  execSync('npx prisma generate', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  console.log('✅ Prisma client generated successfully!');
} catch (error) {
  console.error('❌ Error generating Prisma client:', error.message);
  process.exit(1);
}
