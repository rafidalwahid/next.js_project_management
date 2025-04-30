import { PrismaClient, Prisma } from '../prisma/generated/client';

// Add prisma to the global type
declare global {
  var prisma: PrismaClient | undefined;
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

// Configure Prisma Client options
const prismaClientOptions: Prisma.PrismaClientOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] as Prisma.LogLevel[]
    : ['error'] as Prisma.LogLevel[],
  errorFormat: 'pretty',
};

// If prisma client exists on global object, use it, otherwise create a new instance
const prisma = global.prisma || new PrismaClient(prismaClientOptions);

// In development, save client to global object to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Add error handling
prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error) {
    // Log database errors with operation details
    console.error(`Database error in ${params.model}.${params.action}:`, {
      error,
      params: {
        model: params.model,
        action: params.action,
        args: params.args,
      },
    });
    
    // Re-throw the error to be handled by the API route
    throw error;
  }
});

export default prisma;
