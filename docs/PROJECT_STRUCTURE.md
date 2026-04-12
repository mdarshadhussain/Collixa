# Intent Marketplace - Project Structure

## ✅ Refactored Organization

The project has been reorganized into clear **Backend** and **Frontend** folders:

```
intent/
├── backend/                    # Express.js API Server
│   ├── src/
│   │   ├── config/            # Database & environment config
│   │   ├── controllers/       # HTTP request handlers
│   │   ├── services/          # Business logic
│   │   ├── models/            # Database queries
│   │   ├── routes/            # Express routes
│   │   ├── middlewares/       # Auth, validation, error handling
│   │   ├── utils/             # JWT, password utilities
│   │   └── server.js          # Main Express app
│   ├── .env                   # Backend environment variables
│   ├── package.json
│   └── README.md
│
├── frontend/                   # Next.js 14 React App
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API routes (integrate with backend)
│   │   ├── context/           # React contexts (AuthContext)
│   │   ├── [route]/           # Pages (dashboard, create, chat, etc)
│   │   └── globals.css
│   ├── components/            # Reusable React components
│   ├── lib/                   # Utilities & Supabase client
│   ├── .env.local             # Frontend environment variables
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── README.md
├── .gitignore
└── .env.local (root)          # Main env file
```

## 🚀 How to Run

### Backend
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:3001
```

## 📦 Technology Stack

**Backend:**
- Express.js 4.18
- Node.js with ES Modules
- Supabase PostgreSQL
- JWT Authentication
- Bcrypt password hashing
- Express Validator

**Frontend:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Lucide React Icons

## 🔧 Key Features Fixed

✅ **not-found.tsx** - Fixed missing `Link` import from next/link

✅ **Intent Creation** - Fixed RLS (Row-Level Security) issues
- Disabled RLS on `intents` and `users` tables for development
- Created separate error handling in API routes

✅ **Database Schema** - Added authentication columns to `users` table
- `password_hash` - For storing hashed passwords
- `role` - For user roles (USER, VERIFIED_USER, ADMIN)
- `updated_at` - For tracking updates
- `reset_otp` & `reset_otp_expiry` - For password reset

✅ **Project Organization** - Separated concerns
- Backend code isolated in `/backend`
- Frontend code isolated in `/frontend`
- Removed redundant files and test scripts

## 📝 Environment Variables

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://onjiimuhqjmzltvlellk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Backend** (`.env`):
```
SUPABASE_URL=https://onjiimuhqjmzltvlellk.supabase.co
SUPABASE_ANON_KEY=your_key_here
JWT_SECRET=your_jwt_secret
```

## 🎯 Next Steps

1. Install dependencies in both folders
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `cd frontend && npm run dev`
4. Test registration at http://localhost:3001
5. Create intents in the dashboard
6. Add more features (chat, skills, profile management)
