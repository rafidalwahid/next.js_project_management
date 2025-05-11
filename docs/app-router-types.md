# Next.js 15 App Router Parameter Type Issues

This document outlines the issues encountered with TypeScript typing in Next.js 15 App Router's dynamic route parameters and our solution.

## The Problem

In Next.js 15's App Router, there's an inconsistency in how route parameters are typed in dynamic segments. When using TypeScript with `ignoreBuildErrors: false`, we encountered errors where:

1. Our code expected `params` to be a direct object with properties like `{ userId: string }`
2. Next.js type system expected `params` to be a Promise-like object
3. The behavior differed between development and production builds

Error example:
```
Type '{ __tag__: "GET"; __param_position__: "second"; __param_type__: { params: { projectId: string; statusId: string; }; }; }' 
does not satisfy the constraint 'ParamCheck<RouteContext>'.
  The types of '__param_type__.params' are incompatible between these types.
    Type '{ projectId: string; statusId: string; }' is missing the following properties from type 'Promise<any>': 
    then, catch, finally, [Symbol.toStringTag]
```

## Our Solution

We've implemented a multi-faceted solution:

1. **Custom Type Declarations**: Created `types/next-api-routes.d.ts` with definitions that bridge the gap between our expected types and Next.js types
2. **Usage Guidelines**: Updated route handlers to use consistent parameter handling 
3. **TypeScript Configuration**: Modified tsconfig.json to include our custom types directory
4. **Next.js Configuration**: Ensured proper TypeScript checking is enabled while handling these specific parameter issues

## Code Examples

### Before (causing type errors):
```typescript
// This caused type errors in production builds
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  // ...rest of function
}
```

### After (with type-safe approach):
```typescript
import { ApiRouteHandlerOneParam } from '@/types/next-api-routes';

// Type-safe approach using our custom definitions
export const GET: ApiRouteHandlerOneParam<'userId'> = async (req, { params }) => {
  const { userId } = params;
  // ...rest of function
}
```

## Additional Notes

1. The parameter type issue appears to be related to how Next.js handles type checking for dynamic segments in production builds
2. Our solution maintains strict type checking while accommodating Next.js expectations
3. Future Next.js versions may resolve this inconsistency, requiring revisiting this solution

## References

- [Next.js App Router Documentation](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [TypeScript Configuration in Next.js](https://nextjs.org/docs/app/building-your-application/configuring/typescript)
