import { createClient } from "redis";

export function createRedisClient() {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  const client = createClient({ url });

  client.on("connect", () => console.log("✅ Redis connected"));
  client.on("reconnecting", () => console.log("↻ Redis reconnecting..."));
  client.on("error", (err) => console.error("❌ Redis error:", err.message));

  // connect on startup
  // caller should ignore awaiting; redis will queue commands until connected
  client.connect().catch((e) => {
    console.error("❌ Redis connect failed:", e.message);
  });

  return client;
}
