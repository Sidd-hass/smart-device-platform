import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { exportDeviceLogs, getExportJobStatus } from "../services/exportService.js";
import { generateUsageReport } from "../services/device.service.js";

const router = express.Router();

// -------------------- GET export -------------------- //
router.get("/devices", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, format = "json" } = req.query;
    const result = await exportDeviceLogs(req.user.id, startDate, endDate, format);

    if (result.async) {
      return res.json({ success: true, jobId: result.id, message: "Async export job started" });
    }

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=device-logs.csv`);
      return res.send(result.data);
    }

    return res.json(JSON.parse(result.data));
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to export logs" });
  }
});

// -------------------- POST export -------------------- //
router.post("/devicelogs", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, format = "json" } = req.body;
    const result = await exportDeviceLogs(req.user.id, startDate, endDate, format);

    if (result.async) {
      return res.json({ success: true, jobId: result.id, message: "Async export job started" });
    }

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=device-logs.csv`);
      return res.send(result.data);
    }

    return res.json(JSON.parse(result.data));
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to export logs" });
  }
});

// -------------------- Check job status -------------------- //
router.get("/status/:jobId", authMiddleware, async (req, res) => {
  try {
    const jobData = await getExportJobStatus(req.params.jobId);
    if (!jobData) return res.status(404).json({ success: false, message: "Job not found" });
    res.json(jobData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to get job status" });
  }
});

// -------------------- Usage Report -------------------- //
router.post("/usage-report", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const report = await generateUsageReport(req.user.id, startDate, endDate);
    res.json({ success: true, report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to generate usage report" });
  }
});

export default router;
