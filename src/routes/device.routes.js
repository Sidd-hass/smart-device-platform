import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validateBody } from "../middleware/validate.js";
import logRoutes from "./log.routes.js";
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

const router = express.Router();

router.use(authMiddleware);

// POST /devices
router.post("/", validateBody(deviceCreateSchema), registerDevice);

// GET /devices
router.get("/", getDevices);

// PATCH /devices/:id
router.patch("/:id", validateBody(deviceUpdateSchema), updateDeviceDetails);

// DELETE /devices/:id
router.delete("/:id", removeDevice);

// POST /devices/:id/heartbeat
router.post("/:id/heartbeat", validateBody(heartbeatSchema), heartbeatDevice);

router.use("/:id", logRoutes);

export default router;