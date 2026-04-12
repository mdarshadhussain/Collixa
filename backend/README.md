# Intent Marketplace - Express Backend

A secure, scalable authentication and API backend for the Intent Marketplace built with Express.js and Supabase.

## Features

✅ **Authentication**
- User registration with email validation
- Secure login with JWT tokens
- Password hashing with bcrypt
- Password reset with OTP verification
- Role-based access control (USER, VERIFIED_USER, ADMIN)

✅ **Architecture**
- MVC pattern (Models, Views, Controllers)
- Service layer for business logic
- Middleware for auth, validation, error handling
- JWT utility functions
- Input validation with express-validator

✅ **Security**
- JWT token-based authentication
- Password hashing with bcrypt (10 salt rounds)
- CORS with origin whitelist
- Helmet for HTTP headers
- Request validation and error handling
- Protected routes with authMiddleware

✅ **Database**
- Supabase PostgreSQL integration
- User model with CRUD operations
- OTP storage for password reset

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── env.js           # Environment variables
│   │   └── database.js      # Supabase connection
│   ├── controllers/
│   │   └── AuthController.js # HTTP handlers
│   ├── services/
│   │   └── AuthService.js   # Business logic
│   ├── models/
│   │   └── User.js          # Database queries
│   ├── routes/
│   │   └── authRoutes.js    # Auth endpoints
│   ├── middlewares/
│   │   ├── authMiddleware.js      # JWT verification
│   │   ├── validation.js          # Input validation
│   │   └── errorHandler.js        # Global error handling
│   ├── utils/
│   │   ├── jwt.js           # JWT token utilities
│   │   └── password.js      # Hash & compare passwords
│   └── server.js            # Express app entry point
├── package.json
├── .env.example
└── README.md
```

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env with your Supabase credentials
nano .env
```

**Required variables:**
- `SUPABASE_URL` - From Supabase dashboard > Settings > General > Project URL
- `SUPABASE_ANON_KEY` - From Supabase dashboard > Settings > API > anon public
- `JWT_SECRET` - Generate a secure secret (use `openssl rand -hex 32`)
- `FRONTEND_URL` - Your Next.js frontend URL (default: http://localhost:3001)

### 3. Setup Supabase Database

Ensure your Supabase project has the following tables:

**users table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('USER', 'VERIFIED_USER', 'ADMIN')),
  is_verified BOOLEAN DEFAULT false,
  avatar_url TEXT,
  bio TEXT,
  location VARCHAR(255),
  reset_otp VARCHAR(6),
  reset_otp_expiry TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email ON users(email);
```

### 4. Run Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Server will start on `http://localhost:5000`

## API Endpoints

### Public Routes

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "user": { "id", "email", "name", "role", ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response: 200 OK
{
  "message": "Login successful",
  "user": { "id", "email", "name", "role", ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Forgot Password (Request OTP)
```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: 200 OK
{
  "message": "OTP sent to email",
  "otp": "123456" // Only in development
}
```

#### Reset Password
```
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePass123"
}

Response: 200 OK
{
  "message": "Password reset successfully"
}
```

### Protected Routes (Require Authorization Header)

#### Verify Token
```
GET /api/auth/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response: 200 OK
{
  "message": "Token is valid",
  "user": { "id", "email", "role", ... }
}
```

#### Get Profile
```
GET /api/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response: 200 OK
{
  "user": { "id", "email", "name", "bio", "location", "avatar_url", ... }
}
```

#### Update Profile
```
PUT /api/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "name": "Jane Doe",
  "bio": "Developer & Designer",
  "location": "San Francisco, CA",
  "avatar_url": "https://..."
}

Response: 200 OK
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

#### Change Password
```
POST /api/auth/change-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "currentPassword": "SecurePass123",
  "newPassword": "NewSecurePass123"
}

Response: 200 OK
{
  "message": "Password changed successfully"
}
```

#### Logout
```
POST /api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response: 200 OK
{
  "message": "Logged out successfully"
}
```

## Authentication Flow

### Registration & Login
1. User submits email + password to `/api/auth/register` or `/api/auth/login`
2. Password is hashed with bcrypt (10 rounds)
3. User record created/verified in Supabase
4. JWT token generated with user id + email + role
5. Token returned to frontend (store in localStorage or cookie)

### Protected Requests
1. Frontend sends JWT in Authorization header: `Authorization: Bearer <token>`
2. Backend middleware verifies token with JWT_SECRET
3. If valid, user info attached to request object
4. Route handler processes request
5. If invalid/expired, return 401 Unauthorized

### Password Reset
1. User requests OTP via `/api/auth/forgot-password`
2. 6-digit OTP generated, stored in DB with 5-min expiry
3. User receives OTP (via email in production)
4. User submits OTP + new password to `/api/auth/reset-password`
5. OTP validated (must match & not expired)
6. Password hashed and updated in DB
7. OTP cleared from DB

## Error Handling

All errors follow a standard format:
```json
{
  "error": "Error message",
  "details": [ /* validation errors */ ],
  "stack": "..." // Only in development
}
```

Common error codes:
- `400` - Validation failed or bad request
- `401` - Unauthorized (invalid credentials or token)
- `403` - Forbidden (insufficient permissions)
- `404` - User/resource not found
- `500` - Server error

## Development Tips

### Testing with cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"SecurePass123",
    "name":"John Doe"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"SecurePass123"
  }'

# Verify token
curl -X GET http://localhost:5000/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Testing with Postman

1. Create a Postman collection
2. Set collection variable: `base_url=http://localhost:5000`
3. Set collection variable: `token=` (will be set after login)
4. In login request, add post-script:
   ```javascript
   pm.environment.set("token", pm.response.json().token);
   ```
5. Use `{{token}}` in Authorization header for protected routes

## Production Checklist

- [ ] Change JWT_SECRET to a strong random value
- [ ] Set NODE_ENV=production
- [ ] Enable email sending for forgot password (remove OTP from response)
- [ ] Set up HTTPS/SSL
- [ ] Configure database backups
- [ ] Set up monitoring/logging
- [ ] Rate limiting on auth routes
- [ ] Enable RLS (Row Level Security) on Supabase
- [ ] Use environment-specific Supabase keys
- [ ] Review CORS origin whitelist
- [ ] Set up CI/CD pipeline

## License

MIT
