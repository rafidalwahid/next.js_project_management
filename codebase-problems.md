# Project Management Codebase Problems

This document provides a comprehensive list of problems identified in the Project Management codebase, including partial implementations, missing features, technical errors, logical issues, and redundant code.

## 1. Permission System Issues

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

### Completed Tasks (continued)

8. ✅ **Updated Additional API Routes**:
   - Updated attendance admin routes (`app/api/attendance/admin/records/route.ts`, `app/api/attendance/admin/correction-requests/route.ts`) to use permission-based checks
   - Updated attendance statistics routes (`app/api/attendance/today/late-count/route.ts`, `app/api/attendance/today/present-count/route.ts`) to use permission-based checks
   - Updated user documents routes (`app/api/users/[userId]/documents/route.ts`) to use permission-based checks
   - Updated task comments routes (`app/api/tasks/[taskId]/comments/route.ts`) to use permission-based checks

9. ✅ **Updated API Middleware**:
   - Updated `lib/api-middleware.ts` to use the unified permission service
   - Added new `withOwnerOrPermission` middleware to replace the role-based `withOwnerOrAdmin` middleware
   - Made `withOwnerOrAdmin` a wrapper around `withOwnerOrPermission` for backward compatibility

### Completed Tasks (continued)

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

### Remaining Tasks

1. **Update Additional UI Components**:
   - Continue updating UI components to use the `useHasPermission` hook or `PermissionGuard` component
   - Update any remaining components that still rely on role checks

2. **Testing and Validation**:
   - Test the permission system with different user roles
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
