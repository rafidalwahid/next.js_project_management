// This is a mock implementation. In a real app, you would fetch this from a database
const PERMISSION_MATRIX = {
  admin: [
    "user_management", "project_creation", "task_assignment", "task_management", 
    "view_projects", "edit_profile", "system_settings", "project_management"
  ],
  manager: [
    "user_management", "project_creation", "task_assignment", "task_management", 
    "view_projects", "edit_profile", "project_management"
  ],
  user: [
    "task_management", "view_projects", "edit_profile"
  ],
  guest: [
    "view_projects"
  ]
};

export class RolePermissionService {
  /**
   * Check if a user with the given role has a specific permission
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
   * Get all available permissions
   */
  static getAllPermissions(): string[] {
    // Combine all permissions from all roles and remove duplicates
    const allPermissions = Object.values(PERMISSION_MATRIX).flat();
    return [...new Set(allPermissions)];
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
   * Get the entire permission matrix
   */
  static getPermissionMatrix(): typeof PERMISSION_MATRIX {
    return PERMISSION_MATRIX;
  }
}
