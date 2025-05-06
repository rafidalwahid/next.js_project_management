# API Reference

The Project Management System provides a comprehensive API for interacting with all aspects of the application. This section documents the available API endpoints, request/response formats, and authentication requirements.

## API Overview

The API is built using Next.js API Routes and follows RESTful conventions. All API endpoints are located under the `/api` path.

### Base URL

- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

### Authentication

Most API endpoints require authentication. Include the authentication cookie in your requests, which is automatically handled by the browser when using the API from the frontend.

For programmatic access, you'll need to:
1. Authenticate using the `/api/auth/callback/credentials` endpoint
2. Store the session cookie
3. Include the cookie in subsequent requests

### Response Format

All API responses follow a consistent format:

```json
{
  "data": { ... },  // The response data (if successful)
  "error": "...",   // Error message (if an error occurred)
  "status": 200     // HTTP status code
}
```

### Error Handling

The API uses standard HTTP status codes:

- `200 OK`: The request was successful
- `201 Created`: A resource was successfully created
- `400 Bad Request`: The request was invalid
- `401 Unauthorized`: Authentication is required
- `403 Forbidden`: The user doesn't have permission
- `404 Not Found`: The resource wasn't found
- `500 Internal Server Error`: An unexpected error occurred

## API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signin` | GET | Renders the sign-in page |
| `/api/auth/signin/:provider` | POST | Initiates sign-in with a provider |
| `/api/auth/callback/:provider` | GET/POST | OAuth callback URL |
| `/api/auth/signout` | POST | Signs out the current user |
| `/api/auth/session` | GET | Returns the current session |

[Learn more about Authentication API](./authentication-api.md)

### Projects

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET | List all projects |
| `/api/projects` | POST | Create a new project |
| `/api/projects/:id` | GET | Get a project by ID |
| `/api/projects/:id` | PUT | Update a project |
| `/api/projects/:id` | DELETE | Delete a project |
| `/api/projects/:id/statuses` | GET | Get project statuses |
| `/api/projects/:id/statuses` | POST | Create a project status |
| `/api/projects/:id/tasks` | GET | Get project tasks |
| `/api/projects/:id/team` | GET | Get project team members |

[Learn more about Projects API](./projects-api.md)

### Tasks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks` | GET | List all tasks |
| `/api/tasks` | POST | Create a new task |
| `/api/tasks/:id` | GET | Get a task by ID |
| `/api/tasks/:id` | PUT | Update a task |
| `/api/tasks/:id` | DELETE | Delete a task |
| `/api/tasks/:id/subtasks` | GET | Get task subtasks |
| `/api/tasks/:id/subtasks` | POST | Create a subtask |
| `/api/tasks/:id/comments` | GET | Get task comments |
| `/api/tasks/:id/comments` | POST | Add a comment to a task |
| `/api/tasks/:id/attachments` | GET | Get task attachments |
| `/api/tasks/:id/attachments` | POST | Add an attachment to a task |

[Learn more about Tasks API](./tasks-api.md)

### Users

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users` | GET | List all users |
| `/api/users` | POST | Create a new user |
| `/api/users/:id` | GET | Get a user by ID |
| `/api/users/:id` | PUT | Update a user |
| `/api/users/:id` | DELETE | Delete a user |
| `/api/users/:id/projects` | GET | Get user's projects |
| `/api/users/:id/tasks` | GET | Get user's tasks |
| `/api/users/:id/attendance` | GET | Get user's attendance records |
| `/api/users/roles` | GET | Get all roles |
| `/api/users/roles` | POST | Create a new role |

[Learn more about Users API](./users-api.md)

### Attendance

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/attendance` | GET | List attendance records |
| `/api/attendance` | POST | Create an attendance record (check-in) |
| `/api/attendance/:id` | GET | Get an attendance record by ID |
| `/api/attendance/:id` | PUT | Update an attendance record (check-out) |
| `/api/attendance/current` | GET | Get current user's active attendance |
| `/api/attendance/settings` | GET | Get attendance settings |
| `/api/attendance/settings` | PUT | Update attendance settings |
| `/api/attendance/corrections` | POST | Request an attendance correction |
| `/api/attendance/corrections/:id` | PUT | Approve/reject a correction request |

[Learn more about Attendance API](./attendance-api.md)

### Team Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/team-management/members` | GET | List team members |
| `/api/team-management/members` | POST | Add a team member |
| `/api/team-management/members/:id` | DELETE | Remove a team member |
| `/api/team-management/roles` | GET | List roles |
| `/api/team-management/roles` | POST | Create a role |
| `/api/team-management/roles/:id` | PUT | Update a role |
| `/api/team-management/roles/:id` | DELETE | Delete a role |
| `/api/team-management/permissions` | GET | List permissions |
| `/api/team-management/invite` | POST | Invite a user to join |

[Learn more about Team Management API](./team-management-api.md)

### Dashboard

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard/stats` | GET | Get dashboard statistics |
| `/api/dashboard/recent-activities` | GET | Get recent activities |
| `/api/dashboard/upcoming-tasks` | GET | Get upcoming tasks |
| `/api/dashboard/project-progress` | GET | Get project progress data |

[Learn more about Dashboard API](./dashboard-api.md)

## API Versioning

The current API version is v1, which is implicit in the URL structure. Future versions will be explicitly versioned (e.g., `/api/v2/projects`).

## Rate Limiting

API requests are rate-limited to prevent abuse. The current limits are:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

If you exceed these limits, you'll receive a `429 Too Many Requests` response.

## Pagination

List endpoints support pagination using the `page` and `limit` query parameters:

```
GET /api/projects?page=2&limit=10
```

The response includes pagination metadata:

```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 2,
    "limit": 10,
    "pages": 10
  }
}
```

## Filtering and Sorting

List endpoints support filtering and sorting using query parameters:

```
GET /api/tasks?status=in-progress&priority=high&sort=dueDate&order=asc
```

## API Client

The frontend uses a custom API client to interact with the API:

```typescript
// lib/api/client.ts
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }

  return data;
}
```

Example usage:

```typescript
import { fetchApi } from '@/lib/api/client';

// Get all projects
const projects = await fetchApi('/projects');

// Create a new project
const newProject = await fetchApi('/projects', {
  method: 'POST',
  body: JSON.stringify({
    title: 'New Project',
    description: 'Project description',
  }),
});
```

## Webhooks

The API supports webhooks for certain events. To register a webhook:

```
POST /api/webhooks
{
  "url": "https://your-webhook-endpoint.com",
  "events": ["project.created", "task.completed"]
}
```

## API Documentation Tools

The API documentation is available in OpenAPI format at `/api/docs/openapi.json`. You can use tools like Swagger UI or Redoc to view the documentation interactively.
