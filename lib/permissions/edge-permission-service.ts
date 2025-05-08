// lib/permissions/edge-permission-service.ts
// Edge-compatible Permission Service for middleware

/**
 * Edge-compatible Permission Service
 * 
 * This service provides a simplified way to check permissions in edge environments like middleware.
 * It uses hardcoded permission mappings for basic checks without database access.
 * For more complex permission checks, API routes should be used instead.
 */
export class EdgePermissionService {
  // Basic role-permission mappings for edge environments
  private static readonly ROLE_PERMISSIONS: Record<string, string[]> = {
    'admin': [
      // Admin has all permissions
      'user_management',
      'project_management',
      'project_creation',
      'task_management',
      'attendance_management',
      'system_settings',
      'manage_roles',
      'manage_permissions',
      'view_all_projects',
      'edit_all_projects',
      'delete_all_projects',
      'view_all_tasks',
      'edit_all_tasks',
      'delete_all_tasks',
      'view_team',
      'edit_team',
      'delete_team',
      'view_attendance',
      'edit_attendance',
      'delete_attendance'
    ],
    'manager': [
      // Manager has project and team management permissions
      'project_management',
      'project_creation',
      'task_management',
      'view_team',
      'edit_team',
      'view_attendance',
      'view_all_projects'
    ],
    'user': [
      // Regular user has basic permissions
      'view_attendance',
      'task_management'
    ],
    'guest': [
      // Guest has minimal permissions
    ]
  };

  /**
   * Check if a user has a specific permission based on their role
   * This is a simplified version for edge environments
   *
   * @param role The user's role
   * @param permission The permission to check
   * @returns True if the user has the permission, false otherwise
   */
  static hasPermission(role: string, permission: string): boolean {
    try {
      // Admin role always has all permissions
      if (role === "admin") {
        return true;
      }

      // Get permissions for the role
      const permissions = this.ROLE_PERMISSIONS[role] || [];
      
      // Check if the role has the permission
      return permissions.includes(permission);
    } catch (error) {
      console.error(`Error checking permission ${permission} for role ${role}:`, error);
      return false;
    }
  }

  /**
   * Get all permissions for a role
   * This is a simplified version for edge environments
   *
   * @param role The role name
   * @returns An array of permission strings
   */
  static getPermissionsForRole(role: string): string[] {
    try {
      // Admin role always has all permissions
      if (role === "admin") {
        // Combine all permissions from all roles
        return Object.values(this.ROLE_PERMISSIONS).flat();
      }

      // Get permissions for the role
      return this.ROLE_PERMISSIONS[role] || [];
    } catch (error) {
      console.error(`Error getting permissions for role ${role}:`, error);
      return [];
    }
  }
}
