import mongoose from "mongoose";

const deviceLogSchema = new mongoose.Schema(
  {
    device_id: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true },
    event: { type: String, required: true },
    value: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const DeviceLog = mongoose.model("DeviceLog", deviceLogSchema);
export default DeviceLog;
