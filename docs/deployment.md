# Deployment Guide

This guide provides instructions for deploying the Project Management System to various environments.

## Prerequisites

Before deploying, ensure you have:

- Node.js (v18 or later)
- MySQL database
- Access to your hosting environment
- Domain name (for production)
- SSL certificate (for production)

## Environment Configuration

Create a `.env` file with the appropriate values for your environment:

### Production Environment Variables

```
# Database
DATABASE_URL="mysql://username:password@production-host:3306/projectpro"

# NextAuth
NEXTAUTH_SECRET="your-secure-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# OAuth Providers (if using)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"

# Application Settings
NODE_ENV="production"
```

### Important Security Notes

- Use a strong, unique `NEXTAUTH_SECRET` for production
- Store sensitive information in environment variables, not in code
- Ensure your database credentials are secure
- Set up proper firewall rules for your database

## Building for Production

1. Install dependencies:

```bash
npm install --legacy-peer-deps
```

2. Generate Prisma client:

```bash
npx prisma generate
```

3. Build the application:

```bash
npm run build
```

4. Test the production build locally:

```bash
npm run start
```

## Database Setup

1. Create a production database:

```sql
CREATE DATABASE projectpro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Apply migrations:

```bash
npx prisma migrate deploy
```

3. (Optional) Seed the database:

```bash
NODE_ENV=production node scripts/seed.js
```

## Deployment Options

### Option 1: Traditional Hosting

#### Server Requirements

- Node.js v18 or later
- MySQL 8.0 or later
- Nginx or Apache as a reverse proxy
- 2GB RAM minimum (4GB recommended)
- 20GB storage minimum

#### Deployment Steps

1. Transfer the application files to your server
2. Install dependencies: `npm install --legacy-peer-deps --production`
3. Set up environment variables
4. Apply database migrations: `npx prisma migrate deploy`
5. Build the application: `npm run build`
6. Start the application: `npm run start`

#### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    
    # Proxy to Next.js server
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Process Management with PM2

Install PM2:

```bash
npm install -g pm2
```

Create a PM2 configuration file (`ecosystem.config.js`):

```javascript
module.exports = {
  apps: [
    {
      name: 'project-management',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

Start the application with PM2:

```bash
pm2 start ecosystem.config.js
```

Set up PM2 to start on system boot:

```bash
pm2 startup
pm2 save
```

### Option 2: Vercel Deployment

Vercel is the recommended platform for Next.js applications.

1. Install the Vercel CLI:

```bash
npm install -g vercel
```

2. Login to Vercel:

```bash
vercel login
```

3. Deploy the application:

```bash
vercel
```

4. For production deployment:

```bash
vercel --prod
```

5. Configure environment variables in the Vercel dashboard.

6. Connect your database (use a managed MySQL service like PlanetScale or Amazon RDS).

### Option 3: Docker Deployment

1. Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps --production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

2. Create a `.dockerignore` file:

```
node_modules
.next
.git
.env*
```

3. Build the Docker image:

```bash
docker build -t project-management .
```

4. Run the Docker container:

```bash
docker run -p 3000:3000 --env-file .env.production project-management
```

## Continuous Integration/Continuous Deployment (CI/CD)

### GitHub Actions Example

Create a `.github/workflows/deploy.yml` file:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install --legacy-peer-deps
        
      - name: Generate Prisma Client
        run: npx prisma generate
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Monitoring and Logging

### Application Monitoring

- Use Vercel Analytics for Vercel deployments
- Consider New Relic, Datadog, or Sentry for application monitoring
- Set up uptime monitoring with tools like UptimeRobot or Pingdom

### Error Tracking

- Implement Sentry for error tracking:

```bash
npm install @sentry/nextjs
```

- Configure Sentry in `next.config.mjs`:

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // Your Next.js config
};

module.exports = withSentryConfig(nextConfig, {
  // Sentry config
});
```

### Logging

- Use a structured logging solution like Winston or Pino
- Send logs to a centralized logging service

## Backup Strategy

- Set up automated database backups
- Store backups in a secure, off-site location
- Test backup restoration regularly
- Consider point-in-time recovery for production databases

## Scaling Considerations

- Use a load balancer for multiple instances
- Implement caching with Redis or Memcached
- Consider database read replicas for high-traffic applications
- Use a CDN for static assets

## Security Checklist

- [ ] SSL/TLS enabled
- [ ] Environment variables properly set
- [ ] Database credentials secured
- [ ] Authentication properly configured
- [ ] Regular security updates applied
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] CSP headers set
- [ ] Database backups secured
