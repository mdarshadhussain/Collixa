# Intent Backend Implementation - Quick Setup Guide

## What Was Built

Complete backend API for the Intent Collaboration system with 13 endpoints supporting the full workflow:
**Create Intent → Browse Dashboard → Request Collaboration → Accept/Reject → Complete**

## Files Created

### Core API Layer
- **`backend/src/models/Intent.js`** (165 lines)
  - CRUD operations for intents
  - Collaboration request management
  - User relationship queries
  
- **`backend/src/services/IntentService.js`** (240 lines)
  - Business logic & filtering
  - Authorization checks
  - Collaboration request workflows

- **`backend/src/controllers/intent.controller.js`** (280 lines)
  - 13 API request handlers
  - Input validation
  - Error handling

- **`backend/src/routes/intent.routes.js`** (220 lines)
  - 13 API endpoints
  - Express-validator validation rules
  - Authentication middleware integration

### Utilities
- **`backend/src/utils/validation.js`** (110 lines)
  - Input validation schemas
  - Joi validators for future use

- **`backend/src/utils/initDatabase.js`** (90 lines)
  - Automatic collaboration_requests table setup
  - Manual SQL instructions for Supabase

### Documentation
- **`backend/INTENT_API_DOCS.md`** (500+ lines)
  - Complete API reference
  - All endpoints with examples
  - Error responses & database schema

## Files Modified

- **`backend/src/server.js`**
  - Registered intent routes
  - Added database initialization
  - Updated console logs

## API Endpoints (13 Total)

### Intent CRUD
```
POST   /api/intents              - Create intent (auth required)
GET    /api/intents              - List all intents
GET    /api/intents/:id          - Get specific intent
PATCH  /api/intents/:id          - Update intent (auth required)
DELETE /api/intents/:id          - Delete intent (auth required)
PATCH  /api/intents/:id/complete - Mark completed (auth required)
```

### User & Discovery
```
GET    /api/intents/user/my-intents     - Get my intents (auth required)
GET    /api/intents/search/:keyword     - Search intents
GET    /api/intents/filter              - Filter by category/location
```

### Collaboration Requests
```
POST   /api/intents/:id/request         - Send request (auth required)
GET    /api/intents/:id/requests        - Get requests (auth required)
PATCH  /api/requests/:requestId/accept  - Accept request (auth required)
PATCH  /api/requests/:requestId/reject  - Reject request (auth required)
```

## Validation

All inputs validated with express-validator:
- ✅ Title: 3-100 characters
- ✅ Description: 10-1000 characters
- ✅ Category & location: Required
- ✅ Timeline: Valid ISO8601 date
- ✅ Attachment name: Optional, max 255 chars
- ✅ UUID validation on IDs

## Authorization

- Only intent creator can: update, delete, complete, view requests
- Only intent creator can: accept/reject collaboration requests
- Cannot request collaboration on own intent
- Cannot request twice on same intent

## Database Requirements

The implementation expects:
- **intents table** (already exists in your DB)
- **collaboration_requests table** (auto-created on server startup)

```sql
-- Auto-created schema:
CREATE TABLE collaboration_requests (
  id UUID PRIMARY KEY,
  intent_id UUID FOREIGN KEY,
  user_id UUID FOREIGN KEY,
  status VARCHAR(20),  -- PENDING, ACCEPTED, REJECTED
  created_at TIMESTAMP,
  UNIQUE(intent_id, user_id)
);
```

## How to Test

### 1. Start Backend
```bash
cd backend
npm run dev
```

You should see:
```
✨ Server running on http://localhost:5000
[INTENT ROUTES]
  POST   /api/intents
  GET    /api/intents
  ...
🔄 Initializing database...
✅ collaboration_requests table already exists
```

### 2. Test with Frontend

The frontend (Next.js) already has:
- ✅ Create intent form → will POST to `/api/intents`
- ✅ Dashboard → will GET from `/api/intents`
- Just needs integration for request/accept flows

### 3. Test with cURL

```bash
# Create intent
curl -X POST http://localhost:5000/api/intents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Need a React Developer",
    "description": "Looking for someone to help build a real-time dashboard",
    "category": "Development",
    "location": "Remote",
    "timeline": "2024-02-15T10:00:00Z"
  }'

# Get all intents
curl http://localhost:5000/api/intents

# Get intent by ID
curl http://localhost:5000/api/intents/INTENT_UUID

# Search intents
curl http://localhost:5000/api/intents/search/react

# Filter intents
curl "http://localhost:5000/api/intents/filter?category=Development&location=Remote"
```

## Frontend Integration Checklist

- [ ] Dashboard page fetches from GET `/api/intents` ← Already coded!
- [ ] Create page POSTs to `/api/intents` ← Already coded!
- [ ] Add intent details page: `app/intent/[id]/page.tsx`
- [ ] Add "Join/Request" button with POST to `/api/intents/:id/request`
- [ ] Add requests view to see pending requests
- [ ] Add accept/reject buttons with PATCH endpoints
- [ ] Display request status in UI

## Error Handling

All endpoints return proper HTTP status codes:
- **200** - Success
- **201** - Created
- **400** - Validation error or invalid request
- **403** - Not authorized
- **404** - Intent/Request not found
- **500** - Server error

Example error response:
```json
{
  "error": "Not authorized to update this intent"
}
```

## Performance Features

- ✅ Indexed database queries (intent_id, user_id, status)
- ✅ Relationships loaded in single query (user details with intent)
- ✅ Efficient filtering with database queries
- ✅ Proper pagination ready (can add limit/offset)

## Security Features

- ✅ JWT authentication on protected endpoints
- ✅ Authorization checks (creator-only operations)
- ✅ Input validation & sanitization
- ✅ UUID validation
- ✅ SQL injection protection (via Supabase)
- ✅ CORS configured
- ✅ Helmet security headers

## What's Next

### If you want to extend:

1. **File Attachments**
   - Add AWS S3/Supabase Storage integration
   - Store file URLs in `attachment_name` field

2. **Notifications**
   - Email notifications on collaboration requests
   - Use existing EmailService from auth system

3. **Messages**
   - Add messaging between collaborators
   - Real-time updates with WebSocket

4. **Ratings**
   - User ratings after collaboration
   - Reputation system

5. **Analytics**
   - View count per intent
   - Popular categories/locations
   - Response rate tracking

## Dependencies

All required packages already installed:
- ✅ express
- ✅ express-validator
- ✅ @supabase/supabase-js
- ✅ jsonwebtoken
- ✅ bcryptjs
- ✅ cors
- ✅ helmet
- ✅ nodemailer (from auth system)

No new packages needed! ✨

## Documentation Files

See detailed docs:
- [`backend/INTENT_API_DOCS.md`](./INTENT_API_DOCS.md) - Complete API reference with examples
- Auth system: `backend/EMAIL_QUICK_START.md`
- Auth system: `backend/EMAIL_DEPLOYMENT_GUIDE.md`

---

**Status: ✅ READY FOR TESTING**

All 13 endpoints implemented and ready to use. Backend fully supports the complete collaboration workflow!
