import { exportDeviceLogs, getExportJobStatus } from "../services/export.service.js";

// Export endpoint
export async function exportLogsController(req, res) {
  try {
    const { userId } = req; // Assuming you have userId in request (from auth middleware)
    const { startDate, endDate, format } = req.body; // or req.query

    const result = await exportDeviceLogs(userId, startDate, endDate, format);

    if (result.async) {
      // Job scheduled
      return res.json({ message: "Export job started", jobId: result.id });
    }

    // Small dataset - return immediately
    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="device_logs.csv"`);
      return res.send(result.data);
    }

    return res.json(JSON.parse(result.data));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// Check job status endpoint
export async function exportJobStatusController(req, res) {
  try {
    const { jobId } = req.params;
    const status = await getExportJobStatus(jobId);
    if (!status) return res.status(404).json({ error: "Job not found" });
    res.json(status);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
