import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import responseTime from "response-time";
import http from "http";
import { Server as SocketIO } from "socket.io";
import jwt from "jsonwebtoken";

import authRoutes from "./routes/auth.js";
import deviceRoutes from "./routes/device.routes.js";
import userRoutes from "./routes/user.routes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import { perUserLimiter, authLimiter } from "./middleware/ratelimiter.js";
import { createRedisClient } from "./config/redisClient.js";
import exportRoutes from "./routes/export.routes.js";

dotenv.config();

const app = express();

// -------------------- Middleware -------------------- //
app.use(express.json());

// -------------------- CORS CONFIG -------------------- //
const allowedOrigins = ["http://localhost:3000", "http://example.com"];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("CORS not allowed"));
    },
    credentials: true,
  })
);

// -------------------- SECURITY HEADERS -------------------- //
app.use(helmet());

// -------------------- REQUEST LOGGING -------------------- //
morgan.token("remote-addr", (req) => {
  let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  if (ip && ip.includes(",")) ip = ip.split(",")[0].trim();
  if (ip === "::1") ip = "127.0.0.1";
  return ip;
});
app.use(
  morgan(":remote-addr :method :url :status :res[content-length] - :response-time ms")
);

// Log slow responses >500ms
app.use(
  responseTime((req, res, time) => {
    if (time > 500)
      console.warn(`⚠️ Slow request: ${req.method} ${req.originalUrl} - ${time.toFixed(0)} ms`);
  })
);

// -------------------- Redis client -------------------- //
const redisClient = createRedisClient();
app.use((req, res, next) => {
  req.redis = redisClient;
  next();
});

// -------------------- ROUTES -------------------- //
app.use("/auth", authLimiter, authRoutes);
app.use("/devices", authMiddleware, perUserLimiter, deviceRoutes);
app.use("/users", authMiddleware, perUserLimiter, userRoutes);
app.use("/export", exportRoutes);

app.get("/", (req, res) => res.send("API is running..."));

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Global Error Handler:", err);
  res.status(500).json({ success: false, message: "Something went wrong!" });
});

// -------------------- MongoDB + Server -------------------- //
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
      console.log("✅ MongoDB Connected");

      try {
        const { default: startInactiveDeviceJob } = await import("./jobs/inactiveDeviceJob.js");
        if (typeof startInactiveDeviceJob === "function") startInactiveDeviceJob();
      } catch (err) {
        console.error("⚠️ Failed to start inactive device job:", err.message);
      }

      // -------------------- HTTP + Socket.IO -------------------- //
      const PORT = process.env.PORT || 5000;
      const server = http.createServer(app);
      const io = new SocketIO(server, {
        cors: {
          origin: allowedOrigins,
          methods: ["GET", "POST"],
          credentials: true,
        },
      });

      // -------------------- Socket.IO JWT Auth -------------------- //
      io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error("Authentication error"));

        try {
          const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
          socket.user = payload;
          next();
        } catch (err) {
          console.error("❌ Socket JWT verification failed:", err.message);
          next(new Error("Invalid token"));
        }
      });

      io.on("connection", (socket) => {
        console.log(`🟢 User connected: ${socket.user.sub}`);

        socket.on("heartbeat", (data) => {
          io.emit(`heartbeat:${socket.user.sub}`, data);
        });

        socket.on("disconnect", (reason) => {
          console.log(`🔴 User disconnected: ${socket.user.sub}, reason: ${reason}`);
        });
      });

      server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error("❌ DB Connection Error:", err.message);
      process.exit(1);
    });
}

export default app;
