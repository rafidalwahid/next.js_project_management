# Project Management Codebase Problems

This document provides a comprehensive list of problems identified in the Project Management codebase, including partial implementations, missing features, technical errors, logical issues, and redundant code.

## 1. Permission System Issues

### Overview for Junior Developers

The permission system in our application has undergone a major transformation from a static, hardcoded system to a dynamic, database-driven system. Here's what you need to understand:

#### Old System (Before)
- Roles (admin, manager, user) were hardcoded in the application code
- Permissions were statically assigned to roles in code
- To change which permissions a role had, you needed to modify the code
- The permission matrix was defined in a file called `unified-permission-system.ts`
- Code used direct role checks like `if (user.role === "admin")`

#### New System (Now)
- Roles are stored in the database and can be created/modified through the UI
- Permissions are stored in the database and can be assigned to roles through the UI
- You can change which permissions a role has without touching any code
- The permission matrix is stored in the database, not in code
- Code uses permission checks like `if (await hasPermissionById(userId, "user_management"))`

#### Key Benefits
1. **Flexibility**: Create custom roles with specific permission sets
2. **Maintainability**: No code changes needed to adjust permissions
3. **User Experience**: Manage everything through the UI
4. **Security**: Permission checks are consistent and centralized

#### How It Works
1. Users have a role (stored in the User table)
2. Roles have many permissions (through RolePermission join table)
3. When checking if a user can do something, we:
   - Look up their role
   - Check if that role has the required permission
   - Allow or deny the action accordingly

### Completed Tasks

1. ✅ **Consolidated Permission Services**:
   - Created a single unified `PermissionService` in `lib/permissions/unified-permission-service.ts` that exclusively uses database models
   - Implemented caching mechanisms to improve performance for frequently checked permissions
   - Removed all old permission service files (`permission-service.ts`, `db-permission-service.ts`, `edge-permission-service.ts`, `edge-db-permission-service.ts`, `client-db-permission-service.ts`)
   - Updated `client-permission-service.ts` to work with the new system

2. ✅ **Removed Hardcoded Permission Constants**:
   - Deleted the `permission-constants.ts` file
   - Created a database seeder (`scripts/seed-permissions.js`) that populates the Permission table with all required permissions
   - Updated API routes to use database queries instead of constants

3. ✅ **Updated API Routes**:
   - Created new API endpoints for managing roles and permissions (`/api/roles/create`, `/api/roles/update-permissions`, `/api/roles/check-permission`)
   - Updated existing API routes to use the new unified permission service
   - Implemented permission cache invalidation when permissions are updated

4. ✅ **Created Migration Path**:
   - Created a database seeder that preserves existing role assignments while adding the new permission system
   - Added scripts to package.json for running the seeder and cleanup

5. ✅ **Replaced Role-Based Checks in Key Components**:
   - Updated project membership routes (`app/api/projects/[projectId]/membership/route.ts` and `app/api/team-management/membership/route.ts`) to use permission-based checks
   - Updated user management routes (`app/api/users/[userId]/route.ts`) to use permission-based checks for GET, PATCH, and DELETE methods
   - Updated attendance routes (`app/api/users/[userId]/attendance/route.ts`) to use permission-based checks
   - Updated team management routes (`app/api/team-management/route.ts`) to use permission-based checks
   - Updated middleware (`middleware.ts`) to use the unified permission service and string literals instead of constants

6. ✅ **Updated Client-Side Permission Service**:
   - Replaced the `checkOwnerOrAdmin` method with permission-based `checkOwnerOrPermission` and `checkOwnerOrPermissionSync` methods
   - These methods provide a more flexible and permission-based approach to access control

7. ✅ **Updated Permission Management UI**:
   - Updated `app/team/permissions/page.tsx` to work with the database-backed system
   - Removed hardcoded constants and updated to use direct string literals
   - Modified the role badge function to use dynamic role data from the API

8. ✅ **Updated Additional API Routes**:
   - Updated attendance admin routes (`app/api/attendance/admin/records/route.ts`, `app/api/attendance/admin/correction-requests/route.ts`) to use permission-based checks
   - Updated attendance statistics routes (`app/api/attendance/today/late-count/route.ts`, `app/api/attendance/today/present-count/route.ts`) to use permission-based checks
   - Updated user documents routes (`app/api/users/[userId]/documents/route.ts`) to use permission-based checks
   - Updated task comments routes (`app/api/tasks/[taskId]/comments/route.ts`) to use permission-based checks

9. ✅ **Updated API Middleware**:
   - Updated `lib/api-middleware.ts` to use the unified permission service
   - Added new `withOwnerOrPermission` middleware to replace the role-based `withOwnerOrAdmin` middleware
   - Made `withOwnerOrAdmin` a wrapper around `withOwnerOrPermission` for backward compatibility

10. ✅ **Updated Navigation Components**:
    - Updated `components/team/team-nav-item.tsx` to use string literals instead of permission constants
    - Updated `components/auth-guard.tsx` to use the unified permission service and `hasPermissionSync` method
    - Added comments to indicate that role-based checks are deprecated in favor of permission-based checks

11. ✅ **Fixed Middleware Permission System**:
    - Created an Edge-compatible permission service (`lib/permissions/edge-permission-service.ts`) for middleware
    - Updated middleware to use the Edge-compatible permission service instead of the database-backed service
    - Fixed runtime errors related to Prisma in Edge runtime environments
    - Improved middleware configuration to better handle public paths

12. ✅ **Completed Permission Management System**:
    - Implemented the missing `updateAllRolePermissions` method in the PermissionService
    - Ensured the role management and permissions pages properly use the dynamic permission system
    - Fixed the ability to change permissions from the permissions page
    - Made the permissions page and edit permission dialog fully responsive
    - Fixed import errors by updating all references to the old permission service

13. ✅ **Transitioned to User ID-Based Permission Checks**:
    - Updated `PermissionService` to prioritize user ID-based permission checks with `hasPermissionById` method
    - Deprecated role-based methods in favor of user ID-based methods
    - Removed special case handling for "admin" role
    - Added proper caching for user-based permissions

14. ✅ **Enhanced Client Permission Service**:
    - Added new user ID-based methods (`hasPermissionById`, `hasPermissionByIdSync`, `getPermissionsForUser`)
    - Deprecated role-based methods with clear documentation
    - Updated owner/permission check methods to use user IDs
    - Improved caching for better performance

15. ✅ **Enhanced Edge Permission Service**:
    - Added token-based permission checks with `hasPermissionForToken` method
    - Deprecated role-based methods with clear documentation
    - Improved error handling and security

16. ✅ **Updated UI Components to Use Permission-Based Checks**:
    - Updated `RoleGuard` to use `PermissionGuard` internally
    - Added `withPermission` HOC as an alternative to `withRole`
    - Updated `AuthGuard` to prioritize permission-based checks
    - Updated profile page to use permission-based checks for edit access
    - Updated team page to use permission-based checks for adding members

17. ✅ **Updated API Routes to Use User ID-Based Permission Checks**:
    - Updated all API routes to use `hasPermissionById` instead of `hasPermission`
    - Replaced role-based checks with permission-based checks in task routes
    - Updated role management routes to use permission-based checks
    - Improved security by removing direct role checks

18. ✅ **Updated UI Components with Permission-Based Displays**:
    - Updated profile components to display roles consistently
    - Updated team components to use permission-based role selection
    - Improved user experience with clearer permission-based UI

19. ✅ **Updated Documentation**:
    - Updated development guide to use permission-based examples
    - Updated authentication documentation to show permission-based UI rendering
    - Provided clear examples of both hook-based and component-based permission checks

### How to Use the New Permission System (For Junior Developers)

#### Checking Permissions in React Components
```tsx
// Use the useHasPermission hook
function MyComponent() {
  const { hasPermission } = useHasPermission('user_management');

  if (hasPermission) {
    return <div>User has permission to manage users</div>;
  }
  return null;
}

// Or use the PermissionGuard component
function MyOtherComponent() {
  return (
    <PermissionGuard permission="user_management">
      <div>Only shown to users with user_management permission</div>
    </PermissionGuard>
  );
}
```

#### Checking Permissions in API Routes
```typescript
// In an API route
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has permission
  const hasPermission = await PermissionService.hasPermissionById(
    session.user.id,
    "user_management"
  );

  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Continue with the API logic...
}
```

#### Managing Permissions Through the UI
1. Navigate to `/team/permissions`
2. You'll see a matrix of roles and permissions
3. Check/uncheck boxes to grant/revoke permissions for each role
4. Changes are saved automatically

#### Creating New Roles
1. Navigate to `/team/roles`
2. Click "Add New Role"
3. Enter a name and description
4. The new role will appear in the permissions matrix

### Remaining Tasks

1. **Testing and Validation**:
   - Test the permission system with different user roles and permissions
   - Verify that permissions are correctly enforced across the application
   - Create test cases for each permission to ensure proper access control

## 2. Task Management Issues

1. **Inconsistent Task Completion Logic**: Two different approaches for task completion exist - the `completed` boolean field and the `status.isCompletedStatus` property, causing potential inconsistencies.

2. **Subtask Implementation Limitations**: The subtask implementation supports nesting but lacks robust ordering and drag-and-drop reordering between different parent tasks.

3. **Missing Task Comments and Attachments**: While the UI components for task comments and attachments exist, the full implementation appears incomplete.

4. **Inconsistent Task Status Handling**: Some components use the `completed` field while others use `status.isCompletedStatus`, leading to potential inconsistencies in task status display.

## 3. Attendance System Issues

1. **Incomplete Auto-Checkout Implementation**: While the auto-checkout functionality exists in the backend, the UI for configuring auto-checkout settings is incomplete.

2. **Offline Sync Limitations**: The background sync for offline attendance actions has error handling issues and lacks proper retry mechanisms.

3. **Geolocation Error Handling**: The geolocation functionality doesn't properly handle cases where users deny location permissions or when the browser doesn't support geolocation.

4. **Missing Admin Dashboard Features**: The attendance admin dashboard lacks comprehensive reporting and correction request approval workflows.

## 4. Dashboard Implementation Issues

1. **Incomplete Role-Specific Dashboards**: While the codebase has separate components for admin, manager, and user dashboards, they don't fully implement the distinct layouts and features described in the requirements.

2. **Missing Dashboard Analytics**: The analytics tabs in the dashboards contain placeholder content rather than actual data visualization.

3. ✅ **Fixed Dashboard Permission Integration**:
   - Updated dashboard statistics API to use permission-based filtering instead of role-based filtering
   - Modified the dashboard components to properly use the dynamic permission system
   - Ensured consistent permission checks between frontend and backend

## 5. Service Worker and Offline Functionality Issues

1. **Limited Offline Capabilities**: The service worker implementation focuses primarily on attendance features, with limited offline support for other parts of the application.

2. **Incomplete Background Sync**: The background sync implementation doesn't handle complex data synchronization scenarios or conflict resolution.

3. **Service Worker Registration Issues**: The service worker registration process lacks proper error recovery and update mechanisms.

4. **Missing Offline UI Indicators**: Many components don't properly indicate when the application is in offline mode.

## 6. Code Quality Issues

1. **ESLint and TypeScript Errors Ignored**: The `next.config.mjs` file has `ignoreDuringBuilds: true` for both ESLint and TypeScript, bypassing important code quality checks.

2. **Debug Console Logs**: Many components contain `console.log` statements that should be removed in production code.

3. **Deprecated API Routes**: Some API routes are marked as deprecated (e.g., `/api/projects/[projectId]/team/route.ts`) but still exist in the codebase.

4. **Inconsistent Error Handling**: Error handling varies across components, with some providing detailed error messages and others using generic messages.

## 7. Database and Schema Issues

1. **Redundant Database Models**: The schema contains unused or redundant models that should be simplified according to user preferences.

2. **Inconsistent Schema Documentation**: The schema documentation in `docs/database.md` doesn't match the actual schema in `prisma/schema.prisma`.

3. **Missing Database Indexes**: Some frequently queried fields lack database indexes, potentially impacting performance.

4. **Conflicting Seed Files**: Multiple seed files exist in different locations, contradicting the user's preference for a single unified seed file.

## 8. UI/UX Issues

1. **Inconsistent UI Components**: Some UI components don't follow the user's preferences for minimalist clean design with proper margin and padding.

2. ✅ **Improved Responsive Design**:
   - Made the permissions page fully responsive with sticky headers and proper mobile layout
   - Made the edit permission dialog responsive with proper scrolling and button layout
   - Improved the add permission and add role dialogs for better mobile experience

3. **Incomplete Breadcrumb Implementation**: Breadcrumbs don't consistently display usernames and project titles instead of IDs.

4. **Avatar Styling Inconsistencies**: Avatar components don't consistently have the black circular border with username displayed to the right.

## 9. Authentication Issues

1. **Incomplete Social Login Options**: While NextAuth.js is configured, the social login options (Google, Facebook) aren't fully implemented.

2. **Missing "Forgot Password" Functionality**: The login form lacks the "forgot password" link as specified in requirements.

3. **Inconsistent Branding**: Some components still use "ProjectPro" instead of "Project Management" as preferred by the user.

## 10. Technical and Logical Errors

1. **Race Conditions in Data Fetching**: Some components fetch data in useEffect hooks without proper loading states, potentially causing race conditions.

2. **Memory Leaks**: Some event listeners and subscriptions aren't properly cleaned up in useEffect hooks.

3. **Inconsistent Date Handling**: Date formatting and calculations are inconsistent across components.

4. **Missing Error Boundaries**: The application lacks proper error boundaries to prevent the entire UI from crashing when components fail.

## 11. Missing Features

1. **Incomplete Team Management**: The functionality to add and delete team members for projects is partially implemented.

2. **Missing Project Filtering**: The ability to filter projects by team members is not fully implemented.

3. **Incomplete Due Date Display**: The feature to show due dates as "X days overdue" or "X days remaining" is inconsistently implemented.

4. **Missing Profile Management**: The modern profile page with full CRUD operations for additional fields is incomplete.

5. **Incomplete Kanban View**: The Kanban view with horizontal scrolling is implemented but lacks some required features.
