# Smart Device Platform API

A **Node.js + Express + MongoDB + Redis** REST API for managing IoT devices, with full **real-time device monitoring, analytics, caching, and secure authentication**.  

**Key Features Completed:**

- JWT-based authentication with **access & refresh tokens**
- Redis caching for device lists, user data, and analytics queries
- Device heartbeats and activity tracking
- Real-time device status updates via **WebSocket**
- Usage logs & aggregated analytics
- Async export of device logs (JSON/CSV) with job status tracking
- Jest test suite (uses in-memory MongoDB)
- Dockerized setup with MongoDB & Redis  

---

## ✅ Prerequisites

- Node.js 18+  
- Docker & Docker Compose  
- Redis (Dockerized or local)  
- Postman / Thunder Client for API testing  

---

## ⚙️ Environment Variables

Create `.env` at project root:

PORT=3000  
MONGO_URI=mongodb://localhost:27018/sdm  
REDIS_URL=redis://localhost:6379  

# Cache TTLs  
DEVICE_LIST_TTL_SECONDS=1200  
USER_DATA_TTL_SECONDS=1800  
ANALYTICS_TTL_SECONDS=300  

# JWT Tokens  
ACCESS_TOKEN_SECRET=...  
REFRESH_TOKEN_SECRET=...  
ACCESS_TOKEN_EXPIRES_IN=15m  
REFRESH_TOKEN_EXPIRES_IN=7d  

NODE_ENV=development  

> Note: Your Postman requests need a valid JWT token (access token) in the Authorization header.

---

## 🚀 Setup & Run Locally

git clone -b master <repo-url>  
cd smart-device-platform  
npm install  
npm run test   # run Jest tests (in-memory MongoDB)  
npm run dev    # start API server with nodemon  

API base URL: http://localhost:3000

---

## 🐳 Run with Docker Compose

docker compose up -d --build  

- API: http://localhost:3000  
- MongoDB: 27018 (mapped locally)  
- Redis: 6379  

Check logs:

docker compose logs -f api  

Stop services:

docker compose down  

---

## 🔐 Authentication

### Sign Up
**POST** `/auth/signup`

**Request Body**  
{ "name": "John Doe", "email": "john@example.com", "password": "SecurePass123", "role": "user" }

**cURL Example**  
curl -X POST http://localhost:3000/auth/signup -H "Content-Type: application/json" -d '{"name":"John Doe","email":"john@example.com","password":"SecurePass123","role":"user"}'

### Login
**POST** `/auth/login`

**Request Body**  
{ "email": "john@example.com", "password": "SecurePass123" }

**Response**  
{ "success": true, "token": "<JWT_TOKEN>" }

Use `Authorization: Bearer <JWT_TOKEN>` for all protected endpoints.

---

## 📦 Devices API (Protected)

| Endpoint | Method | Description |
|----------|--------|------------|
| /devices | POST | Create device |
| /devices | GET | List devices |
| /devices/:id | PATCH | Update device |
| /devices/:id | DELETE | Delete device |
| /devices/:id/heartbeat | POST | Update heartbeat |

**Sample cURL**  
curl -X POST http://localhost:3000/devices -H "Authorization: Bearer <JWT_TOKEN>" -H "Content-Type: application/json" -d '{"name":"Living Room Light","type":"light","status":"active"}'

---

## 📊 Data Export & Reporting

### Export Device Logs
**GET** `/export/devices`  
**POST** `/export/devicelogs`

**Query / Body Parameters**  
{ "startDate": "2025-08-01", "endDate": "2025-08-23", "format": "json" }  

**Async Export Example**  
If logs > 50 entries, returns:  
{ "success": true, "jobId": "abcd-1234-efgh", "message": "Async export job started" }

**Check Status**  
**GET** `/export/status/<jobId>`

**cURL Example**  
curl -X POST http://localhost:3000/export/devicelogs -H "Authorization: Bearer <JWT_TOKEN>" -H "Content-Type: application/json" -d '{"startDate":"2025-08-01","endDate":"2025-08-23","format":"json"}'

### Usage Reports / Charts
Aggregates logs by device and date  

**Example Response**  
{ "68aa14e1658cae8e8c913018": { "totalEvents": 1, "dailyUsage": { "2025-08-23": { "events": 1, "totalValue": 2.5 } } } }

---

## ⚡ Real-time Device Status (WebSocket)

Run `node wsTest.js` after starting API & Docker Compose.  

Connect via WebSocket to receive heartbeat events in real time:  

const ws = new WebSocket("ws://localhost:3000?token=<JWT_TOKEN>");  
ws.on("message", (msg) => console.log(msg));

---

## 🛡️ Rate Limiting

100 requests/min per user  
Exceeding returns **HTTP 429**

---

## ⏱️ Background Job

Cron runs every 15 min  
Deactivates devices inactive >24h  

---

## 🧪 Testing Steps

1. **Auth**: Sign up → login → get JWT  
2. **Device CRUD**: Create, list, update, delete devices  
3. **Heartbeat**: POST `/devices/:id/heartbeat` → verify updated status  
4. **Export**: POST `/export/devicelogs` → test JSON & CSV  
   - GET `/export/status/<jobId>` for async jobs  
5. **Analytics**: GET `/devices/:id/usage?range=24h` → confirm aggregated totals  
6. **WebSocket**: Run `wsTest.js` → verify real-time heartbeat events  

You can test all endpoints in Postman / Thunder Client using the provided collection.

---

## ⚠️ Notes for Testers

- Use `PORT=3000`, `MONGO_URI=mongodb://localhost:27018/sdm`, `REDIS_URL=redis://localhost:6379`  
- Docker Compose must be running for MongoDB + Redis  
- Async export jobs simulate email notification via console logs
