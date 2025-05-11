# TypeScript Error Fixes for Next.js 15

This document outlines the comprehensive approach to fixing TypeScript errors in the project when `ignoreBuildErrors: false` is set in `next.config.mjs`.

## 1. Date Handling

### Issues
- Components passing Date objects to functions expecting strings
- Inconsistent date formatting across the application
- Type errors when converting between string and Date types

### Solutions Implemented

#### 1.1 Enhanced Date Utility Functions
- Created type guard `isValidDate()` to safely check if a value is a valid Date
- Added `ensureDate()` utility to consistently convert any date-like value to a Date object
- Updated all date formatting functions to use these utilities
- Added proper return type annotations to all date utility functions

#### 1.2 Date Conversion Utilities
- Created `dateToApiFormat()` to standardize date conversion for API requests
- Added `prepareApiDates()` to process multiple date fields in objects for API requests
- Added `processApiDates()` to convert date strings from API responses to Date objects
- Created `formatForInputType()` to format dates for different HTML input types

### Usage Examples

```typescript
// Converting dates for API requests
const projectData = {
  title: "Project X",
  startDate: new Date(),
  endDate: new Date(2023, 11, 31)
};

// Convert dates to ISO strings for API
const apiData = prepareApiDates(projectData, ['startDate', 'endDate']);
await fetch('/api/projects', {
  method: 'POST',
  body: JSON.stringify(apiData)
});

// Processing dates from API responses
const response = await fetch('/api/projects/123');
const data = await response.json();
const project = processApiDates(data.project, ['startDate', 'endDate', 'createdAt', 'updatedAt']);

// Now project.startDate is a Date object, not a string
```

## 2. Interface Improvements

### Issues
- Project interface missing properties used in components (_count, createdBy, teamMembers)
- Inconsistent property types between interfaces and actual usage

### Solutions Implemented

#### 2.1 Updated Project Interface
- Enhanced `ProjectWithRelations` interface to include all required properties
- Added proper typing for nested objects and arrays
- Added optional properties for virtual/computed values

### Usage Example

```typescript
// The updated interface now properly supports this usage
function ProjectDetails({ project }: { project: ProjectWithRelations }) {
  // These properties are now properly typed
  const { createdBy, teamMembers, _count, tasks } = project;
  
  return (
    <div>
      <h1>{project.title}</h1>
      <p>Created by: {createdBy?.name}</p>
      <p>Team members: {_count?.teamMembers}</p>
      <p>Tasks: {_count?.tasks}</p>
    </div>
  );
}
```

## 3. Callback Type Definitions

### Issues
- Implicit 'any' types in callback parameters
- Inconsistent callback type definitions across components

### Solutions Implemented

#### 3.1 Callback Type Definitions
- Created comprehensive callback type definitions in `types/callbacks.ts`
- Defined specific types for different event handlers (form, input, mouse, etc.)
- Added generic callback types for reuse across the application

### Usage Example

```typescript
import { InputChangeEventHandler, FormEventHandler, IdSelectionHandler } from '@/types/callbacks';

function TaskForm() {
  // Properly typed event handlers
  const handleInputChange: InputChangeEventHandler = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    // Form submission logic
  };
  
  const handleUserSelect: IdSelectionHandler = (userId) => {
    setSelectedUser(userId);
  };
  
  // ...
}
```

## 4. NextAuth Provider Types

### Issues
- Type errors with NextAuth provider configurations
- Missing type definitions for custom properties

### Solutions Implemented

#### 4.1 Enhanced NextAuth Type Definitions
- Updated `next-auth.d.ts` to properly extend default types
- Added proper typing for User, Session, and JWT
- Created OAuth provider type definitions in `types/oauth.ts`

### Usage Example

```typescript
import { OAuthConfig } from '@/types/oauth';

// Properly typed OAuth provider
export const googleProvider: OAuthConfig<GoogleProfile> = {
  id: "google",
  name: "Google",
  type: "oauth",
  wellKnown: "https://accounts.google.com/.well-known/openid-configuration",
  authorization: { params: { scope: "openid email profile" } },
  idToken: true,
  checks: ["pkce", "state"],
  profile(profile) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
    };
  },
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
};
```

## 5. Service Worker Compatibility

### Issues
- TypeScript errors with the sync API
- Missing type definitions for service worker features

### Solutions Implemented

#### 5.1 Service Worker Type Definitions
- Created `types/service-worker.d.ts` with proper type definitions
- Added `ExtendedServiceWorkerRegistration` interface to support sync API
- Defined message types and structures for service worker communication

### Usage Example

```typescript
import { ServiceWorkerMessage } from '@/types/service-worker';

// Register for background sync with proper types
async function setupSync() {
  const registration = await navigator.serviceWorker.ready as ExtendedServiceWorkerRegistration;
  
  if ('sync' in registration) {
    await registration.sync.register('attendance-sync');
    console.log('Background sync registered!');
  }
}

// Listen for messages with proper typing
function listenForMessages() {
  navigator.serviceWorker.addEventListener('message', (event) => {
    const message = event.data as ServiceWorkerMessage;
    
    if (message.type === 'SYNC_COMPLETED') {
      console.log('Sync completed:', message.results);
    }
  });
}
```

## 6. App Router API Route Parameter Types

### Issues
- Type conflicts between Next.js App Router's parameter handling and TypeScript expectations
- Parameters in dynamic routes (`[userId]`, `[taskId]`, etc.) have inconsistent typing
- Next.js builds expect Promise-wrapped parameters in routes, but direct access works in development

### Solutions Implemented

#### 6.1 Custom Type Definitions
- Created `lib/api-route-types.ts` with proper type definitions for route handlers
- Added utility functions to safely handle parameters regardless of environment
- Implemented standardized types for both single and multi-parameter routes

#### 6.2 Parameter Access Pattern
- Replaced direct parameter access with paramResolver utility
- Consistent parameter extraction regardless of whether params are Promise-wrapped or not
- Standardized route handler signature across all API routes

### Usage Example

```typescript
// Import custom types for route handlers
import { ApiRouteHandlerOneParam, getParams } from "@/lib/api-route-types";

// Define route handler with proper typing
export const GET: ApiRouteHandlerOneParam<'userId'> = async (
  req, 
  { params }
) => {
  // Safely extract params (works if params is a Promise or direct object)
  const resolvedParams = await getParams(params);
  const { userId } = resolvedParams;
  
  // Rest of handler implementation
};
```

## Additional Recommendations

1. **Use Type Guards**: Create custom type guards for complex type checking
2. **Consistent API Response Types**: Define consistent response types for all API endpoints
3. **Zod for Validation**: Use Zod schemas for both validation and type inference
4. **Avoid Type Assertions**: Minimize use of `as` type assertions when possible
5. **Enable Strict Mode**: Consider enabling `strict: true` in tsconfig.json for maximum type safety
6. **Route Handler Types**: Use custom types for all App Router route handlers

## Next Steps

1. Apply these patterns consistently across the codebase
2. Update all API routes to use the new custom types
3. Re-enable `ignoreBuildErrors: false` once all API routes are updated
4. Add proper return type annotations to all functions
5. Run TypeScript checks regularly during development
