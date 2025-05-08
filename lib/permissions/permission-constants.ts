// lib/permissions/permission-constants.ts
// This file contains constants for permissions and roles
// These are used for type safety and consistency across the application

// Define all available permissions
export const PERMISSIONS = {
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
export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  USER: "user",
  GUEST: "guest",
};

// Define system roles with additional metadata
export const SYSTEM_ROLES = {
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

// Helper function to get all permissions with metadata
export function getAllPermissionsWithMetadata(): { id: string; name: string; description: string; category?: string }[] {
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

// Helper function to get all roles with metadata
export function getAllRolesWithMetadata(): { id: string; name: string; description: string; color: string }[] {
  return Object.entries(SYSTEM_ROLES).map(([id, role]) => ({
    id,
    name: role.name,
    description: role.description,
    color: role.color
  }));
}
