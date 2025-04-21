/**
 * Script to check database connection
 * Run with: node scripts/check-db.js
 */

const { PrismaClient } = require('../lib/prisma-client');

// Create a new Prisma client
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking database connection...');
    
    // Try to run a simple query
    const userCount = await prisma.user.count();
    console.log(`Connection successful! Found ${userCount} users.`);
    
    // Check other tables
    const projectCount = await prisma.project.count();
    console.log(`Found ${projectCount} projects.`);
    
    const taskCount = await prisma.task.count();
    console.log(`Found ${taskCount} tasks.`);
    
    console.log('Database schema is working correctly!');
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the main function
main()
  .catch(e => {
    console.error('Unhandled error:', e);
    process.exit(1);
  }); 