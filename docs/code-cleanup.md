# Code Cleanup Documentation

This document tracks the cleanup of redundant, conflicting, and dead code in the project.

## Categories of Code to Clean Up

### 1. Deprecated Functions and Components

- [x] Document deprecated code
- [x] Remove deprecated permission service methods
- [x] Remove deprecated team hooks
- [x] Update role-based access control to permission-based

### 2. Duplicate Utility Functions

- [x] Document duplicate utilities
- [x] Consolidate date formatting utilities
- [ ] Remove duplicate API routes
- [ ] Standardize validation logic

### 3. Unused Imports and Variables

- [x] Document unused imports and variables
- [ ] Clean up unused NextRequest imports
- [ ] Remove unused variables in API routes

### 4. Commented Out Code and TODOs

- [x] Document commented out code and TODOs
- [ ] Remove commented out code
- [ ] Address or remove TODO comments

### 5. Redundant Configuration

- [x] Document redundant configuration
- [ ] Clean up Next.js configuration
- [ ] Streamline TypeScript configuration

## Detailed Cleanup Plan

### 1. Deprecated Functions and Components

#### Permission Service Methods

The following methods in `lib/permissions/client-permission-service.ts` are marked as deprecated:

```typescript
/**
 * @deprecated This method is no longer used and will be removed in a future version
 */
private static getBasicPermissionsForRole(role: string): string[] {
  console.warn('getBasicPermissionsForRole is deprecated and should not be used');
  return [];
}

/**
 * @deprecated This method is no longer used and will be removed in a future version
 */
private static getBasicPermissions(): Record<string, string> {
  console.warn('getBasicPermissions is deprecated and should not be used');
  return {};
}
```

All calls to `hasPermission(role, permission)` should be replaced with `hasPermissionById(userId, permission)`.

#### Team Hooks

The entire `hooks/use-team.ts` file is marked as deprecated:

```typescript
/**
 * @deprecated Use hooks from use-team-management.ts instead
 */
```

All imports from this file should be updated to use `use-team-management.ts` instead.

#### Role-Based Access Control

The `AuthGuard` component has a deprecated `allowedRoles` prop:

```typescript
// Role-based access is deprecated - we should use permission-based checks instead
// Log a warning if allowedRoles is still being used
if (allowedRoles && allowedRoles.length > 0) {
  console.warn(
    'Using allowedRoles in AuthGuard is deprecated. Use requiredPermission instead. ' +
    'For example, replace allowedRoles={["admin"]} with requiredPermission="user_management"'
  );
}
```

All uses of `allowedRoles` should be replaced with `requiredPermission`.

### 2. Duplicate Utility Functions

#### Date Formatting Utilities

✅ **REMOVED** - We've consolidated multiple date utility files into a single file:

1. `lib/utils/date-utils.ts` - REMOVED
2. `lib/utils/attendance-date-utils.ts` - REMOVED
3. `lib/utils/date-conversion.ts` - REMOVED
4. `lib/utils/time-utils.ts` - REMOVED

All functionality has been consolidated into a single `lib/utils/date.ts` file, and all imports have been updated to use this new file.

#### Duplicate API Routes

The following API routes have duplicate functionality:

1. `/api/register/route.ts` duplicates functionality in `/api/users/route.ts`
2. `/api/upload/route.ts` duplicates functionality in `/api/users/[userId]/documents/route.ts`
3. `/api/project-statuses/route.ts` duplicates functionality in `/api/projects/[projectId]/statuses/route.ts`

These duplicate routes should be removed and their functionality consolidated.

#### Duplicate Validation Logic

There is duplicate validation logic for:

1. Status name validation in multiple components and API routes
2. Email validation in multiple places

This validation logic should be standardized and centralized.

### 3. Unused Imports and Variables

#### Unused NextRequest Imports

Many API routes import `NextRequest` but don't use it after our TypeScript fixes. These imports should be removed.

#### Unused Variables in API Routes

Many route handlers have unused variables that were prefixed with underscores. These should be removed if they're truly unused.

### 4. Commented Out Code and TODOs

#### Commented Out Code

Several files contain commented out code blocks that should be removed.

#### TODO Comments

Several files contain TODO comments that should be addressed or removed.

### 5. Redundant Configuration

#### Next.js Configuration

`next.config.mjs` has commented out sections and redundant settings:

```javascript
// Consider removing this if you don't have specific webpack issues
// as it can negatively impact build performance
config.cache = true;
```

There's also a reference to a `v0-user-next.config.mjs` file that may be unnecessary.

#### TypeScript Configuration

`tsconfig.json` has settings that may be redundant or conflicting.
