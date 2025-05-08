// scripts/test-permissions.js
// Script to test the permission system

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing permission system...');

  // Test 1: Check if roles exist
  console.log('\nTest 1: Checking if roles exist...');
  const roles = await prisma.role.findMany();
  console.log(`Found ${roles.length} roles:`);
  roles.forEach(role => {
    console.log(`- ${role.name}: ${role.description}`);
  });

  // Test 2: Check if permissions exist
  console.log('\nTest 2: Checking if permissions exist...');
  const permissions = await prisma.permission.findMany();
  console.log(`Found ${permissions.length} permissions`);
  
  // Group permissions by category
  const permissionsByCategory = {};
  permissions.forEach(permission => {
    const category = permission.category || 'Uncategorized';
    if (!permissionsByCategory[category]) {
      permissionsByCategory[category] = [];
    }
    permissionsByCategory[category].push(permission);
  });
  
  // Print permissions by category
  Object.entries(permissionsByCategory).forEach(([category, perms]) => {
    console.log(`\n${category} (${perms.length}):`);
    perms.forEach(p => {
      console.log(`- ${p.name}: ${p.description}`);
    });
  });

  // Test 3: Check role-permission relationships
  console.log('\nTest 3: Checking role-permission relationships...');
  for (const role of roles) {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      include: { permission: true }
    });
    
    console.log(`\nRole "${role.name}" has ${rolePermissions.length} permissions:`);
    rolePermissions.forEach(rp => {
      console.log(`- ${rp.permission.name}`);
    });
  }

  // Test 4: Check permission checks
  console.log('\nTest 4: Testing permission checks...');
  
  // Define test cases
  const testCases = [
    { role: 'admin', permission: 'user_management', expected: true },
    { role: 'admin', permission: 'nonexistent_permission', expected: false },
    { role: 'manager', permission: 'project_creation', expected: true },
    { role: 'manager', permission: 'manage_roles', expected: false },
    { role: 'user', permission: 'task_creation', expected: true },
    { role: 'user', permission: 'project_creation', expected: false },
    { role: 'guest', permission: 'view_projects', expected: true },
    { role: 'guest', permission: 'task_creation', expected: false },
  ];
  
  // Run test cases
  for (const testCase of testCases) {
    const { role, permission, expected } = testCase;
    
    // Find the role
    const roleRecord = await prisma.role.findUnique({
      where: { name: role }
    });
    
    if (!roleRecord) {
      console.log(`Role "${role}" not found, skipping test case`);
      continue;
    }
    
    // Find the permission
    const permissionRecord = await prisma.permission.findUnique({
      where: { name: permission }
    });
    
    // For nonexistent permissions, we expect false
    if (!permissionRecord) {
      const result = false;
      const passed = result === expected;
      console.log(`${passed ? '✅' : '❌'} ${role} has permission "${permission}": ${result} (expected: ${expected})`);
      continue;
    }
    
    // Check if the role has the permission
    const rolePermission = await prisma.rolePermission.findFirst({
      where: {
        roleId: roleRecord.id,
        permissionId: permissionRecord.id
      }
    });
    
    const result = !!rolePermission;
    const passed = result === expected;
    console.log(`${passed ? '✅' : '❌'} ${role} has permission "${permission}": ${result} (expected: ${expected})`);
  }

  console.log('\nPermission system testing completed!');
}

// Run the main function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Close Prisma client
    await prisma.$disconnect();
  });
