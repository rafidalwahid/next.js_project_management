/**
 * Script to list all users in the database
 * Run with: node scripts/list-users.js
 */

const { PrismaClient } = require('../lib/prisma-client');

// Create a new Prisma client
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Listing all users in the database...');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    if (users.length === 0) {
      console.log('No users found in the database.');
      return;
    }
    
    console.log(`Found ${users.length} users:`);
    
    // Display users in a formatted table
    console.table(users.map(user => ({
      ID: user.id,
      Name: user.name,
      Email: user.email,
      Role: user.role,
      Created: user.createdAt.toLocaleString(),
    })));
    
  } catch (error) {
    console.error('Error listing users:', error);
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