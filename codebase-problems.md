# Project Management Codebase Problems

This document provides a comprehensive list of problems identified in the Project Management codebase, including partial implementations, missing features, technical errors, logical issues, and redundant code.

## 1. Permission System Issues

1. **Inconsistent Permission Implementation**: Multiple permission service implementations exist (`PermissionService`, `DbPermissionService`, `EdgePermissionService`, `ClientPermissionService`) with overlapping functionality but potentially inconsistent behavior.

2. **Role-Based vs Permission-Based Checks**: Many components still use role-based checks (`user.role === 'admin'`) instead of permission-based checks (`hasPermission('permission_name')`), contradicting the user's preference for permission-based access control.

3. **Missing Database-Backed Permission System**: The codebase references a database-backed permission system, but the schema in `prisma/schema.prisma` shows that the Role and Permission models have been removed, with a comment indicating they were "removed in favor of a simplified role system." But I have created that again, can you please check the database schema again?

4. **Hardcoded Permissions**: Permissions are still defined as constants in `lib/permissions/permission-constants.ts` rather than being fully database-driven.

### How to Fix Permission System Issues

To completely remove the old code and constant permissions in favor of a fully database-backed permission system:

1. **Consolidate Permission Services**:
   - Delete all existing permission service files: `permission-service.ts`, `db-permission-service.ts`, `edge-permission-service.ts`, and `client-permission-service.ts`
   - Create a single unified `PermissionService` that exclusively uses the database models
   - Implement caching mechanisms to improve performance for frequently checked permissions

2. **Replace Role-Based Checks**:
   - Search for all instances of role-based checks (`user.role === 'admin'`, etc.)
   - Replace them with permission-based checks (`hasPermission('permission_name')`)
   - Update middleware to use permission checks instead of role checks

3. **Remove Hardcoded Permission Constants**:
   - Delete the `permission-constants.ts` file
   - Create a database seeder that populates the Permission table with all required permissions
   - Update all references to the constants to use database queries instead

4. **Update API Routes and UI**:
   - Create CRUD API endpoints for managing roles and permissions
   - Update the permission management UI to work with the database-backed system
   - Implement a permission cache invalidation system when permissions are updated

5. **Migration Path**:
   - Create a migration script that transfers any existing role assignments to the new system
   - Add a fallback mechanism during the transition to prevent breaking existing functionality

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

3. **Inconsistent Dashboard Data**: The dashboard statistics API doesn't properly filter data based on user roles and permissions.

4. **Dashboard Integration with Permission System**: The dashboard doesn't properly integrate with the new dynamic role-permission system.

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

2. **Missing Responsive Design**: Some pages and modal dialogs aren't fully responsive as required.

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
