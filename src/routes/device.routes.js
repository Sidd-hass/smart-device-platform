import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validateBody } from "../middleware/validate.js";
import logRoutes from "./log.routes.js";
import { cache } from "../middleware/cache.js";

import {
  deviceCreateSchema,
  deviceUpdateSchema,
  heartbeatSchema,
} from "../validation/schemas.js";

import {
  registerDevice,
  getDevices,
  updateDeviceDetails,
  removeDevice,
  heartbeatDevice,
} from "../controllers/device.controller.js";

const deviceListTtl = Number(process.env.DEVICE_LIST_TTL_SECONDS || 1200);
const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

// POST /devices → Register new device
router.post("/", validateBody(deviceCreateSchema), registerDevice);

// GET /devices → Cached device list
router.get(
  "/",
  cache(deviceListTtl, (req) => {
    const userId = req.user?.id || "anon";
    const q = JSON.stringify(req.query || {});
    return `devices:user:${userId}:list:${q}`;
  }),
  getDevices
);

// PATCH /devices/:id → Update device details
router.patch("/:id", validateBody(deviceUpdateSchema), updateDeviceDetails);

// DELETE /devices/:id → Remove device
router.delete("/:id", removeDevice);

// POST /devices/:id/heartbeat → Device heartbeat
router.post("/:id/heartbeat", validateBody(heartbeatSchema), heartbeatDevice);

// Device-specific logs under /devices/:id/logs
router.use("/:id", logRoutes);

export default router;
