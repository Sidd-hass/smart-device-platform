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

## 🚀 Setup & Run Locally (without Docker)

### 1. Clone the repository
```bash
git clone -b master https://github.com/Sidd-hass/smart-device-platform.git
cd smart-device-platform
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run tests (verify everything works)
```bash
npm run test
```
> Runs Jest test suite against in-memory MongoDB (no DB setup required).

### 4. Start the API
```bash
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

### List Devices
**GET** `/devices`

### Update Device
**PATCH** `/devices/:id`

### Delete Device
**DELETE** `/devices/:id`

---

## ❤️ Heartbeat

**POST** `/devices/:id/heartbeat`

---

## 📊 Data & Analytics

### Create Log Entry
**POST** `/devices/:id/logs`

### Fetch Last N Logs
**GET** `/devices/:id/logs?limit=10`

### Aggregated Usage
**GET** `/devices/:id/usage?range=24h`

---

## 🛡️ Rate Limiting

- **100 requests/min per user** (based on authenticated `user.id`; falls back to IP for unauthenticated).
- Exceeding the limit returns **HTTP 429** with standard rate-limit headers.

---

## ⏱️ Background Job

A cron job runs **every 15 minutes** to auto-deactivate devices that have:
- `status: "active"` **and**
- `last_active_at` is **older than 24h** or **null**

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


## API Testing with Postman

You can test the API endpoints using **Postman** or **Thunder Client**.

1. Import the provided collection or manually create requests.
2. For further details on API calls, check the `api_call_for_postman.txt` file in the root of the project.

---