# Centralized Permission System

This document describes the centralized permission system implemented in the Project Management application.

## Overview

The permission system provides a unified way to check permissions across the application. It handles common permission checking patterns and provides consistent error responses.

## Components

### 1. Permission Service

The `PermissionService` class in `lib/permissions/permission-service.ts` provides methods for checking permissions:

```typescript
import { PermissionService } from "@/lib/permissions/permission-service";

// Check if a role has a permission
const hasPermission = PermissionService.hasPermission("admin", "project_creation");

// Check if a user has a permission
const hasUserPermission = await PermissionService.hasPermissionById("user123", "project_creation");

// Get all permissions for a role
const permissions = PermissionService.getPermissionsForRole("admin");

// Check if a user is the owner of a resource or has admin privileges
const { hasPermission, error } = PermissionService.checkOwnerOrAdmin(session, resourceUserId);
```

### 2. API Middleware

The API middleware in `lib/api-middleware.ts` provides functions for checking permissions in API routes:

```typescript
import { withAuth, withPermission, withResourcePermission, withOwnerOrAdmin } from "@/lib/api-middleware";

// Basic authentication middleware
export const GET = withAuth(async (req, context, session) => {
  // Handler implementation
});

// Permission-based middleware
export const POST = withPermission(
  "project_creation",
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

### 3. Resource-Specific Permission Checkers

Resource-specific permission checkers are functions that check if a user has permission to perform an action on a specific resource:

- `checkProjectPermission` in `lib/permissions/project-permissions.ts`
- `checkTaskPermission` in `lib/permissions/task-permissions.ts`
- `checkTeamPermission` in `lib/permissions/team-permissions.ts`

These functions return an object with `hasPermission`, `error`, and the resource itself.

## Permission Matrix

The permission matrix in `lib/permissions/unified-permission-system.ts` defines which roles have which permissions:

```typescript
export const PERMISSION_MATRIX = {
  [ROLES.ADMIN]: [
    PERMISSIONS.USER_MANAGEMENT,
    PERMISSIONS.MANAGE_ROLES,
    // ...more permissions
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.PROJECT_CREATION,
    PERMISSIONS.PROJECT_MANAGEMENT,
    // ...more permissions
  ],
  [ROLES.USER]: [
    PERMISSIONS.TASK_CREATION,
    PERMISSIONS.TASK_MANAGEMENT,
    // ...more permissions
  ],
  [ROLES.GUEST]: [
    PERMISSIONS.VIEW_PROJECTS,
  ],
};
```

## Usage Examples

### API Route with Basic Authentication

```typescript
import { withAuth } from "@/lib/api-middleware";

export const GET = withAuth(async (req, context, session) => {
  // Implementation
  return NextResponse.json({ data: "Success" });
});
```

### API Route with Permission Check

```typescript
import { withPermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions/unified-permission-system";

export const POST = withPermission(
  PERMISSIONS.PROJECT_CREATION,
  async (req, context, session) => {
    // Implementation
    return NextResponse.json({ data: "Success" });
  }
);
```

### API Route with Resource-Specific Permission Check

```typescript
import { withResourcePermission } from "@/lib/api-middleware";
import { checkProjectPermission } from "@/lib/permissions/project-permissions";

export const PATCH = withResourcePermission(
  "projectId",
  checkProjectPermission,
  async (req, context, session, projectId) => {
    // Implementation
    return NextResponse.json({ data: "Success" });
  },
  "update"
);
```

### Client-Side Permission Check

```typescript
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions/unified-permission-system";

function MyComponent() {
  const canCreateProject = usePermission(PERMISSIONS.PROJECT_CREATION);

  return (
    <div>
      {canCreateProject && <button>Create Project</button>}
    </div>
  );
}
```

## Benefits

1. **Consistency**: All permission checks use the same underlying system
2. **Reusability**: Common permission checking patterns are encapsulated in reusable functions
3. **Maintainability**: Permission logic is centralized and easier to update
4. **Security**: Reduced risk of missing permission checks
5. **Error Handling**: Consistent error responses across the application
