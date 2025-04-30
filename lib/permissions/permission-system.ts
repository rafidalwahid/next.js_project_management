// lib/permissions/permission-system.ts

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
    color: "#8B5CF6" // Purple
  },
  manager: {
    name: "Manager",
    description: "Can manage projects, tasks, and team members",
    color: "#3B82F6" // Blue
  },
  user: {
    name: "User",
    description: "Regular user with limited permissions",
    color: "#10B981" // Green
  },
  guest: {
    name: "Guest",
    description: "View-only access to projects",
    color: "#6B7280" // Gray
  }
};

// Permission matrix - which roles have which permissions
export const PERMISSION_MATRIX = {
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

// Permission checking functions
export class PermissionSystem {
  /**
   * Check if a role has a specific permission
   */
  static hasPermission(role: string, permission: string): boolean {
    // Admin role has all permissions
    if (role === ROLES.ADMIN) {
      return true;
    }
    
    // If role doesn't exist, return false
    if (!PERMISSION_MATRIX[role as keyof typeof PERMISSION_MATRIX]) {
      return false;
    }

    // Check if the role has the permission
    return PERMISSION_MATRIX[role as keyof typeof PERMISSION_MATRIX].includes(permission);
  }

  /**
   * Get all permissions for a role
   */
  static getPermissionsForRole(role: string): string[] {
    return PERMISSION_MATRIX[role as keyof typeof PERMISSION_MATRIX] || [];
  }

  /**
   * Get all roles that have a specific permission
   */
  static getRolesWithPermission(permission: string): string[] {
    return Object.entries(PERMISSION_MATRIX)
      .filter(([_, permissions]) => permissions.includes(permission))
      .map(([role]) => role);
  }

  /**
   * Get all available permissions
   */
  static getAllPermissions(): { id: string; name: string; description: string }[] {
    return Object.entries(PERMISSIONS).map(([key, value]) => ({
      id: value,
      name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `Permission to ${value.replace(/_/g, ' ')}`
    }));
  }

  /**
   * Get all available roles
   */
  static getAllRoles(): { id: string; name: string; description: string; color: string }[] {
    return Object.entries(SYSTEM_ROLES).map(([id, role]) => ({
      id,
      name: role.name,
      description: role.description,
      color: role.color
    }));
  }

  /**
   * Get the permission matrix
   */
  static getPermissionMatrix(): typeof PERMISSION_MATRIX {
    return PERMISSION_MATRIX;
  }
}
