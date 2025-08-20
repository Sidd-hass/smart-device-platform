import { createLog, getLogs, getUsage } from "../services/log.service.js";

export async function createDeviceLog(req, res) {
  try {
    const log = await createLog(req.params.id, req.validated);
    return res.json({ success: true, log });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function fetchDeviceLogs(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const logs = await getLogs(req.params.id, limit);
    return res.json({ success: true, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function fetchDeviceUsage(req, res) {
  try {
    const range = req.query.range || "24h";
    const hours = parseInt(range.replace("h", ""));
    const usage = await getUsage(req.params.id, hours);
    return res.json({ success: true, ...usage });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
