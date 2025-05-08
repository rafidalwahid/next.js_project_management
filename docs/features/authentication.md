# Authentication & Authorization

The Project Management System provides a comprehensive authentication and authorization system to secure your application and control access to features based on user roles.

## Authentication Methods

### Email/Password Authentication

Users can register and log in using their email address and password.

**Registration Process:**

1. User navigates to the registration page
2. User enters their name, email, and password
3. System validates the input and creates a new user account
4. User receives a verification email (optional)
5. User can now log in with their credentials

**Login Process:**

1. User navigates to the login page
2. User enters their email and password
3. System validates the credentials
4. If valid, the user is redirected to the dashboard

### Social Login

The system supports social login with Google and Facebook.

**Google Login:**

1. User clicks the "Continue with Google" button
2. User is redirected to Google's authentication page
3. User grants permission to the application
4. User is redirected back to the application and logged in

**Facebook Login:**

1. User clicks the "Continue with Facebook" button
2. User is redirected to Facebook's authentication page
3. User grants permission to the application
4. User is redirected back to the application and logged in

### Configuration

Social login providers are configured in the `.env` file:

```
# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"
```

And in the `lib/auth-options.ts` file:

```typescript
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    // Other providers...
  ],
  // Other options...
};
```

## Permission-Based Access Control

The system implements a dynamic, database-driven permission system that allows for fine-grained access control.

### User Roles and Permissions

Instead of hardcoded roles with fixed permissions, the system uses a flexible approach:

1. **Roles** are stored in the database and can be created/modified through the UI
2. **Permissions** are stored in the database and assigned to roles through the UI
3. **Users** are assigned a role, which determines their permissions

This approach allows administrators to:
- Create custom roles with specific permission sets
- Modify permissions for existing roles without changing code
- Assign appropriate roles to users based on their responsibilities

### Role Assignment

Roles are assigned to users in the database:

```typescript
// User model in Prisma schema
model User {
  id        String   @id @default(cuid())
  name      String?
  email     String   @unique
  password  String?
  role      String   @default("user")
  // Other fields...
}
```

Roles can be assigned during user creation or updated later by administrators.

### Permission-Based UI

The UI adapts based on the user's permissions:

```tsx
// Example of permission-based UI rendering
function ProjectActions({ project }) {
  const { hasPermission } = useHasPermission('project_management');

  if (hasPermission) {
    return (
      <div>
        <Button onClick={handleEdit}>Edit Project</Button>
        <Button onClick={handleDelete}>Delete Project</Button>
      </div>
    );
  }

  return null;
}

// Alternatively, use the PermissionGuard component
function ProjectActionsWithGuard({ project }) {
  return (
    <PermissionGuard permission="project_management">
      <div>
        <Button onClick={handleEdit}>Edit Project</Button>
        <Button onClick={handleDelete}>Delete Project</Button>
      </div>
    </PermissionGuard>
  );
}
```

## Database-Backed Permission System

The system implements a fully database-backed permission system that allows administrators to create and manage roles and permissions through the UI.

### Permission Models

Permissions are stored in the database using the following models:

```typescript
// Permission model in Prisma schema
model Permission {
  id          String          @id @default(cuid())
  name        String          @unique
  description String?
  category    String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  roles       RolePermission[]
}

// Role model in Prisma schema
model Role {
  id          String          @id @default(cuid())
  name        String          @unique
  description String?
  color       String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  permissions RolePermission[]
}

// RolePermission model in Prisma schema
model RolePermission {
  id           String     @id @default(cuid())
  roleId       String
  permissionId String
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
}
```

### Permission Categories

Permissions are organized into categories for easier management:

- **User Management**: Permissions related to user accounts
- **Project Management**: Permissions related to projects
- **Task Management**: Permissions related to tasks
- **Team Management**: Permissions related to teams
- **Attendance**: Permissions related to attendance tracking
- **System**: Permissions related to system settings

### Permission Assignment

Permissions are assigned to roles through the database:

```typescript
// Example of assigning permissions to a role
await prisma.rolePermission.createMany({
  data: [
    { roleId: managerRoleId, permissionId: viewProjectsPermissionId },
    { roleId: managerRoleId, permissionId: createTasksPermissionId },
    { roleId: managerRoleId, permissionId: editTasksPermissionId },
    // More permissions...
  ],
});
```

### Permission Checking

Permissions are checked using the database-backed permission service:

#### Server-Side Permission Checks

In API routes and server components, use the `PermissionService` to check permissions:

```typescript
// Example permission check in API route
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has the required permission
  const hasPermission = await PermissionService.hasPermissionById(
    session.user.id,
    'project_creation'
  );

  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Process the request...
}
```

#### Client-Side Permission Checks

For client components, you have several options:

##### 1. Using the useHasPermission Hook

```tsx
// Example using the useHasPermission hook
import { useHasPermission } from "@/hooks/use-permissions";

function ProjectActions({ project }) {
  const { hasPermission, isLoading } = useHasPermission('project_management');

  if (isLoading) {
    return <Skeleton />;
  }

  if (hasPermission) {
    return (
      <div>
        <Button onClick={handleEdit}>Edit Project</Button>
        <Button onClick={handleDelete}>Delete Project</Button>
      </div>
    );
  }

  return null;
}
```

##### 2. Using the PermissionGuard Component

```tsx
// Example using the PermissionGuard component
import { PermissionGuard } from "@/components/permission-guard";

function ProjectActions({ project }) {
  return (
    <PermissionGuard
      permission="project_management"
      fallback={<p>You don't have permission to manage this project</p>}
      showLoading={true}
    >
      <div>
        <Button onClick={handleEdit}>Edit Project</Button>
        <Button onClick={handleDelete}>Delete Project</Button>
      </div>
    </PermissionGuard>
  );
}
```

##### 3. Using the withPermission Higher-Order Component

```tsx
// Example using the withPermission HOC
import { withPermission } from "@/lib/hoc/with-permission";

function ProjectActionsComponent({ project }) {
  return (
    <div>
      <Button onClick={handleEdit}>Edit Project</Button>
      <Button onClick={handleDelete}>Delete Project</Button>
    </div>
  );
}

// Wrap the component with the withPermission HOC
const ProjectActions = withPermission(
  ProjectActionsComponent,
  "project_management",
  <p>You don't have permission to manage this project</p>
);
```

### Permission Management UI

The system provides a comprehensive user interface for managing roles and permissions at `/team/permissions`:

#### Role Management
- Create new roles with custom names and descriptions
- View existing roles and their assigned permissions
- Assign users to roles through the user management interface

#### Permission Management
- Create new permissions with names, descriptions, and categories
- View existing permissions organized by category
- Assign permissions to roles using the permission matrix

#### Permission Matrix
The permission matrix provides a visual way to manage which permissions are assigned to which roles:
- Rows represent individual permissions
- Columns represent roles
- Checkmarks indicate that a role has a specific permission
- Click on a cell to toggle a permission for a role

#### Best Practices
1. **Create Specific Roles**: Create roles that match your organization's structure
2. **Assign Minimal Permissions**: Give roles only the permissions they need
3. **Use Categories**: Organize permissions into logical categories
4. **Document Roles**: Add clear descriptions to roles and permissions
5. **Audit Regularly**: Review role assignments and permissions periodically

```typescript
// Example of programmatically updating role permissions
await prisma.rolePermission.deleteMany({
  where: { roleId: roleId }
});

await prisma.rolePermission.createMany({
  data: permissions.map(permissionId => ({
    roleId,
    permissionId
  }))
});
```

## Session Management

The system uses NextAuth.js for session management.

### Session Configuration

Sessions are configured in the `lib/auth-options.ts` file:

```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    // Providers...
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  // Other options...
};
```

### Session Usage

Sessions are used in API routes and components:

```typescript
// Example session usage in API route
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Process the request...
}
```

```tsx
// Example session usage in component
function ProfilePage() {
  const { data: session } = useSession();

  if (!session) {
    return <div>Please log in</div>;
  }

  return <div>Welcome, {session.user.name}</div>;
}
```

## Security Considerations

### Password Hashing

Passwords are hashed using bcrypt before being stored in the database:

```typescript
import bcrypt from 'bcryptjs';

// Hashing a password
const hashedPassword = await bcrypt.hash(password, 10);

// Verifying a password
const isValid = await bcrypt.compare(password, hashedPassword);
```

### CSRF Protection

NextAuth.js provides built-in CSRF protection for authentication requests.

### Rate Limiting

API routes implement rate limiting to prevent brute force attacks:

```typescript
import rateLimit from 'express-rate-limit';
import { NextResponse } from 'next/server';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const result = await limiter.check(ip);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // Process the request...
}
```

## Authentication Flow Diagrams

### Login Flow

```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌─────────┐
│  User   │     │  Login  │     │ NextAuth │     │ Database│
│ Browser │     │   Page  │     │   API    │     │         │
└────┬────┘     └────┬────┘     └────┬─────┘     └────┬────┘
     │               │                │                │
     │ Navigate to   │                │                │
     │ login page    │                │                │
     │───────────────>                │                │
     │               │                │                │
     │               │ Display login  │                │
     │               │ form           │                │
     │<───────────────                │                │
     │               │                │                │
     │ Submit        │                │                │
     │ credentials   │                │                │
     │───────────────>                │                │
     │               │                │                │
     │               │ POST /api/auth/│                │
     │               │ callback/credentials            │
     │               │───────────────>│                │
     │               │                │                │
     │               │                │ Query user     │
     │               │                │───────────────>│
     │               │                │                │
     │               │                │ Return user    │
     │               │                │<───────────────│
     │               │                │                │
     │               │                │ Create session │
     │               │                │ and JWT        │
     │               │                │                │
     │               │ Return session │                │
     │               │<───────────────│                │
     │               │                │                │
     │ Redirect to   │                │                │
     │ dashboard     │                │                │
     │<───────────────                │                │
     │               │                │                │
```

## Further Reading

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Role-Based Access Control (RBAC)](https://en.wikipedia.org/wiki/Role-based_access_control)
- [JWT Authentication](https://jwt.io/introduction/)
