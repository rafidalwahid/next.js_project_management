// scripts/check-users.js
const { PrismaClient } = require('../lib/prisma-client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking users in the database...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}), Role: ${user.role}, Created: ${user.createdAt.toISOString()}`);
    });
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
