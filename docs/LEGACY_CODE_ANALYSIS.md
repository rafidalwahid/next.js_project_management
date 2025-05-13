# Legacy and Unused Code Analysis

This document identifies code in the project that is deprecated, unused, or represents an older system that should be cleaned up.

## Deprecated API Functions and Methods

### 1. Permission Service Methods

Several methods in `lib/permissions/client-permission-service.ts` are marked as deprecated:

```typescript
// Deprecated - Use hasPermissionById instead
static async hasPermission(role: string, permission: string): Promise<boolean>

// Deprecated - Use hasPermissionByIdSync instead
static hasPermissionSync(role: string, permission: string): boolean

// Deprecated - Use getPermissionsForUser instead
static async getPermissionsForRole(role: string): Promise<string[]>

// Deprecated - Use getPermissionsForUserSync instead
static getPermissionsForRoleSync(role: string): string[]

// Deprecated - Use checkOwnerOrPermission instead
static async checkOwnerOrPermissionWithRole(
  userId: string | undefined,
  userRole: string | undefined,
  resourceUserId: string,
  requiredPermission: string
): Promise<{ hasPermission: boolean; error?: string }>
```

### 2. Edge Permission Service Methods

Methods in `lib/permissions/edge-permission-service.ts` are also marked as deprecated:

```typescript
// Deprecated - Use hasPermissionForToken instead
static hasPermission(role: string, permission: string): boolean

// Deprecated - Use getPermissionsForToken instead
static getPermissionsForRole(role: string): string[]
```

### 3. API Middleware Functions

In `lib/api-middleware.ts`, there's a deprecated middleware function:

```typescript
// Deprecated - Use withOwnerOrPermission instead
export function withOwnerOrAdmin(
  resourceIdParam: string,
  resourceFetcher: (resourceId: string) => Promise<{ userId: string } | null>,
  handler: (req: NextRequest, context: any, session: Session, resourceId: string) => Promise<NextResponse>,
  adminOnly: boolean = false
)
```

## Deprecated Hooks

### 1. Permission Hooks

In `hooks/use-permission.ts`, there's a deprecated hook:

```typescript
// Deprecated - Use useHasPermission instead
export function usePermission(permission: string)
```

### 2. Team Hooks

The documentation mentions that `hooks/use-team.ts` is deprecated and should be replaced with `hooks/use-team-management.ts`, but the file doesn't seem to exist in the current codebase.

## Legacy Compatibility Functions

In `lib/utils/date.ts`, there are legacy compatibility functions:

```typescript
// Deprecated - Use formatDate instead
export function formatDateLegacy(
  date: string | null,
  formatString = "MMM d, yyyy"
): string
```

## Duplicate API Routes

According to the documentation, the following API routes have duplicate functionality:

1. `/api/register/route.ts` duplicates functionality in `/api/users/route.ts`
2. `/api/upload/route.ts` duplicates functionality in `/api/users/[userId]/documents/route.ts`
3. `/api/project-statuses/route.ts` duplicates functionality in `/api/projects/[projectId]/statuses/route.ts`

However, these files don't seem to exist in the current codebase, suggesting they may have already been removed.

## Unused Configuration

### 1. Next.js Configuration

In `next.config.mjs`, there are potentially unnecessary configurations:

```javascript
// This might not be necessary and could impact build performance
config.cache = true;

// Reference to a file that may not exist or be necessary
try {
  userConfig = await import('./v0-user-next.config.mjs')
} catch (e) {
  // ...
}
```

### 2. TypeScript Configuration

The TypeScript configuration in `next.config.mjs` is set to ignore build errors:

```javascript
typescript: {
  // Set to false once you've fixed all TypeScript errors
  ignoreBuildErrors: true
},
```

This is a temporary workaround and should be addressed by fixing the TypeScript errors.

## Duplicate Files

### 1. Mobile Hook Duplicates

There are two versions of the mobile hook:
- `hooks/use-mobile.ts`
- `hooks/use-mobile.tsx`

One of these should be removed.

### 2. Placeholder Images

There are multiple placeholder images that might be redundant:
- `public/placeholder-logo.png`
- `public/placeholder.jpg`
- `public/placeholder-user.jpg`

## Husky Configuration

The Husky configuration contains a deprecated warning:

```
echo "husky - DEPRECATED

Please remove the following two lines from $0:

#!/usr/bin/env sh
. \"\$(dirname -- \"\$0\")/_/husky.sh\"

They WILL FAIL in v10.0.0
"
```

## Recommended Cleanup Actions

1. **Remove Deprecated Methods**: Replace all calls to deprecated methods with their recommended alternatives.

2. **Consolidate Duplicate Files**: Remove duplicate files and ensure all imports reference the correct files.

3. **Update Husky Configuration**: Update the Husky configuration to avoid future compatibility issues.

4. **Clean Up Next.js Configuration**: Remove unnecessary configuration options and update TypeScript settings.

5. **Remove Unused Placeholder Images**: Keep only the necessary placeholder images.

6. **Fix TypeScript Errors**: Address TypeScript errors to enable strict type checking.

7. **Update API Routes**: Ensure all API routes follow consistent patterns and remove any duplicates.

## Implementation Plan

1. **Audit Usage of Deprecated Methods**: Search for all instances where deprecated methods are used and replace them.

2. **Remove Duplicate Files**: Identify which version of duplicate files is being used and remove the unused ones.

3. **Update Configuration**: Clean up configuration files to remove unnecessary settings.

4. **Enable TypeScript Strict Mode**: Gradually fix TypeScript errors to enable strict type checking.

By systematically addressing these issues, you can significantly improve code quality, reduce technical debt, and make the codebase more maintainable.
