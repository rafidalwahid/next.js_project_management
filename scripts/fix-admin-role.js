// scripts/fix-admin-role.js
const { PrismaClient } = require('../lib/prisma-client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting admin role fix script...');
    
    // 1. First find the user by email
    const email = 'admin@example.com'; // Change this if your admin email is different
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      return;
    }
    
    console.log(`Found user: ${user.name} (${user.email})`);
    
    // 2. Find the admin role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' }
    });
    
    if (!adminRole) {
      console.error('Admin role not found in the database');
      return;
    }
    
    console.log(`Found admin role with ID: ${adminRole.id}`);
    
    // 3. Update the user's role field directly
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'admin' }
    });
    
    console.log(`Updated user.role field to 'admin'`);
    
    // 4. Check if a UserRole entry already exists
    const existingUserRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        roleId: adminRole.id
      }
    });
    
    if (existingUserRole) {
      console.log('UserRole entry already exists');
    } else {
      // 5. Create a UserRole entry connecting the user to the admin role
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id
        }
      });
      
      console.log('Created new UserRole entry connecting user to admin role');
    }
    
    console.log('Admin role fix completed successfully');
  } catch (error) {
    console.error('Error fixing admin role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();