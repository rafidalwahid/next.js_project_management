// scripts/test-team-api.js
const { PrismaClient } = require('../lib/prisma-client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing team API functionality...');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 5
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.name || 'Unnamed'} (${user.email}), ID: ${user.id}`);
    });
    
    if (users.length > 0) {
      const testUserId = users[0].id;
      console.log(`\nTesting team memberships for user: ${users[0].name || 'Unnamed'} (${users[0].email})`);
      
      // Get team memberships for the first user
      const teamMemberships = await prisma.teamMember.findMany({
        where: { userId: testUserId },
        include: {
          project: {
            select: {
              id: true,
              title: true,
            }
          }
        }
      });
      
      console.log(`Found ${teamMemberships.length} team memberships:`);
      teamMemberships.forEach(membership => {
        console.log(`- Project: ${membership.project.title}, ID: ${membership.project.id}`);
      });
      
      // If no team memberships, create a test project and add the user
      if (teamMemberships.length === 0) {
        console.log('\nNo team memberships found. Creating a test project and adding the user...');
        
        // Create a test project
        const project = await prisma.project.create({
          data: {
            title: 'Test Project for API',
            description: 'This is a test project created by the API test script',
            createdById: testUserId,
          }
        });
        
        console.log(`Created test project: ${project.title}, ID: ${project.id}`);
        
        // Add the user as a team member
        const teamMember = await prisma.teamMember.create({
          data: {
            userId: testUserId,
            projectId: project.id,
          }
        });
        
        console.log(`Added user as team member, ID: ${teamMember.id}`);
      }
    }
    
  } catch (error) {
    console.error('Error testing team API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
