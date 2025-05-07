import { UnifiedPermissionSystem } from "@/lib/permissions/unified-permission-system";

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
      if (role === "admin") {
        return true;
      }

      // Try to use the cached permission matrix if available and not expired
      if (permissionMatrixCache && (Date.now() - cacheTimestamp < CACHE_TTL)) {
        const rolePermissions = permissionMatrixCache[role] || [];
        if (rolePermissions.includes(permission)) {
          return true;
        }
      }

      // If cache is expired or not available, try to fetch from API
      try {
        // This will only work in environments where fetch is available
        // In true edge environments, we'll catch and fall back to the hardcoded matrix
        // Use absolute URL for middleware compatibility
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/permissions/matrix`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Add authorization header if available in the environment
            ...(process.env.NEXTAUTH_SECRET ? { 'Authorization': `Bearer ${process.env.NEXTAUTH_SECRET}` } : {})
          }
        });

        // Only try to parse JSON if the response is OK and content-type is application/json
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          const matrix = await response.json();
          permissionMatrixCache = matrix;
          cacheTimestamp = Date.now();

          const rolePermissions = permissionMatrixCache[role] || [];
          if (rolePermissions.includes(permission)) {
            return true;
          }
        } else {
          // If we get a non-JSON response (like HTML from a redirect), fall back to hardcoded matrix
          console.warn("Non-JSON response from permission matrix API, falling back to hardcoded matrix");
        }
      } catch (fetchError) {
        // Silently fail and fall back to hardcoded matrix
        console.error("Error fetching permission matrix:", fetchError);
      }

      // Fall back to the hardcoded matrix
      return UnifiedPermissionSystem.hasPermission(role, permission);
    } catch (error) {
      console.error("Error in EdgePermissionService.hasPermission:", error);
      // Fall back to the hardcoded matrix in case of any error
      return UnifiedPermissionSystem.hasPermission(role, permission);
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
      if (role === "admin") {
        // Try to get all permissions from cache or API
        try {
          // Check if we have a cached matrix
          if (permissionMatrixCache && (Date.now() - cacheTimestamp < CACHE_TTL)) {
            // Collect all unique permissions from the cache
            const allPermissions = new Set<string>();
            Object.values(permissionMatrixCache).forEach(perms => {
              perms.forEach(p => allPermissions.add(p));
            });
            return Array.from(allPermissions);
          }

          // Try to fetch from API
          const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
          const response = await fetch(`${baseUrl}/api/permissions/matrix`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              // Add authorization header if available in the environment
              ...(process.env.NEXTAUTH_SECRET ? { 'Authorization': `Bearer ${process.env.NEXTAUTH_SECRET}` } : {})
            }
          });

          // Only try to parse JSON if the response is OK and content-type is application/json
          if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
            const matrix = await response.json();
            permissionMatrixCache = matrix;
            cacheTimestamp = Date.now();

            // Collect all unique permissions
            const allPermissions = new Set<string>();
            Object.values(matrix).forEach(perms => {
              perms.forEach((p: string) => allPermissions.add(p));
            });
            return Array.from(allPermissions);
          } else {
            // If we get a non-JSON response, fall back to hardcoded matrix
            console.warn("Non-JSON response from permission matrix API, falling back to hardcoded matrix");
          }
        } catch (fetchError) {
          // Silently fail and fall back to hardcoded matrix
          console.error("Error fetching permission matrix:", fetchError);
        }
      }

      // Try to use the cached permission matrix if available and not expired
      if (permissionMatrixCache && (Date.now() - cacheTimestamp < CACHE_TTL)) {
        return permissionMatrixCache[role] || [];
      }

      // If cache is expired or not available, try to fetch from API
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/permissions/matrix`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Add authorization header if available in the environment
            ...(process.env.NEXTAUTH_SECRET ? { 'Authorization': `Bearer ${process.env.NEXTAUTH_SECRET}` } : {})
          }
        });

        // Only try to parse JSON if the response is OK and content-type is application/json
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          const matrix = await response.json();
          permissionMatrixCache = matrix;
          cacheTimestamp = Date.now();

          return matrix[role] || [];
        } else {
          // If we get a non-JSON response, fall back to hardcoded matrix
          console.warn("Non-JSON response from permission matrix API, falling back to hardcoded matrix");
        }
      } catch (fetchError) {
        // Silently fail and fall back to hardcoded matrix
        console.error("Error fetching permission matrix:", fetchError);
      }

      // Fall back to the hardcoded matrix
      return UnifiedPermissionSystem.getPermissionsForRole(role);
    } catch (error) {
      console.error("Error in EdgePermissionService.getPermissionsForRole:", error);
      // Fall back to the hardcoded matrix in case of any error
      return UnifiedPermissionSystem.getPermissionsForRole(role);
    }
  }

  /**
   * Get all available permissions
   *
   * @returns An array of permission objects with id, name, description, and category
   */
  static getAllPermissions(): { id: string; name: string; description: string; category?: string }[] {
    return UnifiedPermissionSystem.getAllPermissions();
  }

  /**
   * Get all available roles
   *
   * @returns An array of role objects with id, name, description, and color
   */
  static getAllRoles(): { id: string; name: string; description: string; color: string }[] {
    return UnifiedPermissionSystem.getAllRoles();
  }

  /**
   * Get all roles that have a specific permission
   *
   * @param permission The permission to check
   * @returns An array of role strings
   */
  static getRolesWithPermission(permission: string): string[] {
    return UnifiedPermissionSystem.getRolesWithPermission(permission);
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
