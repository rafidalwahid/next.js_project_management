# Getting Started

This guide will help you set up and run the Project Management System on your local machine for development and testing purposes.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later)
- **MySQL** (via XAMPP or standalone)
- **Git**

## Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd project-management
```

2. **Install dependencies**

```bash
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is used to handle some dependency conflicts with the current package versions.

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following content:

```
# Database
DATABASE_URL="mysql://root:@localhost:3306/projectpro_new"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-for-jwt"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"

# Application Settings
NODE_ENV="development"
```

### OAuth Configuration (Optional)

To enable social login:

1. Create a Google OAuth application at [Google Cloud Console](https://console.cloud.google.com/)
2. Create a Facebook OAuth application at [Facebook for Developers](https://developers.facebook.com/)
3. Add the client IDs and secrets to your `.env` file

## Database Setup

1. **Start MySQL**

Make sure MySQL is running via XAMPP or your preferred MySQL server.

2. **Create the database**

```bash
node scripts/setup-db.js
```

3. **Apply migrations**

```bash
npx prisma migrate dev
```

4. **Seed the database**

```bash
node scripts/seed.js
```

This will create test users, projects, tasks, and other data for development.

### Test User Credentials

After seeding, you can log in with the following test accounts:

- **Admin**: admin@example.com / password123
- **Manager**: manager@example.com / password123
- **User**: user1@example.com / password123
- **Designer**: designer@example.com / password123
- **Tester**: tester@example.com / password123

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at http://localhost:3000.

### Production Build

```bash
npm run build
npm run start
```

## Prisma Studio (Database Management UI)

You can use Prisma Studio to view and edit your database:

```bash
npx prisma studio
```

This will open a web interface at http://localhost:5555.

## Next Steps

- Explore the [Architecture](./architecture.md) to understand how the system is built
- Check out the [Features](./features/index.md) to learn about the application's capabilities
- Review the [API Reference](./api/index.md) to understand the available endpoints
- Read the [Development Guide](./development-guide.md) for coding standards and contribution workflow

## Troubleshooting

If you encounter any issues during setup, refer to the [Troubleshooting](./troubleshooting.md) guide or open an issue on the GitHub repository.
