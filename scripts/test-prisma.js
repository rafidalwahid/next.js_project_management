const { PrismaClient } = require('../lib/prisma-client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testPrisma() {
  try {
    console.log('Testing Prisma client...');
    
    // Test a simple query
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
      }
    });
    
    console.log('Users found:', users.length);
    console.log('First user:', users[0]);
    
    // Test task query with subtasks
    const tasks = await prisma.task.findMany({
      where: { parentId: null },
      take: 5,
      include: {
        subtasks: {
          include: {
            subtasks: true
          }
        }
      }
    });
    
    console.log('Tasks found:', tasks.length);
    if (tasks.length > 0) {
      console.log('First task:', {
        id: tasks[0].id,
        title: tasks[0].title,
        subtasksCount: tasks[0].subtasks.length
      });
      
      if (tasks[0].subtasks.length > 0) {
        console.log('First subtask:', {
          id: tasks[0].subtasks[0].id,
          title: tasks[0].subtasks[0].title,
          nestedSubtasksCount: tasks[0].subtasks[0].subtasks.length
        });
      }
    }
    
    console.log('Prisma client test completed successfully!');
  } catch (error) {
    console.error('Error testing Prisma client:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();
