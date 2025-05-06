# Troubleshooting

This guide provides solutions to common issues you might encounter when working with the Project Management System.

## Installation Issues

### Dependency Installation Fails

**Problem**: `npm install` fails with dependency conflicts.

**Solution**: Use the `--legacy-peer-deps` flag:

```bash
npm install --legacy-peer-deps
```

### Prisma Client Generation Fails

**Problem**: `npx prisma generate` fails.

**Solution**:

1. Check your database connection:
   ```bash
   npx prisma db pull
   ```

2. If that fails, verify your `.env` file has the correct `DATABASE_URL`.

3. Try resetting the Prisma folder:
   ```bash
   rm -rf node_modules/.prisma
   npm install
   npx prisma generate
   ```

## Database Issues

### Migration Errors

**Problem**: Prisma migrations fail to apply.

**Solution**:

1. Check if the database exists and is accessible:
   ```bash
   node scripts/setup-db.js
   ```

2. For development, you can reset the database:
   ```bash
   npx prisma migrate reset
   ```

3. For manual fixes, use Prisma Studio:
   ```bash
   npx prisma studio
   ```

### Connection Issues

**Problem**: Cannot connect to the database.

**Solution**:

1. Verify your database is running:
   - For XAMPP: Check if MySQL service is running
   - For standalone MySQL: `mysql -u root -p`

2. Check your `.env` file for correct credentials:
   ```
   DATABASE_URL="mysql://root:@localhost:3306/projectpro_new"
   ```

3. Ensure the database exists:
   ```bash
   node scripts/setup-db.js
   ```

## Authentication Issues

### Social Login Fails

**Problem**: Google or Facebook login doesn't work.

**Solution**:

1. Verify your OAuth credentials in `.env`:
   ```
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

2. Check that your OAuth app has the correct redirect URI:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-domain.com/api/auth/callback/google`

3. Ensure your OAuth app is properly configured and verified.

### Session Issues

**Problem**: Users are logged out unexpectedly.

**Solution**:

1. Check your `NEXTAUTH_SECRET` in `.env`:
   ```
   NEXTAUTH_SECRET="your-secret-key-for-jwt"
   ```

2. Ensure `NEXTAUTH_URL` is set correctly:
   ```
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. Check for cookie issues:
   - Ensure cookies are not being blocked by the browser
   - Check for secure cookie settings in production

## Build Issues

### TypeScript Errors

**Problem**: Build fails with TypeScript errors.

**Solution**:

1. Fix the TypeScript errors in your code.

2. If you need to bypass TypeScript checking temporarily:
   ```javascript
   // next.config.mjs
   const nextConfig = {
     typescript: {
       ignoreBuildErrors: true,
     },
     // ...
   }
   ```

### ESLint Errors

**Problem**: Build fails with ESLint errors.

**Solution**:

1. Fix the ESLint errors in your code.

2. If you need to bypass ESLint checking temporarily:
   ```javascript
   // next.config.mjs
   const nextConfig = {
     eslint: {
       ignoreDuringBuilds: true,
     },
     // ...
   }
   ```

## Runtime Issues

### API Routes Return 500 Errors

**Problem**: API routes return 500 Internal Server Error.

**Solution**:

1. Check server logs for detailed error messages.

2. Verify database connection is working.

3. Add better error handling to your API routes:
   ```typescript
   try {
     // Your code
   } catch (error) {
     console.error('API error:', error);
     return NextResponse.json(
       { error: 'Internal server error', details: error.message },
       { status: 500 }
     );
   }
   ```

### Page Rendering Errors

**Problem**: Pages fail to render with "Error: useSearchParams() should be wrapped in a suspense boundary".

**Solution**:

Wrap components using `useSearchParams()` with Suspense:

```tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComponentUsingSearchParams />
    </Suspense>
  );
}
```

### Data Fetching Issues

**Problem**: Data doesn't load or updates don't appear.

**Solution**:

1. Check your SWR configuration:
   ```typescript
   const { data, error, mutate } = useSWR('/api/projects', fetcher, {
     revalidateOnFocus: true,
     revalidateOnReconnect: true,
   });
   ```

2. Manually revalidate after mutations:
   ```typescript
   await fetch('/api/projects', {
     method: 'POST',
     body: JSON.stringify(newProject),
   });
   
   // Revalidate the cache
   mutate('/api/projects');
   ```

3. Check browser console for errors.

## Offline Mode Issues

### Service Worker Registration Fails

**Problem**: Service worker doesn't register.

**Solution**:

1. Ensure your browser supports Service Workers.

2. Check if the service worker file is accessible:
   ```
   http://localhost:3000/sw.js
   ```

3. Verify the registration code:
   ```javascript
   if ('serviceWorker' in navigator) {
     window.addEventListener('load', function() {
       navigator.serviceWorker.register('/sw.js').then(
         function(registration) {
           console.log('Service Worker registered with scope:', registration.scope);
         },
         function(error) {
           console.log('Service Worker registration failed:', error);
         }
       );
     });
   }
   ```

### Background Sync Doesn't Work

**Problem**: Offline actions don't sync when back online.

**Solution**:

1. Ensure your browser supports Background Sync API.

2. Check if the sync registration is working:
   ```javascript
   navigator.serviceWorker.ready.then(function(registration) {
     registration.sync.register('sync-attendance').then(
       function() {
         console.log('Sync registered');
       },
       function() {
         console.log('Sync registration failed');
       }
     );
   });
   ```

3. Verify the sync event handler in your service worker:
   ```javascript
   self.addEventListener('sync', function(event) {
     if (event.tag === 'sync-attendance') {
       event.waitUntil(syncAttendance());
     }
   });
   ```

## Performance Issues

### Slow Page Loads

**Problem**: Pages take too long to load.

**Solution**:

1. Use the Network tab in browser DevTools to identify slow resources.

2. Optimize images and static assets.

3. Implement code splitting:
   ```typescript
   import dynamic from 'next/dynamic';
   
   const DynamicComponent = dynamic(() => import('../components/HeavyComponent'), {
     loading: () => <p>Loading...</p>,
   });
   ```

4. Use SWR's caching capabilities effectively.

### Memory Leaks

**Problem**: Application becomes slow over time or crashes.

**Solution**:

1. Clean up event listeners and subscriptions in useEffect:
   ```typescript
   useEffect(() => {
     window.addEventListener('resize', handleResize);
     
     return () => {
       window.removeEventListener('resize', handleResize);
     };
   }, []);
   ```

2. Use the React DevTools Profiler to identify components that re-render too often.

3. Memoize expensive calculations:
   ```typescript
   const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
   ```

## Deployment Issues

### Vercel Deployment Fails

**Problem**: Deployment to Vercel fails.

**Solution**:

1. Check the build logs for specific errors.

2. Ensure all environment variables are set in the Vercel dashboard.

3. Verify your project is compatible with Vercel's serverless functions.

### Database Connection in Production

**Problem**: Application can't connect to the database in production.

**Solution**:

1. Check if your database allows connections from your production server's IP.

2. Verify the `DATABASE_URL` environment variable is set correctly.

3. For managed databases, check if SSL is required:
   ```
   DATABASE_URL="mysql://user:password@host:3306/database?sslmode=require"
   ```

## Getting Help

If you're still experiencing issues:

1. Check the [GitHub Issues](https://github.com/yourusername/project-management/issues) for similar problems.

2. Create a new issue with:
   - Detailed description of the problem
   - Steps to reproduce
   - Error messages
   - Environment information (OS, browser, Node.js version)

3. For urgent issues, contact the maintainers directly.
