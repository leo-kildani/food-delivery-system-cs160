# Docker Setup Guide

## Project Architecture

This is a **Next.js 15.5.6** full-stack food delivery application with the following stack:

### Frontend
- **Framework**: Next.js 15 with React 19 and TypeScript
- **Styling**: TailwindCSS 4 with shadcn/ui components
- **UI Libraries**: Radix UI, Lucide Icons
- **State Management**: React Hook Form, Zod validation

### Backend & Database
- **ORM**: Prisma with PostgreSQL
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

### External Services
- **Payment Processing**: Stripe
- **Maps**: Google Maps API
- **AI**: OpenAI API

### Key Features
- User authentication (login/signup)
- Product browsing and cart management
- Checkout with Stripe integration
- Order management
- Admin dashboard (analytics, employees, inventory)
- Delivery vehicle tracking

## Docker Setup

### Prerequisites
- Docker installed
- Docker Compose installed
- `.env.local` file with all required environment variables

### Building the Docker Image

```bash
# Build the image
docker build -t food-delivery-app .

# Or use Docker Compose
docker compose build
```

### Running with Docker

#### Option 1: Using Docker directly
```bash
docker run -p 3000:3000 \
  --env-file .env.local \
  food-delivery-app
```

#### Option 2: Using Docker Compose (Recommended)
```bash
# Start the application
docker compose up

# Start in detached mode
docker compose up -d

# View logs
docker compose logs -f

# Stop the application
docker compose down
```

> **Note**: Modern Docker uses `docker compose` (no hyphen). If you have older Docker Compose v1, use `docker-compose` instead.

### Environment Variables

Ensure your `.env.local` includes all required variables:

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_SERVICE_ROLE_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...

# OpenAI
OPENAI_API_KEY=...

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Database Migrations

The Docker setup automatically runs Prisma migrations on startup via:
```bash
npx prisma migrate deploy
```

To run migrations manually:
```bash
docker compose exec app npx prisma migrate deploy
```

### Dockerfile Architecture

The Dockerfile uses a **multi-stage build** for optimization:

1. **deps**: Installs dependencies and generates Prisma Client
2. **builder**: Builds the Next.js application
3. **runner**: Creates minimal production image (~400MB vs ~1.5GB)

### Build Optimizations

- Uses `node:20-alpine` for smaller image size
- Standalone output mode enabled in `next.config.ts`
- Multi-stage build reduces final image size
- Non-root user for security
- Layer caching for faster rebuilds

### Accessing the Application

Once running, access the application at:
- **Local**: http://localhost:3000
- **Docker network**: http://0.0.0.0:3000

### Troubleshooting

#### Port already in use
```bash
# Check what's using port 3000
lsof -i :3000

# Use a different port
docker run -p 4000:3000 --env-file .env.local food-delivery-app
```

#### Database connection issues
- Ensure `DATABASE_URL` and `DIRECT_URL` are accessible from Docker container
- Check if firewall allows connections
- For local databases, use host IP instead of `localhost`

#### Prisma Client errors
```bash
# Regenerate Prisma Client
docker compose exec app npx prisma generate
```

#### Build failures
```bash
# Clear Docker cache and rebuild
docker compose build --no-cache
```

### Development vs Production

**Development** (not containerized):
```bash
npm run dev
```

**Production** (Docker):
```bash
docker compose up
```

### Useful Commands

```bash
# View running containers
docker ps

# Shell into running container
docker compose exec app sh

# View application logs
docker compose logs app -f

# Restart container
docker compose restart app

# Remove all containers and volumes
docker compose down -v

# Rebuild and restart
docker compose up --build
```

## CI/CD Considerations

For production deployment:

1. **Build optimizations**: Already implemented with multi-stage builds
2. **Health checks**: Add health endpoint monitoring
3. **Secrets management**: Use proper secret management (AWS Secrets Manager, etc.)
4. **Database**: Ensure migrations run before deployment
5. **CDN**: Consider using CDN for static assets
6. **Monitoring**: Add logging and monitoring tools

## Security Notes

- Container runs as non-root user (nextjs:nodejs)
- Environment variables should never be committed
- Use `.dockerignore` to exclude sensitive files
- Keep base images updated for security patches
