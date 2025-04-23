const { PrismaClient } = require('../lib/prisma-client');
const prisma = new PrismaClient();

// Default roles
const DEFAULT_ROLES = [
  {
    name: 'admin',
    description: 'Administrator with full access to all resources and settings',
    isSystem: true,
  },
  {
    name: 'manager',
    description: 'Manager with access to manage users and content but not system settings',
    isSystem: true,
  },
  {
    name: 'user',
    description: 'Regular user with limited access',
    isSystem: true,
  },
  {
    name: 'guest',
    description: 'Guest user with minimal access for temporary users',
    isSystem: true,
  },
];

// Default permissions
const DEFAULT_PERMISSIONS = [
  {
    name: 'user_management',
    description: 'Manage users, roles and permissions',
    category: 'users',
    isSystem: true,
  },
  {
    name: 'project_creation',
    description: 'Create new projects',
    category: 'projects',
    isSystem: true,
  },
  {
    name: 'project_management',
    description: 'Manage existing projects',
    category: 'projects',
    isSystem: true,
  },
  {
    name: 'task_assignment',
    description: 'Assign tasks to users',
    category: 'tasks',
    isSystem: true,
  },
  {
    name: 'task_management',
    description: 'Create and manage tasks',
    category: 'tasks',
    isSystem: true,
  },
  {
    name: 'view_projects',
    description: 'View project details',
    category: 'projects',
    isSystem: true,
  },
  {
    name: 'edit_profile',
    description: 'Edit own profile information',
    category: 'users',
    isSystem: true,
  },
  {
    name: 'system_settings',
    description: 'Configure system settings',
    category: 'system',
    isSystem: true,
  },
  {
    name: 'attendance_management',
    description: 'Manage attendance records',
    category: 'attendance',
    isSystem: true,
  },
  {
    name: 'view_team_attendance',
    description: 'View attendance records of team members',
    category: 'attendance',
    isSystem: true,
  },
  {
    name: 'manage_roles',
    description: 'Manage roles and permissions',
    category: 'system',
    isSystem: true,
  },
  {
    name: 'view_dashboard',
    description: 'View dashboard',
    category: 'system',
    isSystem: true,
  },
];

// Role-permission mappings
const ROLE_PERMISSIONS = {
  admin: [
    'user_management', 'project_creation', 'project_management', 'task_assignment',
    'task_management', 'view_projects', 'edit_profile', 'system_settings',
    'attendance_management', 'view_team_attendance', 'manage_roles', 'view_dashboard'
  ],
  manager: [
    'user_management', 'project_creation', 'project_management', 'task_assignment',
    'task_management', 'view_projects', 'edit_profile', 'view_team_attendance', 'view_dashboard'
  ],
  user: [
    'task_management', 'view_projects', 'edit_profile', 'view_dashboard'
  ],
  guest: [
    'view_projects'
  ],
};

async function main() {
  console.log('Starting permission migration...');

  try {
    // Create roles
    console.log('Creating roles...');
    for (const role of DEFAULT_ROLES) {
      const existingRole = await prisma.role.findUnique({
        where: { name: role.name },
      });

      if (!existingRole) {
        await prisma.role.create({
          data: role,
        });
        console.log(`Created role: ${role.name}`);
      } else {
        console.log(`Role already exists: ${role.name}`);
      }
    }

    // Create permissions
    console.log('Creating permissions...');
    for (const permission of DEFAULT_PERMISSIONS) {
      const existingPermission = await prisma.permission.findUnique({
        where: { name: permission.name },
      });

      if (!existingPermission) {
        await prisma.permission.create({
          data: permission,
        });
        console.log(`Created permission: ${permission.name}`);
      } else {
        console.log(`Permission already exists: ${permission.name}`);
      }
    }

    // Assign permissions to roles
    console.log('Assigning permissions to roles...');
    for (const [roleName, permissionNames] of Object.entries(ROLE_PERMISSIONS)) {
      const role = await prisma.role.findUnique({
        where: { name: roleName },
      });

      if (!role) {
        console.log(`Role not found: ${roleName}`);
        continue;
      }

      for (const permissionName of permissionNames) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName },
        });

        if (!permission) {
          console.log(`Permission not found: ${permissionName}`);
          continue;
        }

        const existingRolePermission = await prisma.rolePermission.findFirst({
          where: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });

        if (!existingRolePermission) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });
          console.log(`Assigned permission ${permissionName} to role ${roleName}`);
        } else {
          console.log(`Permission ${permissionName} already assigned to role ${roleName}`);
        }
      }
    }

    // Migrate existing users to the new role system
    console.log('Migrating existing users to the new role system...');
    const users = await prisma.user.findMany();

    for (const user of users) {
      // Find the role that matches the user's current role
      const role = await prisma.role.findUnique({
        where: { name: user.role || 'user' },
      });

      if (!role) {
        console.log(`Role not found for user ${user.email}: ${user.role}`);
        continue;
      }

      // Check if the user already has this role
      const existingUserRole = await prisma.userRole.findFirst({
        where: {
          userId: user.id,
          roleId: role.id,
        },
      });

      if (!existingUserRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
          },
        });
        console.log(`Assigned role ${role.name} to user ${user.email}`);
      } else {
        console.log(`User ${user.email} already has role ${role.name}`);
      }
    }

    console.log('Permission migration completed successfully!');
  } catch (error) {
    console.error('Error during permission migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
