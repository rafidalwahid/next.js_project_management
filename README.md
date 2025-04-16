# ProjectPro - Project Management System

A comprehensive project management application built with Next.js, Prisma, and MySQL.

## Features

- User authentication and role-based access control
- Project management with team collaboration
- Task management with Kanban board
- Resource allocation and tracking
- Event scheduling and calendar view
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

## API Routes

- `/api/auth/*` - Authentication endpoints (NextAuth.js)
- `/api/projects` - Project management
- `/api/tasks` - Task management
- `/api/users` - User management

## Development Workflow

1. Create a new branch for your feature
2. Make changes to the codebase
3. Run tests and ensure linting passes
4. Submit a pull request for review

## License

[MIT](LICENSE) 