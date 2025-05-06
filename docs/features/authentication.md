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

## Role-Based Access Control

The system implements role-based access control (RBAC) to restrict access to features based on user roles.

### User Roles

The system defines the following roles:

- **Admin**: Full access to all features
- **Manager**: Can manage projects, tasks, and team members
- **User**: Can manage tasks and view projects
- **Guest**: Can only view projects and tasks

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

### Role-Based UI

The UI adapts based on the user's role:

```tsx
// Example of role-based UI rendering
function ProjectActions({ project }) {
  const { user } = useAuth();
  
  if (user.role === 'admin' || user.role === 'manager') {
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

## Dynamic Permission System

The system implements a dynamic permission system that allows administrators to create and manage roles and permissions through the UI.

### Permission Model

Permissions are defined as string identifiers that represent specific actions:

```
"project:create"
"project:read"
"project:update"
"project:delete"
"task:create"
"task:read"
"task:update"
"task:delete"
// etc.
```

### Permission Assignment

Permissions are assigned to roles, and roles are assigned to users:

```typescript
// Example permission service
export class PermissionService {
  static getPermissionsForRole(roleName: string): string[] {
    switch (roleName) {
      case 'admin':
        return [
          'user:read', 'user:create', 'user:update', 'user:delete',
          'project:read', 'project:create', 'project:update', 'project:delete',
          // More permissions...
        ];
      case 'manager':
        return [
          'user:read',
          'project:read', 'project:create', 'project:update',
          // More permissions...
        ];
      // Other roles...
    }
  }
}
```

### Permission Checking

Permissions are checked in API routes and UI components:

```typescript
// Example permission check in API route
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  
  const permissions = PermissionService.getPermissionsForRole(user.role);
  
  if (!permissions.includes('project:create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Process the request...
}
```

```tsx
// Example permission check in UI component
function CreateProjectButton() {
  const { user } = useAuth();
  const permissions = usePermissions(user.role);
  
  if (!permissions.includes('project:create')) {
    return null;
  }
  
  return <Button onClick={handleCreateProject}>Create Project</Button>;
}
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
