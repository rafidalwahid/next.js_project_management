# Architecture

This document provides an overview of the Project Management System's architecture, including the technology stack, directory structure, and data flow.

## System Overview

The Project Management System is built as a full-stack web application using Next.js 15 with the App Router. It follows a client-server architecture where:

- The frontend is built with React and runs in the browser
- The backend is implemented as Next.js API routes
- Data is stored in a MySQL database accessed via Prisma ORM
- Authentication is handled by NextAuth.js
- Offline capabilities are provided by Service Workers

## Technology Stack

### Frontend

- **Next.js 15**: React framework with server-side rendering and static site generation
- **React 18**: UI library for building component-based interfaces
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library built on Radix UI
- **SWR**: Data fetching library with caching and revalidation
- **Service Workers**: For offline capabilities and background sync

### Backend

- **Next.js API Routes**: Server-side API endpoints
- **Prisma ORM**: Type-safe database access
- **MySQL**: Relational database
- **NextAuth.js**: Authentication framework
- **Zod**: Schema validation

### Development Tools

- **TypeScript**: Type-safe JavaScript
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **npm**: Package management

## Directory Structure

```
project-management/
├── app/                    # Next.js App Router
│   ├── api/                # API endpoints
│   ├── (auth)/             # Authentication pages
│   ├── dashboard/          # Dashboard pages
│   ├── projects/           # Project management pages
│   ├── tasks/              # Task management pages
│   ├── team/               # Team management pages
│   ├── attendance/         # Attendance tracking pages
│   ├── profile/            # User profile pages
│   ├── analytics/          # Data visualization pages
│   ├── calendar/           # Event calendar pages
│   ├── offline/            # Offline fallback page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Root page (redirects to login)
├── components/             # Reusable UI components
│   ├── ui/                 # shadcn/ui components
│   ├── forms/              # Form components
│   ├── layouts/            # Layout components
│   └── data-display/       # Tables, charts, etc.
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and shared code
│   ├── api/                # API client functions
│   ├── auth/               # Authentication utilities
│   ├── permissions/        # Permission system
│   ├── services/           # Business logic services
│   └── utils/              # Helper functions
├── prisma/                 # Prisma schema and migrations
├── public/                 # Static assets and PWA files
├── scripts/                # Database setup and seeding scripts
├── docs/                   # Documentation
├── .env                    # Environment variables
├── next.config.mjs         # Next.js configuration
├── package.json            # Dependencies and scripts
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Data Flow

### Client-Side Data Flow

1. **User Interaction**: User interacts with the UI
2. **State Management**: React state and SWR manage local state
3. **API Requests**: API client functions make HTTP requests to the backend
4. **Response Handling**: Responses update the UI via SWR's cache

### Server-Side Data Flow

1. **API Routes**: Next.js API routes receive HTTP requests
2. **Authentication**: NextAuth.js verifies user credentials
3. **Authorization**: Permission system checks user access rights
4. **Data Access**: Prisma ORM queries the MySQL database
5. **Response**: Data is returned as JSON to the client

### Authentication Flow

1. **Login**: User submits credentials via NextAuth.js
2. **Verification**: Credentials are verified against the database
3. **Session**: JWT token is generated and stored in cookies
4. **Authorization**: User's role determines access to features
5. **Logout**: Session is invalidated and cookies cleared

### Offline Flow

1. **Service Worker**: Registers and caches essential resources
2. **Offline Detection**: Application detects when network is unavailable
3. **Local Storage**: Data is stored locally when offline
4. **Background Sync**: Changes are synchronized when connection is restored

## Key Components

### Next.js App Router

The application uses Next.js App Router for routing and server components. Each route is defined by a directory structure with `page.tsx` files.

### API Routes

API routes are defined in the `app/api` directory and follow RESTful conventions. They handle data operations and authentication.

### Prisma ORM

Prisma provides type-safe database access with automatic migrations. The schema is defined in `prisma/schema.prisma`.

### NextAuth.js

NextAuth.js handles authentication with support for multiple providers (email/password, Google, Facebook).

### Service Workers

Service Workers enable offline capabilities by caching resources and synchronizing data when the network is available.

## Performance Considerations

- **Server-Side Rendering**: Critical pages are rendered on the server for faster initial load
- **Static Site Generation**: Where possible, pages are pre-rendered at build time
- **Code Splitting**: Automatic code splitting reduces initial bundle size
- **SWR Caching**: Data is cached and revalidated to reduce API calls
- **Service Worker Caching**: Static assets are cached for offline use

## Security Considerations

- **Authentication**: JWT-based authentication with secure cookies
- **Authorization**: Role-based access control for all operations
- **Input Validation**: All inputs are validated using Zod schemas
- **CSRF Protection**: Built-in protection via Next.js
- **Secure Headers**: HTTP security headers are set
- **Environment Variables**: Sensitive information is stored in environment variables
