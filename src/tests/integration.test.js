// src/tests/integration.test.js
import request from "supertest";
import { io as ClientIO } from "socket.io-client";
import dotenv from "dotenv";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import app from "../index.js";
import { createRedisClient } from "../config/redisClient.js"; // ✅ import factory

dotenv.config();

let accessToken;
let refreshToken;
let userId;
let deviceId;

// server + io instance for WebSocket tests
let server;
let io;
let SERVER_URL;

// redis client (local to test)
let redisClient;

const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0];
const endDate = new Date().toISOString().split("T")[0];

beforeAll(async () => {
  // ✅ init redis client (already auto-connects inside createRedisClient)
  redisClient = createRedisClient();
  app.locals.redis = redisClient;

  // Spin up our own server for WebSocket tests
  server = http.createServer(app);
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Attach same auth middleware logic as in index.js
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error"));
    try {
      const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      socket.user = payload;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("heartbeat", (data) => {
      io.emit(`heartbeat:${socket.user.sub}`, data);
    });
  });

  await new Promise((resolve) => {
    server.listen(0, () => {
      const { port } = server.address();
      SERVER_URL = `http://localhost:${port}`;
      resolve();
    });
  });
}, 20000);

afterAll(async () => {
  if (io) io.close();
  if (server) server.close();

  // ✅ close mongoose connection
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }

  // ✅ close redis client
  if (redisClient) {
    await redisClient.quit();
  }
});

describe("Smart Device Platform - Full Integration Tests", () => {
  //
  // AUTH TESTS
  //
  describe("Auth Endpoints", () => {
    it("should register a new user", async () => {
      const res = await request(app).post("/auth/signup").send({
        name: "Test User",
        email: "testuser@example.com",
        password: "Password123",
        role: "user",
      });
      expect([201, 400]).toContain(res.statusCode);
    });

    it("should login and return tokens", async () => {
      const res = await request(app).post("/auth/login").send({
        email: "testuser@example.com",
        password: "Password123",
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
      userId = res.body.user?.id;
    });

    it("should refresh JWT token", async () => {
      const res = await request(app).post("/auth/refresh").send({ refreshToken });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      accessToken = res.body.accessToken;
    });
  });

  //
  // DEVICE TESTS
  //
  describe("Device Endpoints (CRUD + Heartbeat + Logs + Usage)", () => {
    it("should create a device", async () => {
      const res = await request(app)
        .post("/devices")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Living Room Light", type: "light", status: "active" });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      deviceId = res.body.device.id;
    });

    it("should list devices", async () => {
      const res = await request(app)
        .get("/devices")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.devices)).toBe(true);
    });

    it("should update a device", async () => {
      const res = await request(app)
        .patch(`/devices/${deviceId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ name: "Updated Light", status: "inactive" });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.device.status).toBe("inactive");
    });

    it("should record heartbeat", async () => {
      const res = await request(app)
        .post(`/devices/${deviceId}/heartbeat`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ status: "active" });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should create a log entry", async () => {
      const res = await request(app)
        .post(`/devices/${deviceId}/logs`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ event: "units_consumed", value: 2.5 });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should fetch last 10 logs", async () => {
      const res = await request(app)
        .get(`/devices/${deviceId}/logs?limit=10`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.logs || [])).toBe(true);
    });

    it("should fetch usage aggregation", async () => {
      const res = await request(app)
        .get(`/devices/${deviceId}/usage?range=24h`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("device_id", deviceId);
      expect(res.body).toHaveProperty("total_units_last_24h");
    });
  });

  //
  // EXPORT TESTS
  //
  describe("Export Endpoints", () => {
    it("should export device logs as CSV (POST)", async () => {
      const res = await request(app)
        .post("/export/devicelogs")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ startDate, endDate, format: "csv" });

      expect([200, 202]).toContain(res.statusCode);
      expect(typeof res.text).toBe("string");
      expect(res.text).toContain("device_id");
      expect(res.text).toContain("timestamp");
    });

    it("should export device logs as CSV (GET)", async () => {
      const res = await request(app)
        .get(`/export/devices?startDate=${startDate}&endDate=${endDate}&format=csv`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.statusCode).toBe(200);
      expect(typeof res.text).toBe("string");
      expect(res.text).toContain("device_id");
      expect(res.text).toContain("timestamp");
    });

    it("should export usage report (JSON)", async () => {
      const res = await request(app)
        .post("/export/usage-report")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ startDate, endDate });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("report");
    });
  });

  //
  // WEBSOCKET TEST
  //
  describe("WebSocket Heartbeat", () => {
    let socket;

    afterAll(() => {
      if (socket) socket.disconnect();
    });

    it("should connect and receive heartbeat", (done) => {
      socket = ClientIO(SERVER_URL, {
        auth: { token: accessToken },
        transports: ["websocket"],
        reconnectionAttempts: 1,
      });

      let doneCalled = false;

      socket.on("connect", () => {
        socket.emit("heartbeat", { deviceId, status: "online" });
      });

      socket.on(`heartbeat:${userId}`, (data) => {
        try {
          expect(data).toHaveProperty("deviceId", deviceId);
          expect(data).toHaveProperty("status", "online");
          if (!doneCalled) {
            doneCalled = true;
            done();
          }
        } catch (err) {
          if (!doneCalled) {
            doneCalled = true;
            done(err);
          }
        }
      });

      socket.on("connect_error", (err) => {
        if (!doneCalled) {
          doneCalled = true;
          done(err);
        }
      });
    }, 15000);
  });
});
