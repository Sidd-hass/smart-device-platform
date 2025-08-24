import { io } from "socket.io-client";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";
const EMAIL = process.env.TEST_USER_EMAIL || "jojo@example.com";
const PASSWORD = process.env.TEST_USER_PASSWORD || "SecurePass123";

async function login() {
  try {
    const res = await axios.post(`${SERVER_URL}/auth/login`, {
      email: EMAIL,
      password: PASSWORD,
    });
    console.log("✅ Login successful. Token:", res.data.accessToken);
    return res.data;
  } catch (err) {
    if (err.response) {
      console.error("❌ Login failed:", err.response.status, err.response.data);
    } else if (err.request) {
      console.error("❌ No response from server:", err.request._header || err.request);
    } else {
      console.error("❌ Login error:", err.message);
    }
    throw err;
  }
}

async function start() {
  try {
    const loginData = await login();
    const token = loginData.accessToken;
    const userId = loginData.user.id;

    // Connect via WebSocket
    const socket = io(SERVER_URL, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("🟢 Connected with socket id:", socket.id);

      // Send initial heartbeat
      socket.emit("heartbeat", {
        deviceId: "68aafff431aed150fce220ca",
        status: "online",
      });
    });

    socket.on(`heartbeat:${userId}`, (data) => {
      console.log("💓 Heartbeat received:", data);
    });

    socket.on("disconnect", (reason) => console.log("🔴 Disconnected:", reason));
    socket.on("connect_error", (err) => console.error("❌ Connection error:", err.message));

    // Optional: send heartbeat every 30s
    setInterval(() => {
      socket.emit("heartbeat", {
        deviceId: "68a9d01460c445493f7ffb59",
        status: "online",
      });
      console.log("💡 Heartbeat sent...");
    }, 30000);
  } catch (err) {
    console.error("❌ Could not start WebSocket client due to login failure.");
  }
}

start();
