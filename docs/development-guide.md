# Development Guide

This guide provides information on coding standards, testing, and the contribution workflow for the Project Management System.

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define interfaces for all data structures
- Use proper type annotations for function parameters and return values
- Avoid using `any` type when possible
- Use type guards for runtime type checking

Example:

```typescript
interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

// Prefer permission-based checks over role-based checks
async function canManageUsers(userId: string): Promise<boolean> {
  return await PermissionService.hasPermissionById(userId, 'user_management');
}
```

### React Components

- Use functional components with hooks
- Use TypeScript for props definitions
- Split large components into smaller, reusable ones
- Use proper naming conventions (PascalCase for components)
- Add JSDoc comments for complex components

Example:

```tsx
interface ButtonProps {
  /** The text to display in the button */
  children: React.ReactNode;
  /** The variant style to apply */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Button component with different variants
 */
export function Button({
  children,
  variant = 'primary',
  disabled = false,
  onClick
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### API Routes

- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Validate input data using Zod schemas
- Return appropriate status codes
- Handle errors gracefully
- Add authentication and authorization checks

Example:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";

const taskSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().datetime().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = taskSchema.parse(body);

    // Create task
    const task = await prisma.task.create({
      data: {
        ...validatedData,
        projectId: body.projectId,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### CSS/Styling

- Use Tailwind CSS for styling
- Follow the project's design system
- Use CSS variables for theming
- Ensure responsive design for all components

### File Structure

- Group related files together
- Use consistent naming conventions
- Keep files focused on a single responsibility
- Use index files for cleaner imports

## Testing

### Unit Testing

- Write unit tests for utility functions and hooks
- Use Jest for test runner
- Use React Testing Library for component tests
- Focus on testing behavior, not implementation details

Example:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

### Integration Testing

- Test interactions between components
- Test API routes with mock requests
- Ensure components work together correctly

### End-to-End Testing

- Use Cypress for end-to-end testing
- Test critical user flows
- Ensure the application works as expected in a real browser

## Debugging

### Client-Side Debugging

- Use React Developer Tools for component inspection
- Use browser console for logging
- Use SWR's built-in debugging tools

### Server-Side Debugging

- Use console.log for basic debugging
- Set up proper error handling and logging
- Use Prisma Studio for database inspection

## Git Workflow

### Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Urgent fixes for production

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `chore`: Changes to the build process or auxiliary tools

Example:
```
feat(tasks): add subtask creation functionality

- Add subtask model
- Implement subtask creation API
- Add subtask UI components

Closes #123
```

### Pull Requests

- Create a pull request for each feature or bug fix
- Include a clear description of the changes
- Reference related issues
- Ensure all tests pass
- Request code reviews from team members

## Performance Optimization

- Use React.memo for expensive components
- Optimize re-renders with useMemo and useCallback
- Use SWR for efficient data fetching
- Implement pagination for large data sets
- Use proper indexing for database queries

## Accessibility

- Use semantic HTML elements
- Add proper ARIA attributes
- Ensure keyboard navigation works
- Test with screen readers
- Follow WCAG 2.1 guidelines

## Security Best Practices

- Validate all user inputs
- Use parameterized queries with Prisma
- Implement proper authentication and authorization
- Sanitize data before rendering
- Keep dependencies updated
- Follow the principle of least privilege

## Documentation

- Add JSDoc comments to functions and components
- Keep the documentation up to date
- Document API endpoints
- Add README files to important directories
- Use TypeScript for self-documenting code
