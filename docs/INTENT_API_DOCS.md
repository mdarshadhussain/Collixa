# Intent API Documentation

Complete API reference for the Intent Collaboration system.

## Base URL

```
http://localhost:5000/api/intents
```

## Authentication

All protected endpoints require an `Authorization` header with a valid JWT token:

```headers
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### Creating Intents

#### Create Intent
- **Method:** `POST`
- **URL:** `/`
- **Auth:** ✅ Required
- **Body:**
```json
{
  "title": "String (3-100 chars)",
  "description": "String (10-1000 chars)",
  "category": "String",
  "location": "String",
  "timeline": "ISO8601 Date",
  "attachment_name": "String (optional)"
}
```
- **Response:**
```json
{
  "message": "Intent created successfully",
  "data": {
    "id": "uuid",
    "title": "...",
    "description": "...",
    "category": "...",
    "location": "...",
    "timeline": "2024-01-15T10:00:00Z",
    "status": "looking",
    "created_by": "user-uuid",
    "attachment_name": null,
    "created_at": "2024-01-14T10:00:00Z",
    "updated_at": "2024-01-14T10:00:00Z"
  }
}
```

---

### Browsing Intents

#### Get All Intents
- **Method:** `GET`
- **URL:** `/`
- **Auth:** ❌ Not required
- **Query Params:**
  - `category` (optional): Filter by category
  - `location` (optional): Filter by location
- **Response:**
```json
{
  "data": [...intents],
  "total": 45
}
```

#### Get Intent by ID
- **Method:** `GET`
- **URL:** `/:id`
- **Auth:** ❌ Not required
- **Response:**
```json
{
  "data": {
    "id": "uuid",
    "title": "...",
    "created_by": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar_url": "..."
    },
    "request_count": 5,
    "accepted_count": 2,
    ...
  }
}
```

#### Search Intents
- **Method:** `GET`
- **URL:** `/search/:keyword`
- **Auth:** ❌ Not required
- **Response:**
```json
{
  "data": [...matching_intents],
  "total": 12
}
```

#### Filter Intents
- **Method:** `GET`
- **URL:** `/filter`
- **Auth:** ❌ Not required
- **Query Params:**
  - `category` (optional): Filter by category
  - `location` (optional): Filter by location
- **Response:**
```json
{
  "data": [...filtered_intents],
  "total": 20
}
```

#### Get My Intents
- **Method:** `GET`
- **URL:** `/user/my-intents`
- **Auth:** ✅ Required
- **Response:**
```json
{
  "data": [...user_intents],
  "total": 8
}
```

---

### Managing Intents

#### Update Intent
- **Method:** `PATCH`
- **URL:** `/:id`
- **Auth:** ✅ Required (Must be intent creator)
- **Body:**
```json
{
  "title": "Updated title (optional)",
  "description": "Updated description (optional)",
  "category": "Updated category (optional)",
  "location": "Updated location (optional)",
  "timeline": "2024-02-15T10:00:00Z (optional)"
}
```
- **Response:**
```json
{
  "message": "Intent updated successfully",
  "data": {...updated_intent}
}
```

#### Complete Intent
- **Method:** `PATCH`
- **URL:** `/:id/complete`
- **Auth:** ✅ Required (Must be intent creator)
- **Response:**
```json
{
  "message": "Intent marked as completed",
  "data": {
    ...intent,
    "status": "completed",
    "completed_at": "2024-01-14T10:00:00Z"
  }
}
```

#### Delete Intent
- **Method:** `DELETE`
- **URL:** `/:id`
- **Auth:** ✅ Required (Must be intent creator)
- **Response:**
```json
{
  "message": "Intent deleted successfully"
}
```

---

### Collaboration Requests

#### Send Collaboration Request
- **Method:** `POST`
- **URL:** `/:id/request`
- **Auth:** ✅ Required
- **Body:** (Empty)
- **Response:**
```json
{
  "message": "Collaboration request sent successfully",
  "data": {
    "id": "uuid",
    "intent_id": "uuid",
    "user_id": "uuid",
    "status": "PENDING",
    "created_at": "2024-01-14T10:00:00Z",
    "updated_at": "2024-01-14T10:00:00Z"
  }
}
```
- **Error Cases:**
  - Cannot request own intent (400)
  - Already requested (400)
  - Intent not found (404)

#### Get Collaboration Requests
- **Method:** `GET`
- **URL:** `/:id/requests`
- **Auth:** ✅ Required (Must be intent creator)
- **Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "intent_id": "uuid",
      "user_id": "uuid",
      "status": "PENDING",
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "name": "Jane Doe",
        "avatar_url": "..."
      },
      "created_at": "2024-01-14T10:00:00Z"
    }
  ],
  "total": 3
}
```

#### Accept Collaboration Request
- **Method:** `PATCH`
- **URL:** `/requests/:requestId/accept`
- **Auth:** ✅ Required (Must be intent creator)
- **Response:**
```json
{
  "message": "Collaboration request accepted",
  "data": {
    ...request,
    "status": "ACCEPTED",
    "updated_at": "2024-01-14T10:00:00Z"
  }
}
```

#### Reject Collaboration Request
- **Method:** `PATCH`
- **URL:** `/requests/:requestId/reject`
- **Auth:** ✅ Required (Must be intent creator)
- **Response:**
```json
{
  "message": "Collaboration request rejected",
  "data": {
    ...request,
    "status": "REJECTED",
    "updated_at": "2024-01-14T10:00:00Z"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 403 Forbidden
```json
{
  "error": "Not authorized to perform this action"
}
```

### 404 Not Found
```json
{
  "error": "Intent not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

---

## Example Usage (Frontend)

### Create Intent
```javascript
const response = await fetch('/api/intents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Need a web developer',
    description: 'Looking for someone to help with React project',
    category: 'Development',
    location: 'Remote',
    timeline: new Date(Date.now() + 7*24*60*60*1000).toISOString()
  })
});
```

### Browse Intents
```javascript
const response = await fetch('/api/intents?category=Development&location=Remote');
const { data } = await response.json();
```

### Request Collaboration
```javascript
const response = await fetch(`/api/intents/${intentId}/request`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Accept Request
```javascript
const response = await fetch(`/api/requests/${requestId}/accept`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Database Schema

### intents table
```sql
- id (UUID, PRIMARY KEY)
- title (VARCHAR)
- description (TEXT)
- category (VARCHAR)
- location (VARCHAR)
- timeline (TIMESTAMP)
- status (VARCHAR: 'looking', 'completed')
- created_by (UUID, FOREIGN KEY -> users.id)
- attachment_name (VARCHAR, nullable)
- completed_at (TIMESTAMP, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### collaboration_requests table
```sql
- id (UUID, PRIMARY KEY)
- intent_id (UUID, FOREIGN KEY -> intents.id)
- user_id (UUID, FOREIGN KEY -> users.id)
- status (VARCHAR: 'PENDING', 'ACCEPTED', 'REJECTED')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(intent_id, user_id)
```

---

## Status Codes Summary

| Code | Meaning |
|------|---------|
| 200 | Success (GET, PATCH, DELETE) |
| 201 | Created (POST) |
| 400 | Bad Request / Validation Error |
| 403 | Forbidden / Not Authorized |
| 404 | Not Found |
| 500 | Server Error |

---

## Quick Reference

### Public Endpoints (No Auth)
- `GET /` - Get all intents
- `GET /:id` - Get intent details
- `GET /search/:keyword` - Search intents
- `GET /filter` - Filter intents

### Protected Endpoints (Auth Required)
- `POST /` - Create intent
- `PATCH /:id` - Update intent
- `PATCH /:id/complete` - Complete intent
- `DELETE /:id` - Delete intent
- `GET /user/my-intents` - Get my intents
- `POST /:id/request` - Send request
- `GET /:id/requests` - Get requests
- `PATCH /requests/:requestId/accept` - Accept request
- `PATCH /requests/:requestId/reject` - Reject request
