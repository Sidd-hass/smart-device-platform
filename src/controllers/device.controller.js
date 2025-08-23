import {
  createDevice,
  listDevices,
  updateDevice,
  deleteDevice,
  heartbeat,
} from "../services/device.service.js";

// ✅ helper: invalidate all device list keys for this user
async function invalidateDeviceListForUser(redis, userId) {
  if (!redis || !userId) return;
  const pattern = `devices:user:${userId}:list*`;

  try {
    let cursor = "0";
    const keys = [];

    do {
      // node-redis v4 returns an object { cursor, keys }
      const result = await redis.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });

      cursor = result.cursor;
      if (result.keys.length > 0) {
        keys.push(...result.keys.map(String));
      }
    } while (cursor !== "0");

    if (keys.length > 0) {
      console.log("Keys to delete:", keys);
      await redis.del(...keys);
      console.log(`🧹 invalidated ${keys.length} cache keys for user ${userId}`);
    }
  } catch (e) {
    console.warn("Cache invalidation error:", e.message);
  }
}

// 🚀 POST /devices → no caching, just invalidation
export async function registerDevice(req, res) {
  try {
    const payload = req.validated;
    const device = await createDevice(req.user.id, payload);

    // invalidate cache so GET reflects new device
    await invalidateDeviceListForUser(req.redis, req.user.id);

    return res.json({ success: true, device });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// 🚀 GET /devices → cache responses
export async function getDevices(req, res) {
  try {
    const { type, status } = req.query;

    // 🔑 Build cache key per user & filters
    const cacheKey = `devices:user:${req.user.id}:list:${type || "all"}:${status || "all"}`;

    // 1️⃣ Try cache first
    const cached = await req.redis.get(cacheKey);
    if (cached) {
      res.set("X-Cache", "HIT");
      return res.json(JSON.parse(cached));
    }

    // 2️⃣ Otherwise fetch from DB
    const devices = await listDevices(req.user.id, { type, status });

    // 3️⃣ Store in cache (TTL 15 mins)
    await req.redis.setEx(cacheKey, 900, JSON.stringify({ success: true, devices }));

    res.set("X-Cache", "MISS");
    return res.json({ success: true, devices });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// 🚀 PUT /devices/:id → no caching, just invalidation
export async function updateDeviceDetails(req, res) {
  try {
    const updates = req.validated;
    const device = await updateDevice(req.params.id, req.user.id, updates);
    if (!device) {
      return res.status(404).json({ success: false, message: "Device not found" });
    }

    await invalidateDeviceListForUser(req.redis, req.user.id);

    return res.json({ success: true, device });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// 🚀 DELETE /devices/:id → no caching, just invalidation
export async function removeDevice(req, res) {
  try {
    const ok = await deleteDevice(req.params.id, req.user.id);
    if (!ok) {
      return res.status(404).json({ success: false, message: "Device not found" });
    }

    await invalidateDeviceListForUser(req.redis, req.user.id);

    return res.json({ success: true, message: "Device removed" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// 🚀 POST /devices/:id/heartbeat → no caching, just invalidation
export async function heartbeatDevice(req, res) {
  try {
    const { status } = req.validated;
    const hb = await heartbeat(req.params.id, req.user.id, status);
    if (!hb) {
      return res.status(404).json({ success: false, message: "Device not found" });
    }

    await invalidateDeviceListForUser(req.redis, req.user.id);

    return res.json({
      success: true,
      message: "Device heartbeat recorded",
      last_active_at: hb.last_active_at,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
