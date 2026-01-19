# Express Prisma API Template

A minimal Express.js REST API started template with Prisma ORM, JWT authentication, and Zod validation.

## Docker Setup (Recommended)

Quickest way to get started.

```bash
docker compose up -d
```

Validates:
- API accessible at `http://localhost:3500`
- PostgreSQL 18 database
- Automated migrations and client generation

Check logs:
```bash
docker compose logs -f
```

## Local Installation

If you prefer running without Docker.

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Update DATABASE_URL and secrets
   ```

3. **Database Setup**
   ```bash
   npm run build:prisma
   npx prisma migrate dev
   ```

4. **Run Application**
   ```bash
   npm run dev
   # or for production
   npm run build
   npm start
   ```

## Documentation

- **Swagger UI**: `http://localhost:3500/api-docs`
