// scripts/seed-db-permissions.js
// Script to seed the database with permissions and roles

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Define permissions directly in this script to avoid importing TypeScript files
const PERMISSIONS = {
  // User management
  USER_MANAGEMENT: "user_management",
  MANAGE_ROLES: "manage_roles",
  MANAGE_PERMISSIONS: "manage_permissions",

  // Project management
  PROJECT_CREATION: "project_creation",
  PROJECT_MANAGEMENT: "project_management",
  PROJECT_DELETION: "project_deletion",

  // Team management
  TEAM_MANAGEMENT: "team_management",
  TEAM_ADD: "team_add",
  TEAM_REMOVE: "team_remove",
  TEAM_VIEW: "team_view",

  // Task management
  TASK_CREATION: "task_creation",
  TASK_ASSIGNMENT: "task_assignment",
  TASK_MANAGEMENT: "task_management",
  TASK_DELETION: "task_deletion",

  // General permissions
  VIEW_PROJECTS: "view_projects",
  EDIT_PROFILE: "edit_profile",
  SYSTEM_SETTINGS: "system_settings",
  VIEW_DASHBOARD: "view_dashboard",

  // Attendance
  ATTENDANCE_MANAGEMENT: "attendance_management",
  VIEW_TEAM_ATTENDANCE: "view_team_attendance",
};

// Define roles
const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  USER: "user",
  GUEST: "guest",
};

// Define system roles with additional metadata
const SYSTEM_ROLES = {
  admin: {
    name: "Administrator",
    description: "Full access to all system features",
    color: "bg-purple-500" // Purple
  },
  manager: {
    name: "Manager",
    description: "Can manage projects, tasks, and team members",
    color: "bg-blue-500" // Blue
  },
  user: {
    name: "User",
    description: "Regular user with limited permissions",
    color: "bg-green-500" // Green
  },
  guest: {
    name: "Guest",
    description: "View-only access to projects",
    color: "bg-gray-500" // Gray
  }
};

// Permission matrix - which roles have which permissions
const PERMISSION_MATRIX = {
  [ROLES.ADMIN]: [
    PERMISSIONS.USER_MANAGEMENT,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.MANAGE_PERMISSIONS,
    PERMISSIONS.PROJECT_CREATION,
    PERMISSIONS.PROJECT_MANAGEMENT,
    PERMISSIONS.PROJECT_DELETION,
    PERMISSIONS.TEAM_MANAGEMENT,
    PERMISSIONS.TEAM_ADD,
    PERMISSIONS.TEAM_REMOVE,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.TASK_CREATION,
    PERMISSIONS.TASK_ASSIGNMENT,
    PERMISSIONS.TASK_MANAGEMENT,
    PERMISSIONS.TASK_DELETION,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.ATTENDANCE_MANAGEMENT,
    PERMISSIONS.VIEW_TEAM_ATTENDANCE,
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.PROJECT_CREATION,
    PERMISSIONS.PROJECT_MANAGEMENT,
    PERMISSIONS.TEAM_MANAGEMENT,
    PERMISSIONS.TEAM_ADD,
    PERMISSIONS.TEAM_REMOVE,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.TASK_CREATION,
    PERMISSIONS.TASK_ASSIGNMENT,
    PERMISSIONS.TASK_MANAGEMENT,
    PERMISSIONS.TASK_DELETION,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_TEAM_ATTENDANCE,
  ],
  [ROLES.USER]: [
    PERMISSIONS.TASK_CREATION,
    PERMISSIONS.TASK_MANAGEMENT,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.TEAM_VIEW,
  ],
  [ROLES.GUEST]: [
    PERMISSIONS.VIEW_PROJECTS,
  ],
};

// Helper function to get all permissions with metadata
function getAllPermissionsWithMetadata() {
  return Object.entries(PERMISSIONS).map(([key, value]) => {
    // Convert permission key to a more readable format
    const name = key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Determine category based on the permission key
    let category = 'General';
    if (key.includes('USER') || key.includes('ROLE')) {
      category = 'User Management';
    } else if (key.includes('PROJECT')) {
      category = 'Project Management';
    } else if (key.includes('TASK')) {
      category = 'Task Management';
    } else if (key.includes('TEAM')) {
      category = 'Team Management';
    } else if (key.includes('ATTENDANCE')) {
      category = 'Attendance';
    } else if (key.includes('SYSTEM')) {
      category = 'System';
    }

    return {
      id: value,
      name,
      description: `Permission to ${value.replace(/_/g, ' ')}`,
      category
    };
  });
}

async function main() {
  console.log('Starting permission system seeding...');

  // Clear existing permission data
  await clearExistingPermissionData();

  // Seed roles
  const roles = await seedRoles();
  
  // Seed permissions
  const permissions = await seedPermissions();
  
  // Seed role-permission relationships
  await seedRolePermissions(roles, permissions);

  console.log('Permission system seeding completed successfully!');
}

// Clear existing permission data
async function clearExistingPermissionData() {
  console.log('Clearing existing permission data...');

  // Delete role-permission relationships first
  await prisma.rolePermission.deleteMany({});
  
  // Then delete permissions and roles
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});

  console.log('Existing permission data cleared.');
}

// Seed roles
async function seedRoles() {
  console.log('Seeding roles...');

  const roleMap = {};

  // Create roles from the SYSTEM_ROLES object
  for (const [roleId, roleData] of Object.entries(SYSTEM_ROLES)) {
    const role = await prisma.role.create({
      data: {
        name: roleId,
        description: roleData.description,
        color: roleData.color
      }
    });

    roleMap[roleId] = role;
    console.log(`Created role: ${roleData.name}`);
  }

  return roleMap;
}

// Seed permissions
async function seedPermissions() {
  console.log('Seeding permissions...');

  const permissionMap = {};

  // Get all permissions with metadata
  const allPermissions = getAllPermissionsWithMetadata();

  // Create permissions
  for (const permission of allPermissions) {
    const createdPermission = await prisma.permission.create({
      data: {
        name: permission.id,
        description: permission.description,
        category: permission.category
      }
    });

    permissionMap[permission.id] = createdPermission;
    console.log(`Created permission: ${permission.name}`);
  }

  return permissionMap;
}

// Seed role-permission relationships
async function seedRolePermissions(roles, permissions) {
  console.log('Seeding role-permission relationships...');

  // For each role in the permission matrix
  for (const [roleKey, permissionList] of Object.entries(PERMISSION_MATRIX)) {
    const role = roles[roleKey.toLowerCase()];

    if (!role) {
      console.warn(`Role ${roleKey} not found in database, skipping permissions`);
      continue;
    }

    // For each permission assigned to this role
    for (const permissionKey of permissionList) {
      const permission = permissions[permissionKey];

      if (!permission) {
        console.warn(`Permission ${permissionKey} not found in database, skipping`);
        continue;
      }

      // Create the role-permission relationship
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id
        }
      });

      console.log(`Assigned permission ${permissionKey} to role ${roleKey}`);
    }
  }
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
