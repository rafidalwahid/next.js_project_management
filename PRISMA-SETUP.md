# Prisma Setup and Troubleshooting

This document provides information on setting up and troubleshooting Prisma in this project.

## Prisma Client Generation

The Prisma client needs to be generated before the application can interact with the database. This is now automatically included in the build process, but you may need to run it manually in some cases.

### Automatic Generation

The Prisma client is automatically generated during the build process with:

```bash
npm run build
```

This runs `npx prisma generate` before building the Next.js application.

### Manual Generation

If you encounter errors related to Prisma client validation or missing types, you can manually generate the Prisma client:

```bash
npm run prisma:generate
```

or directly:

```bash
npx prisma generate
```

## Common Errors and Solutions

### PrismaClientValidationError

If you see errors like:

```
Error [PrismaClientValidationError]: 
Invalid `prisma.teamMember.count()` invocation:
```

This usually indicates that:

1. The Prisma client hasn't been generated after schema changes
2. You're using a Prisma API that doesn't match the current schema

**Solution:**
1. Run `npx prisma generate` to update the client
2. Check your query to ensure it matches the current schema

### Schema Changes

After making changes to `prisma/schema.prisma`, always run:

```bash
npx prisma generate
```

to update the client.

## Database Migrations

When changing the database schema:

1. Update `prisma/schema.prisma`
2. Create a migration:
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```
3. Apply the migration to your database:
   ```bash
   npx prisma migrate deploy
   ```

## Development Workflow

For the best development experience:

1. Make schema changes in `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your_change_name`
3. Run `npx prisma generate` to update the client
4. Update your code to use the new schema
5. Test your changes

## Deployment

When deploying to production:

1. Ensure `npx prisma generate` runs during the build process
2. Use `npx prisma migrate deploy` to apply migrations safely

## Troubleshooting

If you encounter issues:

1. Check that the Prisma client is generated (`lib/prisma-client` should exist)
2. Ensure your database connection string in `.env` is correct
3. Verify that your queries match the current schema
4. Try running `npx prisma generate` manually
5. Check for any errors in the Prisma schema with `npx prisma validate`
