// Client-side permissions service that doesn't use Prisma
// This is used in browser environments where Prisma can't run

// Enhanced permission matrix for client-side use with project management permissions
const PERMISSION_MATRIX = {
  admin: [
    // User management
    "user_management",
    "manage_roles",
    "manage_permissions",
    
    // Project management
    "project_creation",
    "project_management",
    "project_deletion",
    
    // Team management
    "team_management",
    "team_add",
    "team_remove",
    
    // Task management
    "task_creation",
    "task_assignment",
    "task_management",
    "task_deletion",
    
    // General permissions
    "view_projects",
    "edit_profile",
    "system_settings",
    "view_dashboard",
    
    // Attendance
    "attendance_management",
    "view_team_attendance"
  ],
  
  manager: [
    // User management (limited)
    "user_view",
    
    // Project management
    "project_creation",
    "project_management",
    
    // Team management
    "team_management",
    "team_add",
    "team_remove",
    
    // Task management
    "task_creation",
    "task_assignment",
    "task_management",
    "task_deletion",
    
    // General permissions
    "view_projects",
    "edit_profile",
    "view_dashboard",
    
    // Attendance
    "view_team_attendance"
  ],
  
  user: [
    // Task management (limited)
    "task_creation",
    "task_management",
    
    // General permissions
    "view_projects",
    "edit_profile",
    "view_dashboard",
    
    // Team
    "team_view"
  ],
  
  guest: [
    "view_projects"
  ]
};

export class ClientPermissions {
  /**
   * Check if a role has a specific permission
   */
  static hasPermission(role: string, permission: string): boolean {
    // Admin role has all permissions
    if (role === 'admin') {
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
   * Check user permissions from API
   * This makes an API call to check permissions on the server
   */
  static async checkUserPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/users/permissions?userId=${userId}`);
      if (!response.ok) return false;
      
      const data = await response.json();
      return data.permissions.includes(permission);
    } catch (error) {
      console.error(`Error checking permission ${permission} for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get all permissions for a user from API
   */
  static async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const response = await fetch(`/api/users/permissions?userId=${userId}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.permissions;
    } catch (error) {
      console.error(`Error getting permissions for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get all roles for a user from API
   */
  static async getUserRoles(userId: string): Promise<string[]> {
    try {
      const response = await fetch(`/api/users/roles?userId=${userId}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.roles;
    } catch (error) {
      console.error(`Error getting roles for user ${userId}:`, error);
      return [];
    }
  }
}
