[guid]::NewGuid().ToString("N")             
a13356a1abcc43848f47e0a1e85f7535            

# Smart Device Platform API

A **Node.js + Express** REST API for managing IoT devices with:
- JWT authentication
- Per-user rate limiting (100 req/min)
- Device heartbeats and activity tracking
- Usage logs & simple analytics
- Background job to auto-deactivate inactive devices
- Jest test suite (uses in-memory MongoDB)
- Dockerized setup with MongoDB

---

## ✅ Prerequisites

- Node.js 18+ (for local dev)
- Docker & Docker Compose (for containerized run)
- (Optional) Local MongoDB if you run without Docker

---

## ⚙️ Environment Variables

Create a `.env` at the project root:

```env
PORT=3000
# For Dockerized MongoDB setup
MONGO_URI=mongodb://mongo:27017/smart_device_platform
# For local MongoDB setup, you can instead use:
# MONGO_URI=mongodb://localhost:27017/smart_device_platform
JWT_SECRET=a13356a1abcc43848f47e0a1e85f7535
JWT_EXPIRES_IN=1d
```

> **Note:** Tests use an in-memory MongoDB and do not use `MONGO_URI`.

---
### 1. Clone the repository
```bash
git clone <your-repo-url>
cd <your-project-folder>
```

## 🚀 Run Locally (without Docker)

```bash
npm install
npm start
# or: npm run dev   # if nodemon is configured
```

API base URL: `http://localhost:${PORT}` (defaults to `3000`).

---

## 🐳 Run with Docker

Build and start in detached mode:

```bash
docker compose up -d --build
```

- API: http://localhost:3000  
- MongoDB: exposed on `27017` (data persisted in `mongo_data` volume)

See logs:

```bash
docker compose logs -f api
```

Stop:

```bash
docker compose down
```

---

## 🔐 Authentication

### Sign Up
**POST** `/auth/signup`

**Request Body**
```json
{ "name": "John Doe", "email": "john@example.com", "password": "SecurePass123", "role": "user" }
```

**Sample cURL (Linux/macOS)**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"SecurePass123","role":"user"}'
```

> On Windows **PowerShell**, put everything on one line:
> ```powershell
> curl -Method POST http://localhost:3000/auth/signup -H "Content-Type: application/json" -Body '{"name":"John Doe","email":"john@example.com","password":"SecurePass123","role":"user"}'
> ```

### Login
**POST** `/auth/login`

**Request Body**
```json
{ "email": "john@example.com", "password": "SecurePass123" }
```

**Sample cURL**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123"}'
```

**Response**
```json
{ "success": true, "token": "<JWT_TOKEN>" }
```

Use this token as `Authorization: Bearer <JWT_TOKEN>` for protected endpoints.

---

## 📦 Devices API (protected)

All endpoints below require a valid `Authorization: Bearer <JWT_TOKEN>` header.

### Create Device
**POST** `/devices`

**Body**
```json
{ "name": "Living Room Light", "type": "light", "status": "active" }
```

**Response**
```json
{
  "success": true,
  "device": { "id": "d1", "name": "Living Room Light", "type": "light", "status": "active", "last_active_at": null, "owner_id": "u1" }
}
```

### List Devices
**GET** `/devices`

**Response**
```json
{
  "success": true,
  "devices": [
    { "id": "d1", "name": "Living Room Light", "type": "light", "status": "active", "last_active_at": null, "owner_id": "u1" }
  ]
}
```

### Update Device
**PATCH** `/devices/:id`

**Body** (example)
```json
{ "name": "Updated Light", "status": "inactive" }
```

**Response**
```json
{ "success": true, "device": { "id": "d1", "name": "Updated Light", "status": "inactive", "type": "light", "last_active_at": null } }
```

### Delete Device
**DELETE** `/devices/:id`

**Response**
```json
{ "success": true, "message": "Device deleted" }
```

---

## ❤️ Heartbeat

**POST** `/devices/:id/heartbeat`

**Sample Payload**
```json
{ "status": "active" }
```

**Sample Response**
```json
{
  "success": true,
  "message": "Device heartbeat recorded",
  "last_active_at": "2025-08-17T10:15:30Z"
}
```

---

## 📊 Data & Analytics

### Create Log Entry
**POST** `/devices/:id/logs`

**Body (example for smart meter)**
```json
{ "event": "units_consumed", "value": 2.5 }
```

### Fetch Last N Logs
**GET** `/devices/:id/logs?limit=10`

**Sample Response**
```json
{
  "success": true,
  "logs": [
    { "id": "l1", "event": "units_consumed", "value": 2.5, "timestamp": "2025-08-17T08:00:00Z" },
    { "id": "l2", "event": "units_consumed", "value": 1.2, "timestamp": "2025-08-17T09:00:00Z" }
  ]
}
```

### Aggregated Usage
**GET** `/devices/:id/usage?range=24h`

**Sample Response**
```json
{ "success": true, "device_id": "d2", "total_units_last_24h": 15.7 }
```

---

## 🛡️ Rate Limiting

- **100 requests/min per user** (based on authenticated `user.id`; falls back to IP for unauthenticated).
- Exceeding the limit returns **HTTP 429** with standard rate-limit headers.

---

## ⏱️ Background Job

A cron job runs **every 15 minutes** to auto-deactivate devices that have:
- `status: "active"` **and**
- `last_active_at` is **older than 24h** or **null**

Effect: sets `status` → `"inactive"`.

> The job starts automatically when the server connects to MongoDB. It is not run during tests (`NODE_ENV="test"`).

---

## 🧪 Tests

- Uses **Jest** + **Supertest**
- Spins up an **in-memory MongoDB** (no local DB required)
- Covers Auth + Devices CRUD + Heartbeat

Run:
```bash
npm run test
```

---

## 🧰 Troubleshooting

- **500 with `"req.body undefined"`**: Make sure you send `Content-Type: application/json` and a valid JSON body in Postman/cURL.
- **Windows cURL**: Prefer a single line command in PowerShell or use WSL. For CMD, avoid line continuations like `\`.
- **Docker cannot connect to Mongo**: Ensure `MONGO_URI=mongodb://mongo:27017/smart_device_platform` when using Compose and that the `mongo` service is healthy.

---

## 📌 Assumptions

- You have Docker installed if running via Compose.
- For local (non-Docker) runs you either have local MongoDB, or you change `MONGO_URI` accordingly.
- JWT secret and expiry are provided via `.env`.
- The system only needs **basic** log aggregation (e.g., last 24h sum) for demonstration purposes.

---
