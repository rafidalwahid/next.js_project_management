// scripts/assign-admin-permissions.js
const { PrismaClient } = require('../lib/prisma-client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting admin permissions assignment...');
    
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
    
    // 2. Get all permissions
    const allPermissions = await prisma.permission.findMany();
    
    if (allPermissions.length === 0) {
      console.error('No permissions found in the database');
      return;
    }
    
    console.log(`Found ${allPermissions.length} permissions in the database`);
    
    // 3. Grant all permissions to the admin user
    let grantedCount = 0;
    let skippedCount = 0;
    
    for (const permission of allPermissions) {
      // Check if the permission is already granted
      const existingPermission = await prisma.userPermission.findFirst({
        where: {
          userId: user.id,
          permissionId: permission.id
        }
      });
      
      if (existingPermission) {
        skippedCount++;
        continue; // Skip if already exists
      }
      
      // Grant the permission
      await prisma.userPermission.create({
        data: {
          userId: user.id,
          permissionId: permission.id,
          granted: true
        }
      });
      
      grantedCount++;
    }
    
    console.log(`Successfully granted ${grantedCount} permissions to user ${user.name}`);
    console.log(`Skipped ${skippedCount} permissions that were already granted`);
    
    console.log('Admin permissions assignment completed successfully');
  } catch (error) {
    console.error('Error assigning admin permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();