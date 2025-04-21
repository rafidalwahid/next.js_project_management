// This script initializes the order field for all existing tasks
// Run with: node scripts/initialize-task-order.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initializeTaskOrder() {
  console.log('Initializing task order for all existing tasks...');

  try {
    // Get all projects
    const projects = await prisma.project.findMany({
      select: { id: true }
    });

    console.log(`Found ${projects.length} projects`);

    // Process each project
    for (const project of projects) {
      console.log(`Processing project ${project.id}...`);

      // Get all top-level tasks for this project
      const topLevelTasks = await prisma.task.findMany({
        where: {
          projectId: project.id,
          parentId: null
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      console.log(`Found ${topLevelTasks.length} top-level tasks for project ${project.id}`);

      // Update order for top-level tasks
      for (let i = 0; i < topLevelTasks.length; i++) {
        const task = topLevelTasks[i];
        const orderValue = (i + 1) * 1000; // Use increments of 1000 to allow for future insertions

        console.log(`Setting order ${orderValue} for task ${task.id}`);

        await prisma.task.update({
          where: { id: task.id },
          data: { order: orderValue }
        });

        // Process subtasks recursively
        await processSubtasks(task.id, orderValue);
      }
    }

    console.log('Task order initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing task order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function processSubtasks(parentId, parentOrder) {
  // Get all subtasks for this parent
  const subtasks = await prisma.task.findMany({
    where: {
      parentId: parentId
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  console.log(`Found ${subtasks.length} subtasks for parent ${parentId}`);

  // Update order for subtasks
  for (let i = 0; i < subtasks.length; i++) {
    const subtask = subtasks[i];
    const orderValue = parentOrder + (i + 1) * 100; // Use smaller increments for subtasks

    console.log(`Setting order ${orderValue} for subtask ${subtask.id}`);

    await prisma.task.update({
      where: { id: subtask.id },
      data: { order: orderValue }
    });

    // Process nested subtasks recursively
    await processSubtasks(subtask.id, orderValue);
  }
}

// Run the initialization
initializeTaskOrder()
  .then(() => console.log('Script completed'))
  .catch(error => console.error('Script failed:', error));
