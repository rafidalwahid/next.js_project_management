/**
 * Script to create default project statuses
 * Run with: node scripts/create-project-statuses.js
 */

const { PrismaClient } = require('../lib/prisma-client');

// Create a new Prisma client
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating default project statuses...');
    
    // Default statuses to create
    const statuses = [
      { name: 'Not Started', color: '#E4E4E7', description: 'Project has not been started yet', isDefault: true },
      { name: 'In Progress', color: '#3B82F6', description: 'Project is currently in progress' },
      { name: 'On Hold', color: '#F97316', description: 'Project is temporarily on hold' },
      { name: 'Completed', color: '#22C55E', description: 'Project has been completed' },
      { name: 'Cancelled', color: '#EF4444', description: 'Project has been cancelled' }
    ];
    
    // Create statuses
    for (const status of statuses) {
      // Check if status already exists
      const existingStatus = await prisma.projectStatus.findUnique({
        where: { name: status.name },
      });
      
      if (existingStatus) {
        console.log(`Status '${status.name}' already exists. Skipping...`);
        continue;
      }
      
      // Create status
      const createdStatus = await prisma.projectStatus.create({
        data: {
          name: status.name,
          color: status.color,
          description: status.description,
          isDefault: status.isDefault || false,
        },
      });
      
      console.log(`Created status: ${createdStatus.name}`);
    }
    
    console.log('Default project statuses created successfully!');
    
    // List all statuses
    const allStatuses = await prisma.projectStatus.findMany();
    console.log(`Total project statuses: ${allStatuses.length}`);
    console.table(allStatuses.map(status => ({
      ID: status.id,
      Name: status.name,
      Color: status.color,
      Default: status.isDefault ? 'Yes' : 'No',
    })));
    
  } catch (error) {
    console.error('Error creating project statuses:', error);
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