const { PrismaClient } = require('../lib/generated/prisma');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking users in the database...');
    
    const users = await prisma.user.findMany();
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    console.log('\nChecking sessions in the database...');
    const sessions = await prisma.session.findMany({
      include: {
        user: true
      }
    });
    
    console.log(`Found ${sessions.length} sessions:`);
    sessions.forEach(session => {
      console.log(`- Session ID: ${session.id}`);
      console.log(`  User ID: ${session.userId}`);
      console.log(`  User exists: ${session.user ? 'Yes' : 'No'}`);
      console.log(`  Expires: ${session.expires}`);
    });
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
