import prisma from '@/lib/prisma';

// Fallback permission matrix for when database is not available
const FALLBACK_PERMISSION_MATRIX = {
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
   * Check if a user has a specific permission
   * This checks both direct user permissions and role-based permissions
   */
  static async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    try {
      // First check if the user has a direct permission override
      const userPermission = await prisma.userPermission.findFirst({
        where: {
          userId,
          permission: {
            name: permissionName,
          },
        },
      });

      // If the user has a direct permission setting, use that
      if (userPermission) {
        return userPermission.granted;
      }

      // Otherwise, check if any of the user's roles have the permission
      const hasRolePermission = await prisma.userRole.findFirst({
        where: {
          userId,
          role: {
            rolePermissions: {
              some: {
                permission: {
                  name: permissionName,
                },
              },
            },
          },
        },
      });

      return !!hasRolePermission;
    } catch (error) {
      console.error(`Error checking permission ${permissionName} for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Fallback method for checking permissions when we only have the role name
   * This is used for backward compatibility and middleware
   */
  static hasPermissionByRole(role: string, permission: string): boolean {
    // If role doesn't exist, return false
    if (!FALLBACK_PERMISSION_MATRIX[role as keyof typeof FALLBACK_PERMISSION_MATRIX]) {
      return false;
    }

    // Check if the role has the permission
    return FALLBACK_PERMISSION_MATRIX[role as keyof typeof FALLBACK_PERMISSION_MATRIX].includes(permission);
  }

  /**
   * Get all permissions for a user
   * This includes both direct user permissions and role-based permissions
   */
  static async getPermissionsForUser(userId: string): Promise<string[]> {
    try {
      // Get all permissions granted to the user's roles
      const rolePermissions = await prisma.rolePermission.findMany({
        where: {
          role: {
            userRoles: {
              some: {
                userId,
              },
            },
          },
        },
        include: {
          permission: true,
        },
      });

      // Get direct user permissions
      const userPermissions = await prisma.userPermission.findMany({
        where: {
          userId,
        },
        include: {
          permission: true,
        },
      });

      // Combine permissions, giving priority to direct user permissions
      const permissionMap = new Map<string, boolean>();

      // First add role permissions
      for (const rp of rolePermissions) {
        permissionMap.set(rp.permission.name, true);
      }

      // Then override with user permissions
      for (const up of userPermissions) {
        permissionMap.set(up.permission.name, up.granted);
      }

      // Return only granted permissions
      return Array.from(permissionMap.entries())
        .filter(([_, granted]) => granted)
        .map(([name, _]) => name);
    } catch (error) {
      console.error(`Error getting permissions for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Fallback method for getting permissions by role
   */
  static getPermissionsForRole(role: string): string[] {
    return FALLBACK_PERMISSION_MATRIX[role as keyof typeof FALLBACK_PERMISSION_MATRIX] || [];
  }

  /**
   * Get all roles for a user
   */
  static async getRolesForUser(userId: string): Promise<string[]> {
    try {
      const userRoles = await prisma.userRole.findMany({
        where: {
          userId,
        },
        include: {
          role: true,
        },
      });

      return userRoles.map(ur => ur.role.name);
    } catch (error) {
      console.error(`Error getting roles for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get all available permissions
   */
  static async getAllPermissions(): Promise<any[]> {
    try {
      return await prisma.permission.findMany({
        orderBy: {
          category: 'asc',
        },
      });
    } catch (error) {
      console.error('Error getting all permissions:', error);
      return [];
    }
  }

  /**
   * Fallback method for getting all permissions
   */
  static getAllPermissionsFallback(): string[] {
    // Combine all permissions from all roles and remove duplicates
    const allPermissions = Object.values(FALLBACK_PERMISSION_MATRIX).flat();
    return [...new Set(allPermissions)];
  }

  /**
   * Get all available roles
   */
  static async getAllRoles(): Promise<any[]> {
    try {
      return await prisma.role.findMany();
    } catch (error) {
      console.error('Error getting all roles:', error);
      return [];
    }
  }

  /**
   * Get all permissions for a role from the database
   */
  static async getPermissionsForRoleFromDB(roleName: string): Promise<string[]> {
    try {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: {
          role: {
            name: roleName,
          },
        },
        include: {
          permission: true,
        },
      });

      return rolePermissions.map(rp => rp.permission.name);
    } catch (error) {
      console.error(`Error getting permissions for role ${roleName}:`, error);
      return [];
    }
  }

  /**
   * Get the permission matrix for all roles
   */
  static async getPermissionMatrix(): Promise<Record<string, string[]>> {
    try {
      const roles = await prisma.role.findMany();
      const matrix: Record<string, string[]> = {};

      for (const role of roles) {
        const permissions = await this.getPermissionsForRoleFromDB(role.name);
        matrix[role.name] = permissions;
      }

      return matrix;
    } catch (error) {
      console.error('Error getting permission matrix:', error);
      return FALLBACK_PERMISSION_MATRIX;
    }
  }

  /**
   * Get all roles that have a specific permission
   */
  static async getRolesWithPermission(permissionName: string): Promise<string[]> {
    try {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: {
          permission: {
            name: permissionName,
          },
        },
        include: {
          role: true,
        },
      });

      return rolePermissions.map(rp => rp.role.name);
    } catch (error) {
      console.error(`Error getting roles with permission ${permissionName}:`, error);
      return [];
    }
  }

  /**
   * Fallback method for getting roles with a specific permission
   */
  static getRolesWithPermissionFallback(permission: string): string[] {
    return Object.entries(FALLBACK_PERMISSION_MATRIX)
      .filter(([_, permissions]) => permissions.includes(permission))
      .map(([role]) => role);
  }

  /**
   * Update permissions for a role
   */
  static async updateRolePermissions(roleName: string, permissionNames: string[]): Promise<boolean> {
    try {
      const role = await prisma.role.findUnique({
        where: {
          name: roleName,
        },
      });

      if (!role) {
        throw new Error(`Role not found: ${roleName}`);
      }

      // Get all permissions
      const permissions = await prisma.permission.findMany({
        where: {
          name: {
            in: permissionNames,
          },
        },
      });

      // Delete existing role permissions
      await prisma.rolePermission.deleteMany({
        where: {
          roleId: role.id,
        },
      });

      // Create new role permissions
      for (const permission of permissions) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }

      return true;
    } catch (error) {
      console.error(`Error updating permissions for role ${roleName}:`, error);
      return false;
    }
  }

  /**
   * Create a new role
   */
  static async createRole(name: string, description: string): Promise<any> {
    try {
      return await prisma.role.create({
        data: {
          name,
          description,
        },
      });
    } catch (error) {
      console.error(`Error creating role ${name}:`, error);
      throw error;
    }
  }

  /**
   * Create a new permission
   */
  static async createPermission(name: string, description: string, category: string): Promise<any> {
    try {
      return await prisma.permission.create({
        data: {
          name,
          description,
          category,
        },
      });
    } catch (error) {
      console.error(`Error creating permission ${name}:`, error);
      throw error;
    }
  }

  /**
   * Assign a role to a user
   */
  static async assignRoleToUser(userId: string, roleName: string): Promise<boolean> {
    try {
      const role = await prisma.role.findUnique({
        where: {
          name: roleName,
        },
      });

      if (!role) {
        throw new Error(`Role not found: ${roleName}`);
      }

      // Check if the user already has this role
      const existingUserRole = await prisma.userRole.findFirst({
        where: {
          userId,
          roleId: role.id,
        },
      });

      if (!existingUserRole) {
        await prisma.userRole.create({
          data: {
            userId,
            roleId: role.id,
          },
        });
      }

      return true;
    } catch (error) {
      console.error(`Error assigning role ${roleName} to user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Remove a role from a user
   */
  static async removeRoleFromUser(userId: string, roleName: string): Promise<boolean> {
    try {
      const role = await prisma.role.findUnique({
        where: {
          name: roleName,
        },
      });

      if (!role) {
        throw new Error(`Role not found: ${roleName}`);
      }

      await prisma.userRole.deleteMany({
        where: {
          userId,
          roleId: role.id,
        },
      });

      return true;
    } catch (error) {
      console.error(`Error removing role ${roleName} from user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Grant a direct permission to a user
   */
  static async grantPermissionToUser(userId: string, permissionName: string): Promise<boolean> {
    try {
      const permission = await prisma.permission.findUnique({
        where: {
          name: permissionName,
        },
      });

      if (!permission) {
        throw new Error(`Permission not found: ${permissionName}`);
      }

      // Upsert the user permission
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId,
            permissionId: permission.id,
          },
        },
        update: {
          granted: true,
        },
        create: {
          userId,
          permissionId: permission.id,
          granted: true,
        },
      });

      return true;
    } catch (error) {
      console.error(`Error granting permission ${permissionName} to user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Deny a direct permission to a user
   */
  static async denyPermissionToUser(userId: string, permissionName: string): Promise<boolean> {
    try {
      const permission = await prisma.permission.findUnique({
        where: {
          name: permissionName,
        },
      });

      if (!permission) {
        throw new Error(`Permission not found: ${permissionName}`);
      }

      // Upsert the user permission
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId,
            permissionId: permission.id,
          },
        },
        update: {
          granted: false,
        },
        create: {
          userId,
          permissionId: permission.id,
          granted: false,
        },
      });

      return true;
    } catch (error) {
      console.error(`Error denying permission ${permissionName} to user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Remove a direct permission from a user
   */
  static async removePermissionFromUser(userId: string, permissionName: string): Promise<boolean> {
    try {
      const permission = await prisma.permission.findUnique({
        where: {
          name: permissionName,
        },
      });

      if (!permission) {
        throw new Error(`Permission not found: ${permissionName}`);
      }

      await prisma.userPermission.deleteMany({
        where: {
          userId,
          permissionId: permission.id,
        },
      });

      return true;
    } catch (error) {
      console.error(`Error removing permission ${permissionName} from user ${userId}:`, error);
      return false;
    }
  }
}
