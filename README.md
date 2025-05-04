# Project Management System

A comprehensive project management application built with Next.js, Prisma, and MySQL.

## Features

- User authentication and role-based access control
- Project management with team collaboration
- Task management with Kanban and list views
- Nested subtasks with ordering capabilities
- Field attendance tracking with geolocation
- Attendance analytics and reporting
- Activity logging and reporting

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes
- **Database**: MySQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js

## Prerequisites

- Node.js (v18+)
- MySQL (via XAMPP or standalone)
- Git

## Setup Instructions

1. **Clone the repository**

```bash
git clone <repository-url>
cd project-management
```

2. **Install dependencies**

```bash
npm install --legacy-peer-deps
```

3. **Configure environment variables**

Create a `.env` file in the root directory with the following content:

```
# Database
DATABASE_URL="mysql://root:@localhost:3306/projectpro"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-for-jwt"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Start MySQL**

Make sure MySQL is running via XAMPP or your preferred MySQL server.

5. **Create database and apply migrations**

```bash
# Create the database
node scripts/setup-db.js

# Apply migrations
npx prisma migrate dev
```

6. **Seed the database (optional)**

```bash
node scripts/seed.js
```

This will create test users, projects, and tasks for development.

Test user credentials:
- Admin: admin@example.com / admin123
- Manager: manager@example.com / manager123
- User: user@example.com / user123

7. **Start the development server**

```bash
npm run dev
```

The application will be available at http://localhost:3000.

## Project Structure

- `/app` - Next.js App Router
  - `/api` - Backend API endpoints
  - `/dashboard`, `/projects`, etc. - Frontend pages
- `/components` - Reusable UI components
- `/contexts` - React Context providers
- `/hooks` - Custom React hooks
- `/lib` - Utility functions and shared code
- `/prisma` - Prisma schema and migrations
- `/public` - Static assets
- `/styles` - Global styles
- `/types` - TypeScript type definitions

## Database Structure

The application uses a MySQL database with Prisma ORM for data modeling and access. Below is a detailed overview of the database schema, relationships, and architecture.

### Core Models

#### User
- **Fields**: id (cuid), name (String?), email (String, unique), emailVerified (DateTime?), image (String?), password (String?), role (String), bio (Text?), jobTitle (String?), location (String?), department (String?), phone (String?), skills (String?), createdAt (DateTime), updatedAt (DateTime)
- **Role Values**: "admin", "manager", "user" (default)
- **Relations**: One-to-many with Projects, Tasks, TeamMembers, Accounts, Sessions, Activities, Attendance

#### Project
- **Fields**: id (cuid), title (String), description (Text?), startDate (DateTime?), endDate (DateTime?), totalTimeSpent (Float?), createdAt (DateTime), updatedAt (DateTime), createdById (String)
- **Relations**: Many-to-one with User (createdBy), One-to-many with Tasks, TeamMembers, Events, Resources, Activities, ProjectStatuses
- **Status**: Projects use a flexible ProjectStatus model that allows multiple statuses per project

#### Task
- **Fields**: id (cuid), title (String), description (Text?), statusId (String), priority (String), dueDate (DateTime?), projectId (String), assignedToId (String?), parentId (String?), order (Int), estimatedTime (Float?), timeSpent (Float?), createdAt (DateTime), updatedAt (DateTime)
- **Priority Values**: "low", "medium" (default), "high"
- **Relations**: Many-to-one with Project, User (assignedTo), and ProjectStatus; One-to-many with Subtasks (self-relation) and Activities
- **Subtasks**: Tasks can have nested subtasks with explicit ordering

#### TeamMember
- **Fields**: id (cuid), userId (String), projectId (String), createdAt (DateTime), updatedAt (DateTime)
- **Relations**: Many-to-one with User and Project
- **Constraints**: Unique [userId, projectId] combination

#### Resource
- **Fields**: id (cuid), name (String), type (String), quantity (Int), projectId (String), assignedToId (String?), createdAt (DateTime), updatedAt (DateTime)
- **Type Values**: "hardware", "software", "human", etc.
- **Relations**: Many-to-one with Project

#### Event
- **Fields**: id (cuid), title (String), description (Text?), date (DateTime), projectId (String), createdAt (DateTime), updatedAt (DateTime)
- **Relations**: Many-to-one with Project

#### Activity
- **Fields**: id (cuid), action (String), entityType (String), entityId (String), description (String?), userId (String), projectId (String?), taskId (String?), createdAt (DateTime)
- **Action Values**: "created", "updated", "deleted", "assigned", etc.
- **EntityType Values**: "project", "task", "resource", etc.
- **Relations**: Many-to-one with User, Project (optional), Task (optional)

### Authentication Models (NextAuth.js)

#### Account
- **Fields**: id (cuid), userId (String), type (String), provider (String), providerAccountId (String), refresh_token (Text?), access_token (Text?), expires_at (Int?), token_type (String?), scope (String?), id_token (Text?), session_state (String?)
- **Relations**: Many-to-one with User
- **Constraints**: Unique [provider, providerAccountId] combination

#### Session
- **Fields**: id (cuid), sessionToken (String, unique), userId (String), expires (DateTime)
- **Relations**: Many-to-one with User

#### VerificationToken
- **Fields**: identifier (String), token (String, unique), expires (DateTime)
- **Constraints**: Unique [identifier, token] combination

### Database Relationships

- **User-Project**: One-to-many (A user can create multiple projects)
- **User-Task**: One-to-many (A user can be assigned multiple tasks)
- **Project-Task**: One-to-many (A project can have multiple tasks)
- **Project-TeamMember**: One-to-many (A project can have multiple team members)
- **User-TeamMember**: One-to-many (A user can be a member of multiple project teams)
- **Project-Resource**: One-to-many (A project can have multiple resources)
- **Project-Event**: One-to-many (A project can have multiple events)
- **User-Activity**: One-to-many (A user can generate multiple activities)
- **Project-Activity**: One-to-many (A project can have multiple activities)
- **Task-Activity**: One-to-many (A task can have multiple activities)
- **Task-Subtask**: One-to-many (A task can have multiple subtasks)
- **Project-ProjectStatus**: One-to-many (A project can have multiple statuses)
- **User-Attendance**: One-to-many (A user can have multiple attendance records)
- **Project-Attendance**: One-to-many (Attendance can be linked to projects)
- **Task-Attendance**: One-to-many (Attendance can be linked to tasks)

### Important Notes on Data Types

- **String Fields**: All string fields in Prisma are mapped to VARCHAR(191) in MySQL by default
- **Text Fields**: Fields marked with @db.Text are mapped to TEXT in MySQL
- **DateTime Fields**: Stored with millisecond precision (DATETIME(3))
- **Status Fields**: Stored as strings but validated through application logic
- **ID Fields**: All IDs use CUID (Collision-resistant Unique Identifiers)

### Database Architecture and Data Flow

#### Architecture Overview

1. **Client Layer**: React components in the frontend make requests to the API
2. **API Layer**: Next.js API routes handle requests and communicate with the database
3. **Data Access Layer**: Prisma ORM provides type-safe database access
4. **Database Layer**: MySQL stores all application data

#### Data Flow

1. **Data Retrieval**:
   - Frontend components use custom hooks (e.g., `useProjects`, `useTasks`)
   - Hooks use SWR for data fetching and caching
   - API client functions in `lib/api.ts` make actual HTTP requests
   - Next.js API routes process requests and use Prisma to query the database
   - Results are returned as JSON responses

2. **Data Modification**:
   - Forms in the UI collect user input
   - Form data is validated on the client side
   - API client functions send data to API endpoints
   - API routes validate incoming data using Zod schemas
   - Prisma transactions ensure data consistency
   - Activity logs are created to track changes

3. **Authentication Flow**:
   - NextAuth.js handles user authentication
   - JWT tokens are used for session management
   - API routes verify session tokens before processing requests
   - Role-based access control restricts operations based on user roles

#### Database Optimization

- **Indexes**: Primary keys and foreign keys are automatically indexed
- **Relations**: Proper relation definitions enable efficient joins
- **Cascading Operations**: Automatic cleanup of related records on deletion
- **Pagination**: API endpoints support pagination for large result sets

### Common Issues and Solutions

- **Object Serialization**: When filtering by status or other fields, ensure you're passing a string value and not an object. The API will reject requests where status is `[object Object]` instead of a valid string value.
- **Date Handling**: Dates are stored in ISO format in the database but should be properly formatted for display in the UI.
- **Cascading Deletes**: The schema includes cascading deletes for related records (e.g., deleting a project will delete all its tasks).
- **Type Safety**: The Prisma schema enforces type safety, but be careful with dynamic values and user inputs.
- **Status Handling**: Projects use a flexible ProjectStatus model, while tasks reference these statuses directly. The isCompletedStatus field on ProjectStatus determines if a task is considered complete.
- **Subtask Ordering**: When creating or updating subtasks, ensure the order field is properly set to maintain the correct sequence.
- **Attendance Geolocation**: The attendance system collects geolocation data, which requires proper user consent and privacy considerations.

## API Routes

- `/api/auth/*` - Authentication endpoints (NextAuth.js)
- `/api/projects` - Project management
- `/api/tasks` - Task management
- `/api/users` - User management
- `/api/events` - Event management
- `/api/resources` - Resource management
- `/api/activities` - Activity logging
- `/api/attendance` - Attendance tracking and management

## Development Workflow

1. Create a new branch for your feature
2. Make changes to the codebase
3. Run tests and ensure linting passes
4. Submit a pull request for review

## License

[MIT](LICENSE)
