import {
  createDevice,
  listDevices,
  updateDevice,
  deleteDevice,
  heartbeat,
} from "../services/device.service.js";

export async function registerDevice(req, res) {
  try {
    const payload = req.validated;
    const device = await createDevice(req.user.id, payload);
    return res.json({ success: true, device });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getDevices(req, res) {
  try {
    const { type, status } = req.query;
  const devices = await listDevices(req.user.id, { type, status });
    return res.json({ success: true, devices });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateDeviceDetails(req, res) {
  try {
    const updates = req.validated;
    const device = await updateDevice(req.params.id, req.user.id, updates);
    if (!device) return res.status(404).json({ success: false, message: "Device not found" });
    return res.json({ success: true, device });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function removeDevice(req, res) {
  try {
    const ok = await deleteDevice(req.params.id, req.user.id);
    if (!ok) return res.status(404).json({ success: false, message: "Device not found" });
    return res.json({ success: true, message: "Device removed" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function heartbeatDevice(req, res) {
  try {
    const { status } = req.validated;
    const hb = await heartbeat(req.params.id, req.user.id, status);
    if (!hb) return res.status(404).json({ success: false, message: "Device not found" });
    return res.json({
      success: true,
      message: "Device heartbeat recorded",
      last_active_at: hb.last_active_at,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
