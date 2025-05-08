import { ROLES } from "@/lib/permissions/permission-constants";
import { EdgeDbPermissionService } from "@/lib/permissions/edge-db-permission-service";

// Cache for permission matrix
let permissionMatrixCache: Record<string, string[]> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Edge-compatible Permission Service
 *
 * This is a version of the PermissionService that doesn't use Prisma,
 * making it compatible with Edge Runtime environments like middleware.
 *
 * It uses a cached permission matrix that can be updated periodically.
 */
export class EdgePermissionService {
  /**
   * Check if a user has a specific permission based on their role
   *
   * @param role The user's role
   * @param permission The permission to check
   * @returns True if the user has the permission, false otherwise
   */
  static async hasPermission(role: string, permission: string): Promise<boolean> {
    try {
      // Admin role always has all permissions
      if (role === ROLES.ADMIN) {
        return true;
      }

      // Use the database-backed edge permission service
      return await EdgeDbPermissionService.hasPermission(role, permission);
    } catch (error) {
      console.error("Error in EdgePermissionService.hasPermission:", error);
      return false;
    }
  }

  /**
   * Get all permissions for a role
   *
   * @param role The user's role
   * @returns A promise that resolves to an array of permission strings
   */
  static async getPermissionsForRole(role: string): Promise<string[]> {
    try {
      // Admin role always has all permissions
      if (role === ROLES.ADMIN) {
        // Get all permissions from the edge permission service
        const allPermissions = await EdgeDbPermissionService.getPermissionsForRole(ROLES.ADMIN);
        return allPermissions;
      }

      // Use the database-backed edge permission service
      return await EdgeDbPermissionService.getPermissionsForRole(role);
    } catch (error) {
      console.error("Error in EdgePermissionService.getPermissionsForRole:", error);
      return [];
    }
  }

  /**
   * Get all available permissions
   *
   * @returns An array of permission objects with id, name, description, and category
   */
  static async getAllPermissions(): Promise<{ id: string; name: string; description: string; category?: string }[]> {
    try {
      // Use the cached permission matrix to get all permissions
      const permissionMatrix = await EdgeDbPermissionService.getPermissionMatrix();

      // Collect all unique permissions
      const allPermissions = new Set<string>();
      Object.values(permissionMatrix).forEach(perms => {
        perms.forEach(p => allPermissions.add(p));
      });

      // Convert to the expected format
      return Array.from(allPermissions).map(p => ({
        id: p,
        name: p
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' '),
        description: `Permission to ${p.replace(/_/g, ' ')}`,
        category: this.getCategoryForPermission(p)
      }));
    } catch (error) {
      console.error("Error in EdgePermissionService.getAllPermissions:", error);
      return [];
    }
  }

  /**
   * Get all available roles
   *
   * @returns An array of role objects with id, name, description, and color
   */
  static async getAllRoles(): Promise<{ id: string; name: string; description: string; color: string }[]> {
    try {
      // Use the cached permission matrix to get all roles
      const permissionMatrix = await EdgeDbPermissionService.getPermissionMatrix();

      // Get all role names
      const roleNames = Object.keys(permissionMatrix);

      // Convert to the expected format
      return roleNames.map(role => ({
        id: role,
        name: role.charAt(0).toUpperCase() + role.slice(1),
        description: `${role.charAt(0).toUpperCase() + role.slice(1)} role`,
        color: this.getColorForRole(role)
      }));
    } catch (error) {
      console.error("Error in EdgePermissionService.getAllRoles:", error);
      return [];
    }
  }

  /**
   * Helper method to get category for a permission
   */
  private static getCategoryForPermission(permission: string): string {
    if (permission.includes('user') || permission.includes('role')) {
      return 'User Management';
    } else if (permission.includes('project')) {
      return 'Project Management';
    } else if (permission.includes('task')) {
      return 'Task Management';
    } else if (permission.includes('team')) {
      return 'Team Management';
    } else if (permission.includes('attendance')) {
      return 'Attendance';
    } else if (permission.includes('system')) {
      return 'System';
    } else {
      return 'General';
    }
  }

  /**
   * Helper method to get color for a role
   */
  private static getColorForRole(role: string): string {
    switch (role) {
      case 'admin':
        return 'bg-purple-500';
      case 'manager':
        return 'bg-blue-500';
      case 'user':
        return 'bg-green-500';
      case 'guest':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  }

  /**
   * Check if a user is authorized to access their own resource or has admin privileges
   *
   * @param userId The user's ID
   * @param userRole The user's role
   * @param resourceUserId The user ID associated with the resource
   * @param adminOnly Whether only admins should have access regardless of ownership
   * @returns An object with hasPermission and error properties
   */
  static checkOwnerOrAdmin(
    userId: string | undefined,
    userRole: string | undefined,
    resourceUserId: string,
    adminOnly: boolean = false
  ): { hasPermission: boolean; error?: string } {
    // If no user ID, no permission
    if (!userId) {
      return { hasPermission: false, error: "Unauthorized" };
    }

    // Check if user is the owner of the resource
    const isOwner = userId === resourceUserId;

    // Check if user is an admin
    const isAdmin = userRole === "admin";

    // Check if user is a manager
    const isManager = userRole === "manager";

    // If adminOnly is true, only admins have access regardless of ownership
    if (adminOnly) {
      return {
        hasPermission: isAdmin,
        error: isAdmin ? undefined : "Forbidden: Admin access required"
      };
    }

    // Otherwise, owners, admins, and managers have access
    return {
      hasPermission: isOwner || isAdmin || isManager,
      error: (isOwner || isAdmin || isManager) ? undefined : "Forbidden: Insufficient permissions"
    };
  }
}
