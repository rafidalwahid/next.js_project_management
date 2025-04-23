// This file contains a version of the permission service that works in Edge Runtime
// It does not use Prisma, only static data

// Fallback permission matrix for middleware
const PERMISSION_MATRIX = {
  admin: [
    "user_management", "project_creation", "task_assignment", "task_management", 
    "view_projects", "edit_profile", "system_settings", "project_management",
    "attendance_management", "view_team_attendance", "manage_roles", "view_dashboard"
  ],
  manager: [
    "user_management", "project_creation", "task_assignment", "task_management", 
    "view_projects", "edit_profile", "project_management", "view_team_attendance", 
    "view_dashboard"
  ],
  user: [
    "task_management", "view_projects", "edit_profile", "view_dashboard"
  ],
  guest: [
    "view_projects"
  ]
};

export class PermissionsMiddleware {
  /**
   * Check if a role has a specific permission
   * This is a static version that works in Edge Runtime
   */
  static hasPermission(role: string, permission: string): boolean {
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
}
