import Device from "../models/Device.js";
import DeviceLog from "../models/DeviceLog.js";
import mongoose from "mongoose";

// -------------------- Helper -------------------- //
export function toDeviceResponse(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    type: doc.type,
    status: doc.status,
    last_active_at: doc.last_active_at
      ? doc.last_active_at.toISOString()
      : null,
    owner_id: doc.owner_id.toString(),
  };
}

// -------------------- Device CRUD -------------------- //
export async function createDevice(ownerId, payload) {
  const device = await Device.create({ ...payload, owner_id: ownerId });
  return toDeviceResponse(device);
}

export async function listDevices(ownerId, { type, status }) {
  const query = { owner_id: ownerId };
  if (type) query.type = type;
  if (status) query.status = status;

  const devices = await Device.find(query).sort({ createdAt: -1 }).lean();
  return devices.map((d) => ({
    id: d._id.toString(),
    name: d.name,
    type: d.type,
    status: d.status,
    last_active_at: d.last_active_at ? d.last_active_at.toISOString() : null,
    owner_id: d.owner_id.toString(),
  }));
}

export async function updateDevice(deviceId, ownerId, updates) {
  const updated = await Device.findOneAndUpdate(
    { _id: deviceId, owner_id: ownerId },
    { $set: updates },
    { new: true }
  );
  if (!updated) return null;
  return toDeviceResponse(updated);
}

export async function deleteDevice(deviceId, ownerId) {
  const res = await Device.deleteOne({ _id: deviceId, owner_id: ownerId });
  return res.deletedCount > 0;
}

export async function heartbeat(deviceId, ownerId, status) {
  const update = { last_active_at: new Date() };
  if (status) update.status = status;

  const updated = await Device.findOneAndUpdate(
    { _id: deviceId, owner_id: ownerId },
    { $set: update },
    { new: true }
  );
  if (!updated) return null;
  return {
    last_active_at: updated.last_active_at.toISOString(),
    status: updated.status,
  };
}

// -------------------- Export / Logs -------------------- //
export async function fetchDeviceLogs(userId, startDate, endDate) {
  const ownerObjectId = mongoose.isValidObjectId(userId)
    ? new mongoose.Types.ObjectId(userId)
    : null;

  if (!ownerObjectId) throw new Error("Invalid userId");

  const devices = await Device.find({ owner_id: ownerObjectId })
    .select("_id")
    .lean();
  if (devices.length === 0) return [];

  const deviceIds = devices.map((d) => new mongoose.Types.ObjectId(d._id));

  let start, end;
  if (startDate) {
    start = new Date(startDate);
    if (isNaN(start)) throw new Error(`Invalid startDate: ${startDate}`);
  }
  if (endDate) {
    end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
  }

  const timestampQuery = {};
  if (start) timestampQuery.$gte = start;
  if (end) timestampQuery.$lte = end;

  const query = {
    device_id: { $in: deviceIds },
    ...(start || end ? { timestamp: timestampQuery } : {}),
  };

  console.log("🔍 DeviceLog Query:", query);

  const logs = await DeviceLog.find(query).sort({ timestamp: -1 }).lean();
  console.log("✅ Logs fetched:", logs.length);

  return logs;
}

// -------------------- Usage Report / Chart -------------------- //
export async function generateUsageReport(userId, startDate, endDate) {
  const logs = await fetchDeviceLogs(userId, startDate, endDate);
  if (logs.length === 0) return { message: "No data", report: {} };

  const report = {};

  logs.forEach((log) => {
    const deviceId = log.device_id.toString();
    const dateKey = new Date(log.timestamp).toISOString().split("T")[0]; // YYYY-MM-DD

    if (!report[deviceId]) {
      report[deviceId] = {
        totalEvents: 0,
        dailyUsage: {},
      };
    }

    report[deviceId].totalEvents += 1;

    if (!report[deviceId].dailyUsage[dateKey]) {
      report[deviceId].dailyUsage[dateKey] = {
        events: 0,
        totalValue: 0,
      };
    }

    report[deviceId].dailyUsage[dateKey].events += 1;
    report[deviceId].dailyUsage[dateKey].totalValue += log.value || 0;
  });

  return report;
}
