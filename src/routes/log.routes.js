import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validateBody } from "../middleware/validate.js";
import { logCreateSchema } from "../validation/schemas.js";
import { createDeviceLog, fetchDeviceLogs, fetchDeviceUsage } from "../controllers/log.controller.js";

const router = express.Router({ mergeParams: true });

// All log routes require auth
router.use(authMiddleware);

// POST /devices/:id/logs → Create log entry
router.post("/logs", validateBody(logCreateSchema), createDeviceLog);

// GET /devices/:id/logs?limit=10 → Fetch last logs
router.get("/logs", fetchDeviceLogs);

// GET /devices/:id/usage?range=24h → Aggregated usage
router.get("/usage", fetchDeviceUsage);

export default router;
