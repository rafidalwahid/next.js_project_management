const { PrismaClient } = require('../lib/generated/prisma');
require('dotenv').config();

const prisma = new PrismaClient();

async function clearSessions() {
  try {
    console.log('Clearing all sessions from the database...');
    
    const result = await prisma.session.deleteMany({});
    
    console.log(`Deleted ${result.count} sessions.`);
    
  } catch (error) {
    console.error('Error clearing sessions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearSessions();
