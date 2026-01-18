# InDesk API

A robust Express.js REST API with Prisma ORM, JWT authentication, and comprehensive security features.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication with access & refresh tokens
  - Token rotation and reuse detection
  - Token blacklist for immediate revocation
  - Standard JWT claims (sub, jti, iss, aud)
  - Role-based access control (RBAC)
  - Permission-based authorization

- **Security**
  - Helmet.js for HTTP headers security
  - Rate limiting
  - CORS configuration
  - Input validation with Joi
  - Password hashing with bcrypt
  - Token family tracking for security

- **Database**
  - PostgreSQL with Prisma ORM
  - Type-safe database queries
  - Automated migrations
  - Transaction support

- **Integrations**
  - Stripe payment processing
  - Firebase Cloud Messaging (FCM)
  - Google Calendar API
  - Zoom integration
  - Xero accounting
  - Mailchimp marketing

- **Developer Experience**
  - TypeScript for type safety
  - Swagger/OpenAPI documentation
  - Hot reload with nodemon
  - Comprehensive logging with Winston
  - Socket.io for real-time features

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd indesk-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server
NODE_ENV=development
PORT=3500
BACKEND_IP=localhost
BACKEND_URL=http://localhost:3500
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/indesk

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_ACCESS_EXPIRY=3d
JWT_REFRESH_EXPIRY=30d
JWT_ISSUER=indesk-api
JWT_AUDIENCE=indesk-app

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

4. **Generate Prisma client**
```bash
npm run build:prisma
```

5. **Run database migrations**
```bash
npx prisma migrate dev
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
Server runs on `http://localhost:3500`

### Production Build
```bash
npm run build
npm start
```

### Generate API Documentation
```bash
npm run docs
```
Access docs at `http://localhost:3500/api-docs`

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:3500/api-docs`
- **Postman Collection**: Import `InDesk API - Complete Collection.postman_collection.json`

## 🔐 Authentication

### Enhanced JWT System

This API uses an enhanced JWT authentication system with:

- **Standard JWT Claims**: Uses `sub` (subject) instead of custom `_id`
- **Token Tracking**: Each token has a unique `jti` (JWT ID)
- **Token Rotation**: Refresh tokens are rotated on each use
- **Reuse Detection**: Detects and prevents token theft
- **Blacklist Support**: Access tokens can be immediately revoked

### Login Flow

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "access": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2026-01-21T00:00:00.000Z"
  },
  "refresh": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2026-02-17T00:00:00.000Z"
  }
}
```

### Using Access Tokens

```bash
GET /api/v1/protected-route
Authorization: Bearer <access_token>
```

### Refreshing Tokens

```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Logout

```bash
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## 📁 Project Structure

```
├── src/
│   ├── configs/          # Configuration files
│   │   ├── env.ts        # Environment variables
│   │   ├── passport.ts   # JWT strategy
│   │   ├── prisma.ts     # Database client
│   │   ├── tokens.ts     # Token types
│   │   └── ...
│   ├── middlewares/      # Express middlewares
│   │   ├── auth.ts       # Authentication middleware
│   │   └── ...
│   ├── modules/          # Feature modules
│   │   ├── auth/         # Authentication
│   │   ├── user/         # User management
│   │   ├── token/        # Token management
│   │   └── ...
│   ├── utils/            # Utility functions
│   │   ├── jwt.ts        # JWT utilities
│   │   ├── tokenBlacklist.ts  # Token blacklist
│   │   ├── logger.ts     # Winston logger
│   │   └── ...
│   ├── docs/             # API documentation
│   ├── scripts/          # Utility scripts
│   └── index.ts          # Application entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── generated/            # Generated Prisma client
├── .env.example          # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run docs` | Generate Swagger documentation |
| `npm run build:prisma` | Generate Prisma client |

## 🔒 Security Features

### Token Security
- ✅ Token rotation on refresh
- ✅ Token reuse detection
- ✅ Token family tracking
- ✅ Access token blacklist
- ✅ Automatic token cleanup

### Request Security
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation
- ✅ SQL injection prevention (Prisma)

### Authentication Security
- ✅ Bcrypt password hashing
- ✅ JWT with standard claims
- ✅ Issuer and audience validation
- ✅ Algorithm specification (HS256)
- ✅ Role-based access control

## 📖 Enhanced Authentication Documentation

For detailed information about the enhanced authentication system:

- **Quick Start**: See `QUICK_START.md`
- **Full Documentation**: See `AUTH_ENHANCEMENTS.md`
- **Token Flow**: See `TOKEN_FLOW.md`
- **Changes Summary**: See `CHANGES_SUMMARY.md`

## 🧪 Testing

### Test Authentication
```bash
# Login
curl -X POST http://localhost:3500/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Access protected route
curl -X GET http://localhost:3500/api/v1/user/profile \
  -H "Authorization: Bearer <access_token>"

# Refresh token
curl -X POST http://localhost:3500/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token>"}'
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -U postgres

# Test connection
npx prisma db pull
```

### JWT Token Issues
```bash
# Verify token at jwt.io
# Check JWT_SECRET is set correctly
# Ensure JWT_ISSUER and JWT_AUDIENCE match
```

### Build Errors
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build:prisma
npm run build
```

## 📝 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Server port | No | `3500` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_ACCESS_EXPIRY` | Access token expiry | No | `3d` |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | No | `30d` |
| `JWT_ISSUER` | JWT issuer claim | No | `indesk-api` |
| `JWT_AUDIENCE` | JWT audience claim | No | `indesk-app` |
| `SMTP_HOST` | Email SMTP host | Yes | - |
| `SMTP_PORT` | Email SMTP port | Yes | - |
| `SMTP_USERNAME` | Email username | Yes | - |
| `SMTP_PASSWORD` | Email password | Yes | - |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes | - |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- Express.js for the web framework
- Prisma for the ORM
- Passport.js for authentication
- All other open-source contributors

## 📞 Support

For issues and questions:
- Check the documentation files in the root directory
- Review the API documentation at `/api-docs`
- Check logs in the console for detailed error messages

---

**Built with ❤️ using Express.js, TypeScript, and Prisma**
