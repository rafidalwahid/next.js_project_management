import { Session } from "next-auth";
import prisma from "@/lib/prisma";
import { ROLES } from "@/lib/permissions/permission-constants";

/**
 * Centralized Permission Service
 *
 * This service provides a unified way to check permissions across the application.
 * It handles common permission checking patterns and provides consistent error responses.
 * It uses only the database for permission checks, with no fallbacks to hardcoded permissions.
 */
export class PermissionService {
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

      // Get the permission from the database
      const rolePermission = await prisma.rolePermission.findFirst({
        where: {
          role: {
            name: role
          },
          permission: {
            name: permission
          }
        }
      });

      // If found in the database, the role has the permission
      return !!rolePermission;
    } catch (error) {
      console.error(`Error checking permission ${permission} for role ${role}:`, error);
      return false;
    }
  }

  /**
   * Check if a user has a specific permission based on their user ID
   *
   * @param userId The user's ID
   * @param permission The permission to check
   * @returns A promise that resolves to true if the user has the permission, false otherwise
   */
  static async hasPermissionById(userId: string, permission: string): Promise<boolean> {
    try {
      // Get the user to check their role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        return false;
      }

      // Use the database-backed permission system to check if the role has the permission
      return await this.hasPermission(user.role, permission);
    } catch (error) {
      console.error(`Error checking permission ${permission} for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get all permissions for a user based on their role
   *
   * @param role The user's role
   * @returns An array of permission strings
   */
  static async getPermissionsForRole(role: string): Promise<string[]> {
    try {
      // Admin role always has all permissions
      if (role === ROLES.ADMIN) {
        // Get all permissions from the database
        const allPermissions = await prisma.permission.findMany();
        return allPermissions.map(p => p.name);
      }

      // Get the permissions from the database
      const rolePermissions = await prisma.rolePermission.findMany({
        where: {
          role: {
            name: role
          }
        },
        include: {
          permission: true
        }
      });

      // Return the permissions
      return rolePermissions.map(rp => rp.permission.name);
    } catch (error) {
      console.error(`Error getting permissions for role ${role}:`, error);
      return [];
    }
  }

  /**
   * Get all permissions for a user based on their user ID
   *
   * @param userId The user's ID
   * @returns A promise that resolves to an array of permission strings
   */
  static async getPermissionsForUser(userId: string): Promise<string[]> {
    try {
      // Get the user to check their role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        return [];
      }

      // Use the database-backed permission system to get permissions for the role
      return await this.getPermissionsForRole(user.role);
    } catch (error) {
      console.error(`Error getting permissions for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Check if a user is authorized to access their own resource or has admin privileges
   *
   * @param session The user's session
   * @param resourceUserId The user ID associated with the resource
   * @param adminOnly Whether only admins should have access regardless of ownership
   * @returns An object with hasPermission and error properties
   */
  static checkOwnerOrAdmin(
    session: Session | null,
    resourceUserId: string,
    adminOnly: boolean = false
  ): { hasPermission: boolean; error?: string } {
    // If no session, no permission
    if (!session || !session.user.id) {
      return { hasPermission: false, error: "Unauthorized" };
    }

    // Check if user is the owner of the resource
    const isOwner = session.user.id === resourceUserId;

    // Check if user is an admin
    const isAdmin = session.user.role === "admin";

    // Check if user is a manager
    const isManager = session.user.role === "manager";

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

  /**
   * Get all available permissions
   *
   * @returns An array of permission objects with id, name, description, and category
   */
  static async getAllPermissions(): Promise<{ id: string; name: string; description: string; category?: string }[]> {
    try {
      // Get all permissions from the database
      const dbPermissions = await prisma.permission.findMany();

      return dbPermissions.map(p => ({
        id: p.name,
        name: p.name
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' '),
        description: p.description || `Permission to ${p.name.replace(/_/g, ' ')}`,
        category: p.category
      }));
    } catch (error) {
      console.error('Error getting all permissions:', error);
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
      // Get all roles from the database
      const dbRoles = await prisma.role.findMany();

      return dbRoles.map(r => ({
        id: r.name,
        name: r.name.charAt(0).toUpperCase() + r.name.slice(1),
        description: r.description || '',
        color: r.color || 'bg-gray-500'
      }));
    } catch (error) {
      console.error('Error getting all roles:', error);
      return [];
    }
  }

  /**
   * Update a user's role
   * @param userId - The ID of the user to update
   * @param roleName - The new role to assign
   * @returns A boolean indicating success or failure
   */
  static async updateUserRole(userId: string, roleName: string): Promise<boolean> {
    try {
      // Validate that the role is one of the allowed roles
      const validRoles = ['admin', 'manager', 'user', 'guest'];
      if (!validRoles.includes(roleName)) {
        console.error(`Invalid role: ${roleName}`);
        return false;
      }

      // Update the user's role
      await prisma.user.update({
        where: { id: userId },
        data: { role: roleName }
      });

      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  }

  /**
   * Get all roles that have a specific permission
   *
   * @param permission The permission to check
   * @returns An array of role strings
   */
  static async getRolesWithPermission(permission: string): Promise<string[]> {
    try {
      // Get all roles with this permission from the database
      const rolePermissions = await prisma.rolePermission.findMany({
        where: {
          permission: {
            name: permission
          }
        },
        include: {
          role: true
        }
      });

      return rolePermissions.map(rp => rp.role.name);
    } catch (error) {
      console.error(`Error getting roles with permission ${permission}:`, error);
      return [];
    }
  }

  /**
   * Update all role permissions
   *
   * @param permissions A record mapping role names to arrays of permission strings
   * @returns A boolean indicating success or failure
   */
  static async updateAllRolePermissions(permissions: Record<string, string[]>): Promise<boolean> {
    try {
      // Start a transaction to ensure all updates succeed or fail together
      return await prisma.$transaction(async (tx) => {
        // Delete all existing role-permission relationships
        await tx.rolePermission.deleteMany({});

        // Create new role-permission relationships
        for (const [roleName, permissionNames] of Object.entries(permissions)) {
          // Get the role
          const role = await tx.role.findUnique({
            where: { name: roleName }
          });

          if (!role) {
            console.error(`Role ${roleName} not found`);
            continue;
          }

          // Create role-permission relationships for each permission
          for (const permissionName of permissionNames) {
            // Get the permission
            const permission = await tx.permission.findUnique({
              where: { name: permissionName }
            });

            if (!permission) {
              console.error(`Permission ${permissionName} not found`);
              continue;
            }

            // Create the role-permission relationship
            await tx.rolePermission.create({
              data: {
                roleId: role.id,
                permissionId: permission.id
              }
            });
          }
        }

        return true;
      });
    } catch (error) {
      console.error('Error updating role permissions:', error);
      return false;
    }
  }

  /**
   * Update a user's role
   *
   * @param userId The user's ID
   * @param role The new role
   * @returns A promise that resolves to true if the update was successful, false otherwise
   */
  static async updateUserRole(userId: string, role: string): Promise<boolean> {
    try {
      // Update the user's role
      await prisma.user.update({
        where: { id: userId },
        data: { role }
      });

      return true;
    } catch (error) {
      console.error(`Error updating role for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Update permissions for a role
   *
   * @param roleName The name of the role to update
   * @param permissions Array of permission names to assign to the role
   * @returns A promise that resolves to true if the update was successful, false otherwise
   */
  static async updateRolePermissions(roleName: string, permissions: string[]): Promise<boolean> {
    try {
      // Get the role from the database
      const role = await prisma.role.findUnique({
        where: { name: roleName }
      });

      if (!role) {
        console.error(`Role ${roleName} not found in database`);
        return false;
      }

      // Delete all existing permissions for this role
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id }
      });

      // Get all permissions from the database
      const dbPermissions = await prisma.permission.findMany({
        where: {
          name: {
            in: permissions
          }
        }
      });

      // Create new role-permission relationships
      for (const permission of dbPermissions) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id
          }
        });
      }

      return true;
    } catch (error) {
      console.error(`Error updating permissions for role ${roleName}:`, error);
      return false;
    }
  }

  /**
   * Update all role permissions at once
   *
   * @param permissionMatrix Object mapping role names to arrays of permission names
   * @returns A promise that resolves to true if the update was successful, false otherwise
   */
  static async updateAllRolePermissions(permissionMatrix: Record<string, string[]>): Promise<boolean> {
    try {
      // Update each role's permissions
      for (const [roleName, permissions] of Object.entries(permissionMatrix)) {
        const success = await this.updateRolePermissions(roleName, permissions);
        if (!success) {
          console.error(`Failed to update permissions for role ${roleName}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating all role permissions:', error);
      return false;
    }
  }
}


