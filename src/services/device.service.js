import Device from "../models/Device.js";

export function toDeviceResponse(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    type: doc.type,
    status: doc.status,
    last_active_at: doc.last_active_at ? doc.last_active_at.toISOString() : null,
    owner_id: doc.owner_id.toString(),
  };
}

export async function createDevice(ownerId, payload) {
  const device = await Device.create({ ...payload, owner_id: ownerId });
  return toDeviceResponse(device);
}

export async function listDevices(ownerId, { type, status }) {
  const query = { owner_id: ownerId };
  if (type) query.type = type;
  if (status) query.status = status;
  const devices = await Device.find(query).sort({ createdAt: -1 }).lean();
  return devices.map(d => ({
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
