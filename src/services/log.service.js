import DeviceLog from "../models/DeviceLog.js";

export async function createLog(deviceId, payload) {
  const log = await DeviceLog.create({ device_id: deviceId, ...payload });
  return {
    id: log._id.toString(),
    event: log.event,
    value: log.value,
    timestamp: log.timestamp.toISOString(),
  };
}

export async function getLogs(deviceId, limit = 10) {
  const logs = await DeviceLog.find({ device_id: deviceId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();

  return logs.map(log => ({
    id: log._id.toString(),
    event: log.event,
    value: log.value,
    timestamp: log.timestamp.toISOString(),
  }));
}

export async function getUsage(deviceId, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const logs = await DeviceLog.find({ device_id: deviceId, timestamp: { $gte: since } });
  const total_units_last_24h = logs.reduce((sum, log) => sum + (log.value || 0), 0);

  return { device_id: deviceId, total_units_last_24h };
}
