// lib/permissions/edge-db-permission-service.ts
// Edge-compatible permission service that uses API calls and caching

import { ROLES } from "./permission-constants";

// Cache for permission matrix
let permissionMatrixCache: Record<string, string[]> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Edge-compatible Database Permission Service
 *
 * This is a version of the DbPermissionService that doesn't use Prisma,
 * making it compatible with Edge Runtime environments like middleware.
 *
 * It uses a cached permission matrix that can be updated periodically.
 */
export class EdgeDbPermissionService {
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

      // Get the permission matrix from cache or API
      const permissionMatrix = await this.getPermissionMatrix();
      
      // Check if the role has the permission
      return permissionMatrix[role]?.includes(permission) || false;
    } catch (error) {
      console.error("Error in EdgeDbPermissionService.hasPermission:", error);
      return false;
    }
  }

  /**
   * Get all permissions for a role
   *
   * @param role The role to get permissions for
   * @returns An array of permission strings
   */
  static async getPermissionsForRole(role: string): Promise<string[]> {
    try {
      // Admin role always has all permissions
      if (role === ROLES.ADMIN) {
        // Get all permissions from the matrix
        const permissionMatrix = await this.getPermissionMatrix();
        const allPermissions = new Set<string>();
        
        // Collect all unique permissions from all roles
        Object.values(permissionMatrix).forEach(permissions => {
          permissions.forEach(permission => allPermissions.add(permission));
        });
        
        return Array.from(allPermissions);
      }

      // Get the permission matrix from cache or API
      const permissionMatrix = await this.getPermissionMatrix();
      
      // Return the permissions for the role
      return permissionMatrix[role] || [];
    } catch (error) {
      console.error("Error in EdgeDbPermissionService.getPermissionsForRole:", error);
      return [];
    }
  }

  /**
   * Get the permission matrix from cache or API
   *
   * @returns A record mapping role names to arrays of permission strings
   */
  private static async getPermissionMatrix(): Promise<Record<string, string[]>> {
    const now = Date.now();
    
    // If cache is valid, return it
    if (permissionMatrixCache && now - cacheTimestamp < CACHE_TTL) {
      return permissionMatrixCache;
    }
    
    try {
      // Fetch the permission matrix from the API
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/permissions/matrix`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXTAUTH_SECRET}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch permission matrix: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update cache
      permissionMatrixCache = data.matrix || {};
      cacheTimestamp = now;
      
      return permissionMatrixCache;
    } catch (error) {
      console.error("Error fetching permission matrix:", error);
      
      // If cache exists but is expired, use it anyway as a fallback
      if (permissionMatrixCache) {
        return permissionMatrixCache;
      }
      
      // Otherwise, return an empty matrix
      return {};
    }
  }

  /**
   * Clear the permission matrix cache
   * Call this when permissions might have changed
   */
  static clearCache(): void {
    permissionMatrixCache = null;
    cacheTimestamp = 0;
  }
}
