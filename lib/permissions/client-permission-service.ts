// lib/permissions/client-permission-service.ts
// Client-side version of the unified permission service

/**
 * Client-side Permission Service
 *
 * This service provides a unified way to check permissions in client components.
 * It uses API calls to check permissions and implements caching for performance.
 */
export class ClientPermissionService {
  // Cache for permission checks to reduce API calls
  private static permissionCache: Record<string, boolean> = {};
  private static permissionListCache: Record<string, string[]> = {};
  private static roleCache: Record<string, any> = {};
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Clear the permission cache
   * This should be called whenever permissions are updated
   */
  static clearCache(): void {
    this.permissionCache = {};
    this.permissionListCache = {};
    this.roleCache = {};
    this.cacheTimestamp = 0;
  }

  /**
   * Check if a user has a specific permission based on their role
   *
   * @deprecated Use hasPermissionById instead for better security and flexibility
   * @param role The user's role
   * @param permission The permission to check
   * @returns A promise that resolves to true if the user has the permission, false otherwise
   */
  static async hasPermission(role: string, permission: string): Promise<boolean> {
    try {
      // Check cache first
      const cacheKey = `role:${role}:${permission}`;
      const now = Date.now();

      // If cache is valid and has this permission check, return it
      if (
        now - this.cacheTimestamp < this.CACHE_TTL &&
        cacheKey in this.permissionCache
      ) {
        return this.permissionCache[cacheKey];
      }

      // Fetch from API
      const response = await fetch(`/api/roles/check-permission?role=${encodeURIComponent(role)}&permission=${encodeURIComponent(permission)}`);

      if (!response.ok) {
        throw new Error(`Failed to check permission: ${response.status} ${response.statusText}`);
      }

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
   * Check if a user has a specific permission based on their user ID
   * This is the preferred method for checking permissions
   *
   * @param userId The user's ID
   * @param permission The permission to check
   * @returns A promise that resolves to true if the user has the permission, false otherwise
   */
  static async hasPermissionById(userId: string, permission: string): Promise<boolean> {
    try {
      // Check cache first
      const cacheKey = `user:${userId}:${permission}`;
      const now = Date.now();

      // If cache is valid and has this permission check, return it
      if (
        now - this.cacheTimestamp < this.CACHE_TTL &&
        cacheKey in this.permissionCache
      ) {
        return this.permissionCache[cacheKey];
      }

      // Fetch from API
      const response = await fetch(`/api/users/check-permission?userId=${encodeURIComponent(userId)}&permission=${encodeURIComponent(permission)}`);

      if (!response.ok) {
        throw new Error(`Failed to check permission: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Update cache
      this.permissionCache[cacheKey] = data.hasPermission;
      this.cacheTimestamp = now;

      return data.hasPermission;
    } catch (error) {
      console.error(`Error checking permission ${permission} for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Synchronous version of hasPermission for immediate UI rendering
   * This is less accurate but provides a quick initial result
   *
   * @deprecated Use hasPermissionByIdSync instead for better security and flexibility
   * @param role The user's role
   * @param permission The permission to check
   * @returns True if the user has the permission based on role, false otherwise
   */
  static hasPermissionSync(role: string, permission: string): boolean {
    // Check cache first
    const cacheKey = `role:${role}:${permission}`;
    const now = Date.now();

    // If cache is valid and has this permission check, return it
    if (
      now - this.cacheTimestamp < this.CACHE_TTL &&
      cacheKey in this.permissionCache
    ) {
      return this.permissionCache[cacheKey];
    }

    // For roles without cache, we need to check with the server
    // Return false and let the async version update the UI
    return false;
  }

  /**
   * Synchronous version of hasPermissionById for immediate UI rendering
   * This is less accurate but provides a quick initial result
   *
   * @param userId The user's ID
   * @param permission The permission to check
   * @returns True if the user has the permission based on cached data, false otherwise
   */
  static hasPermissionByIdSync(userId: string, permission: string): boolean {
    // Check cache first
    const cacheKey = `user:${userId}:${permission}`;
    const now = Date.now();

    // If cache is valid and has this permission check, return it
    if (
      now - this.cacheTimestamp < this.CACHE_TTL &&
      cacheKey in this.permissionCache
    ) {
      return this.permissionCache[cacheKey];
    }

    // Without cache, we need to check with the server
    // Return false and let the async version update the UI
    return false;
  }

  /**
   * Get all permissions for a role
   *
   * @deprecated Use getPermissionsForUser instead for better security and flexibility
   * @param role The role name
   * @returns A promise that resolves to an array of permission strings
   */
  static async getPermissionsForRole(role: string): Promise<string[]> {
    try {
      // Check cache first
      const cacheKey = `role_permissions:${role}`;
      const now = Date.now();

      // If cache is valid and has this role's permissions, return them
      if (
        now - this.cacheTimestamp < this.CACHE_TTL &&
        cacheKey in this.permissionListCache
      ) {
        return this.permissionListCache[cacheKey];
      }

      // Fetch from API
      const response = await fetch(`/api/roles/permissions?role=${encodeURIComponent(role)}`);

      if (!response.ok) {
        throw new Error(`Failed to get permissions for role: ${response.status} ${response.statusText}`);
      }

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
   * Get all permissions for a user
   *
   * @param userId The user's ID
   * @returns A promise that resolves to an array of permission strings
   */
  static async getPermissionsForUser(userId: string): Promise<string[]> {
    try {
      // Check cache first
      const cacheKey = `user_permissions:${userId}`;
      const now = Date.now();

      // If cache is valid and has this user's permissions, return them
      if (
        now - this.cacheTimestamp < this.CACHE_TTL &&
        cacheKey in this.permissionListCache
      ) {
        return this.permissionListCache[cacheKey];
      }

      // Fetch from API
      const response = await fetch(`/api/users/permissions?userId=${encodeURIComponent(userId)}`);

      if (!response.ok) {
        throw new Error(`Failed to get permissions for user: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Update cache
      this.permissionListCache[cacheKey] = data.permissions || [];
      this.cacheTimestamp = now;

      return data.permissions || [];
    } catch (error) {
      console.error(`Error getting permissions for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Synchronous version of getPermissionsForRole for immediate UI rendering
   *
   * @deprecated Use getPermissionsForUserSync instead for better security and flexibility
   * @param role The role name
   * @returns An array of permission strings based on role
   */
  static getPermissionsForRoleSync(role: string): string[] {
    // Check cache first
    const cacheKey = `role_permissions:${role}`;
    const now = Date.now();

    // If cache is valid and has this role's permissions, return them
    if (
      now - this.cacheTimestamp < this.CACHE_TTL &&
      cacheKey in this.permissionListCache
    ) {
      return this.permissionListCache[cacheKey];
    }

    // For roles without cache, return basic permissions based on role
    return this.getBasicPermissionsForRole(role);
  }

  /**
   * Synchronous version of getPermissionsForUser for immediate UI rendering
   *
   * @param userId The user's ID
   * @returns An array of permission strings based on cached data or empty array
   */
  static getPermissionsForUserSync(userId: string): string[] {
    // Check cache first
    const cacheKey = `user_permissions:${userId}`;
    const now = Date.now();

    // If cache is valid and has this user's permissions, return them
    if (
      now - this.cacheTimestamp < this.CACHE_TTL &&
      cacheKey in this.permissionListCache
    ) {
      return this.permissionListCache[cacheKey];
    }

    // Without cache, we can't determine permissions synchronously
    // Return empty array and let the async version update the UI
    return [];
  }

  /**
   * Get basic permissions for a role
   * This is used as a fallback when the API is not available
   *
   * @param role The role name
   * @returns An array of permission strings
   */
  private static getBasicPermissionsForRole(role: string): string[] {
    const basicPermissions = [
      "view_projects",
      "view_dashboard",
      "edit_profile"
    ];

    // Manager role has most permissions
    if (role === "manager") {
      return [
        ...basicPermissions,
        "project_creation",
        "project_management",
        "task_creation",
        "task_management",
        "task_assignment",
        "team_view",
        "team_management",
        "team_add",
        "team_remove",
        "attendance_management",
        "view_team_attendance"
      ];
    }

    // User role has basic permissions plus team view and task creation
    if (role === "user") {
      return [
        ...basicPermissions,
        "team_view",
        "task_creation",
        "task_management"
      ];
    }

    // Guest role has only view permissions
    return ["view_projects", "view_dashboard"];
  }

  /**
   * Get all basic permissions
   * This is used as a fallback when the API is not available
   */
  private static getBasicPermissions(): Record<string, string> {
    return {
      USER_MANAGEMENT: "user_management",
      MANAGE_ROLES: "manage_roles",
      MANAGE_PERMISSIONS: "manage_permissions",
      PROJECT_CREATION: "project_creation",
      PROJECT_MANAGEMENT: "project_management",
      PROJECT_DELETION: "project_deletion",
      TEAM_MANAGEMENT: "team_management",
      TEAM_ADD: "team_add",
      TEAM_REMOVE: "team_remove",
      TEAM_VIEW: "team_view",
      TASK_CREATION: "task_creation",
      TASK_ASSIGNMENT: "task_assignment",
      TASK_MANAGEMENT: "task_management",
      TASK_DELETION: "task_deletion",
      VIEW_PROJECTS: "view_projects",
      EDIT_PROFILE: "edit_profile",
      SYSTEM_SETTINGS: "system_settings",
      VIEW_DASHBOARD: "view_dashboard",
      ATTENDANCE_MANAGEMENT: "attendance_management",
      VIEW_TEAM_ATTENDANCE: "view_team_attendance"
    };
  }

  /**
   * Get all available permissions
   *
   * @returns A promise that resolves to an array of permission objects
   */
  static async getAllPermissions(): Promise<{ id: string; name: string; description: string; category?: string }[]> {
    try {
      // Check cache first
      const now = Date.now();

      // If cache is valid and has permissions, return them
      if (
        now - this.cacheTimestamp < this.CACHE_TTL &&
        'permissions' in this.roleCache
      ) {
        return this.roleCache['permissions'];
      }

      // Fetch from API
      const response = await fetch('/api/permissions');

      if (!response.ok) {
        throw new Error(`Failed to get permissions: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Update cache
      this.roleCache['permissions'] = data;
      this.cacheTimestamp = now;

      return data;
    } catch (error) {
      console.error('Error getting all permissions:', error);
      return [];
    }
  }

  /**
   * Get all available roles
   *
   * @returns A promise that resolves to an array of role objects
   */
  static async getAllRoles(): Promise<{ id: string; name: string; description: string; color: string }[]> {
    try {
      // Check cache first
      const now = Date.now();

      // If cache is valid and has roles, return them
      if (
        now - this.cacheTimestamp < this.CACHE_TTL &&
        'roles' in this.roleCache
      ) {
        return this.roleCache['roles'];
      }

      // Fetch from API
      const response = await fetch('/api/roles');

      if (!response.ok) {
        throw new Error(`Failed to get roles: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Update cache
      this.roleCache['roles'] = data;
      this.cacheTimestamp = now;

      return data;
    } catch (error) {
      console.error('Error getting all roles:', error);
      return [];
    }
  }

  /**
   * Check if a user is authorized to access their own resource or has required permissions
   *
   * @param userId The current user's ID
   * @param resourceUserId The user ID associated with the resource
   * @param requiredPermission The permission required to access the resource if not the owner
   * @returns An object with hasPermission and error properties
   */
  static async checkOwnerOrPermission(
    userId: string | undefined,
    resourceUserId: string,
    requiredPermission: string
  ): Promise<{ hasPermission: boolean; error?: string }> {
    // If no user ID, no permission
    if (!userId) {
      return { hasPermission: false, error: "Unauthorized" };
    }

    // Check if user is the owner of the resource
    const isOwner = userId === resourceUserId;

    // If user is the owner, they have access
    if (isOwner) {
      return { hasPermission: true };
    }

    // Otherwise, check if they have the required permission
    const hasPermission = await this.hasPermissionById(userId, requiredPermission);
    return {
      hasPermission,
      error: hasPermission ? undefined : `Forbidden: ${requiredPermission} permission required`
    };
  }

  /**
   * Synchronous version of checkOwnerOrPermission for immediate UI rendering
   * Less accurate but provides a quick initial result
   *
   * @param userId The current user's ID
   * @param resourceUserId The user ID associated with the resource
   * @param requiredPermission The permission required to access the resource if not the owner
   * @returns An object with hasPermission and error properties
   */
  static checkOwnerOrPermissionSync(
    userId: string | undefined,
    resourceUserId: string,
    requiredPermission: string
  ): { hasPermission: boolean; error?: string } {
    // If no user ID, no permission
    if (!userId) {
      return { hasPermission: false, error: "Unauthorized" };
    }

    // Check if user is the owner of the resource
    const isOwner = userId === resourceUserId;

    // If user is the owner, they have access
    if (isOwner) {
      return { hasPermission: true };
    }

    // Check if the user has the required permission using cached data
    const hasPermission = this.hasPermissionByIdSync(userId, requiredPermission);

    if (hasPermission) {
      return { hasPermission: true };
    }

    // If we can't determine from cache, we need to check with the server
    // Return false and let the async version update the UI
    return {
      hasPermission: false,
      error: "Checking permissions..."
    };
  }

  /**
   * Legacy version of checkOwnerOrPermission that uses role
   *
   * @deprecated Use checkOwnerOrPermission instead
   */
  static async checkOwnerOrPermissionWithRole(
    userId: string | undefined,
    userRole: string | undefined,
    resourceUserId: string,
    requiredPermission: string
  ): Promise<{ hasPermission: boolean; error?: string }> {
    // If no user ID, no permission
    if (!userId) {
      return { hasPermission: false, error: "Unauthorized" };
    }

    // Check if user is the owner of the resource
    const isOwner = userId === resourceUserId;

    // If user is the owner, they have access
    if (isOwner) {
      return { hasPermission: true };
    }

    // Otherwise, check if they have the required permission
    if (userRole) {
      const hasPermission = await this.hasPermission(userRole, requiredPermission);
      return {
        hasPermission,
        error: hasPermission ? undefined : `Forbidden: ${requiredPermission} permission required`
      };
    }

    // If no role is provided, deny access
    return {
      hasPermission: false,
      error: "Forbidden: Insufficient permissions"
    };
  }
}
