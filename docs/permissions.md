# Permission System Documentation

## Overview

The project uses a simplified role-based access control system. Each user has a single role assigned to them, and permissions are determined based on that role.

## Roles

The system supports the following roles:

- **admin**: Full access to all features
- **manager**: Can manage projects, tasks, and team members
- **user**: Regular user with limited permissions
- **guest**: View-only access to projects

## Permissions

Permissions are defined in code rather than in the database. This makes the system more maintainable and easier to understand.

The complete list of permissions is defined in `lib/permissions/unified-permission-system.ts`.

### Key Permission Categories

- **User Management**: Permissions related to managing users
- **Project Management**: Permissions related to managing projects
- **Team Management**: Permissions related to managing team members
- **Task Management**: Permissions related to managing tasks
- **Attendance**: Permissions related to attendance tracking

## Permission Matrix

The permission matrix maps roles to permissions. This is defined in code in `lib/permissions/unified-permission-system.ts`.

For example:
- Admins have all permissions
- Managers can create and manage projects, but cannot access system settings
- Users can create and manage tasks, but cannot create projects
- Guests can only view projects

## How to Check Permissions

### Server-side

#### Basic Permission Check

```typescript
import { UnifiedPermissionSystem, PERMISSIONS } from "@/lib/permissions/unified-permission-system";

// Check if a user has a specific permission
const hasPermission = UnifiedPermissionSystem.hasPermission(userRole, PERMISSIONS.PROJECT_CREATION);
```

#### API Middleware

The API middleware provides functions for checking permissions in API routes:

```typescript
import { withAuth, withPermission, withResourcePermission, withOwnerOrAdmin } from "@/lib/api-middleware";

// Basic authentication middleware
export const GET = withAuth(async (req, context, session) => {
  // Handler implementation
});

// Permission-based middleware
export const POST = withPermission(
  PERMISSIONS.PROJECT_CREATION,
  async (req, context, session) => {
    // Handler implementation
  }
);

// Resource-specific permission middleware
export const PATCH = withResourcePermission(
  "projectId",
  checkProjectPermission,
  async (req, context, session, projectId) => {
    // Handler implementation
  },
  "update"
);

// Owner or admin middleware
export const DELETE = withOwnerOrAdmin(
  "resourceId",
  async (resourceId) => {
    // Fetch the resource and return { userId: "owner123" } or null
    return await getResourceById(resourceId);
  },
  async (req, context, session, resourceId) => {
    // Handler implementation
  }
);
```

### Client-side

```typescript
import { usePermission } from "@/hooks/use-permission";

// In a React component
function MyComponent() {
  const canCreateProject = usePermission(PERMISSIONS.PROJECT_CREATION);

  return (
    <div>
      {canCreateProject && <button>Create Project</button>}
    </div>
  );
}
```

### Component Guards

```typescript
import { PermissionGuard } from "@/components/permission-guard";
import { PERMISSIONS } from "@/lib/permissions/unified-permission-system";

function MyComponent() {
  return (
    <PermissionGuard permission={PERMISSIONS.PROJECT_CREATION}>
      <button>Create Project</button>
    </PermissionGuard>
  );
}
```

## Resource-Specific Permission Checkers

Resource-specific permission checkers are functions that check if a user has permission to perform an action on a specific resource:

- `checkProjectPermission` in `lib/permissions/project-permissions.ts`
- `checkTaskPermission` in `lib/permissions/task-permissions.ts`
- `checkTeamPermission` in `lib/permissions/team-permissions.ts`

These functions return an object with `hasPermission`, `error`, and the resource itself.

## Adding New Permissions

To add a new permission:

1. Add the permission to the `PERMISSIONS` object in `lib/permissions/unified-permission-system.ts`
2. Update the `PERMISSION_MATRIX` to assign the permission to the appropriate roles
3. Use the permission in your code

## Benefits of the Unified Permission System

1. **Consistency**: All permission checks use the same underlying system
2. **Reusability**: Common permission checking patterns are encapsulated in reusable functions
3. **Maintainability**: Permission logic is centralized and easier to update
4. **Security**: Reduced risk of missing permission checks
5. **Error Handling**: Consistent error responses across the application

## Migrating from the Old System

The old system used a complex role-permission system with database tables. The new system uses a simplified approach with roles and permissions defined in code.

The migration process involved:
1. Creating a centralized permission system in code
2. Updating all permission checks to use the new system
3. Removing the complex role-permission tables from the database
4. Keeping the `role` field in the `User` model
