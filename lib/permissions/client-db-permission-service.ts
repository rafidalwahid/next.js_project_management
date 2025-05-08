// lib/permissions/client-db-permission-service.ts
// Client-side version of the permission service that uses API calls

import { ROLES } from "./permission-constants";

/**
 * Client-side Database Permission Service
 *
 * This service provides a unified way to check permissions in client components
 * using API calls to the server for database-backed permission checks.
 */
export class ClientDbPermissionService {
  // Cache for permission checks to reduce API calls
  private static permissionCache: Record<string, boolean> = {};
  private static permissionListCache: Record<string, string[]> = {};
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Check if a user has a specific permission based on their role
   * This is a client-side method that makes an API call to check permissions
   *
   * @param role The user's role
   * @param permission The permission to check
   * @returns A promise that resolves to true if the user has the permission, false otherwise
   */
  static async hasPermission(role: string, permission: string): Promise<boolean> {
    try {
      // Admin role always has all permissions
      if (role === ROLES.ADMIN) {
        return true;
      }

      // Check cache first
      const cacheKey = `${role}:${permission}`;
      const now = Date.now();
      
      // If cache is valid and has this permission check, return it
      if (
        now - this.cacheTimestamp < this.CACHE_TTL && 
        cacheKey in this.permissionCache
      ) {
        return this.permissionCache[cacheKey];
      }

      // Make API call to check permission
      const response = await fetch(`/api/users/check-permission?permission=${encodeURIComponent(permission)}`);
      const data = await response.json();

      // Update cache
      this.permissionCache[cacheKey] = data.hasPermission;
      this.cacheTimestamp = now;

      return data.hasPermission;
    } catch (error) {
      console.error(`Error checking permission ${permission} for role ${role}:`, error);
      return false;
    }
  }

  /**
   * Get all permissions for a user based on their role
   * This is a client-side method that makes an API call to get permissions
   *
   * @param role The user's role
   * @returns A promise that resolves to an array of permission strings
   */
  static async getPermissionsForRole(role: string): Promise<string[]> {
    try {
      // Admin role always has all permissions
      if (role === ROLES.ADMIN) {
        // Get all permissions from the API
        const allPermissions = await this.getAllPermissions();
        return allPermissions.map(p => p.id);
      }

      // Check cache first
      const cacheKey = `role:${role}`;
      const now = Date.now();
      
      // If cache is valid and has this role's permissions, return them
      if (
        now - this.cacheTimestamp < this.CACHE_TTL && 
        cacheKey in this.permissionListCache
      ) {
        return this.permissionListCache[cacheKey];
      }

      // Make API call to get permissions
      const response = await fetch('/api/users/permissions');
      const data = await response.json();

      // Update cache
      this.permissionListCache[cacheKey] = data.permissions || [];
      this.cacheTimestamp = now;

      return data.permissions || [];
    } catch (error) {
      console.error(`Error getting permissions for role ${role}:`, error);
      return [];
    }
  }

  /**
   * Get all available permissions
   * This is a client-side method that makes an API call to get all permissions
   *
   * @returns A promise that resolves to an array of permission objects
   */
  static async getAllPermissions(): Promise<{ id: string; name: string; description: string; category?: string }[]> {
    try {
      // Make API call to get all permissions
      const response = await fetch('/api/permissions');
      const data = await response.json();

      return data.permissions || [];
    } catch (error) {
      console.error('Error getting all permissions:', error);
      return [];
    }
  }

  /**
   * Get all available roles
   * This is a client-side method that makes an API call to get all roles
   *
   * @returns A promise that resolves to an array of role objects
   */
  static async getAllRoles(): Promise<{ id: string; name: string; description: string; color: string }[]> {
    try {
      // Make API call to get all roles
      const response = await fetch('/api/roles');
      const data = await response.json();

      return data.roles || [];
    } catch (error) {
      console.error('Error getting all roles:', error);
      return [];
    }
  }

  /**
   * Clear the permission cache
   * Call this when permissions might have changed
   */
  static clearCache(): void {
    this.permissionCache = {};
    this.permissionListCache = {};
    this.cacheTimestamp = 0;
  }
}
