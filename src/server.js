// src/server.js
import http from "http";
import mongoose from "mongoose";
import { Server as SocketIO } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import app from "./index.js";
import { createRedisClient } from "./config/redisClient.js";

dotenv.config();
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1) Mongo
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");

    // 2) Redis
    const redisClient = createRedisClient();
    app.locals.redis = redisClient; // <-- inject into app for routes

    // 3) HTTP + Socket.IO
    const server = http.createServer(app);
    const io = new SocketIO(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    // Socket auth
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
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

// avoid starting when running tests
if (process.env.NODE_ENV !== "test") {
  startServer();
}

export { startServer }; // optional export (e.g., for custom runners)
