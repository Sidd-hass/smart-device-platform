import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validateBody } from "../middleware/validate.js";
import { logCreateSchema } from "../validation/schemas.js";
import { createDeviceLog, fetchDeviceLogs, fetchDeviceUsage } from "../controllers/log.controller.js";
import { cache } from "../middleware/cache.js";

const analyticsTtl = Number(process.env.ANALYTICS_TTL_SECONDS || 300);

const router = express.Router({ mergeParams: true });

// All log routes require auth
router.use(authMiddleware);

// POST /devices/:id/logs → Create log entry
router.post("/logs", validateBody(logCreateSchema), createDeviceLog);

// GET /devices/:id/logs?limit=10 → Fetch last logs (not cached, real-time)
router.get("/logs", fetchDeviceLogs);

// GET /devices/:id/usage?range=24h → Aggregated usage (cached for 5 min)
router.get(
  "/usage",
  cache(analyticsTtl, (req) => {
    const userId = req.user?.id || "anon";
    const deviceId = req.params.id;
    const range = req.query.range || "24h";
    return `analytics:usage:user:${userId}:device:${deviceId}:range:${range}`;
  }),
  fetchDeviceUsage
);

export default router;
