import { createRedisClient } from "../config/redisClient.js";
import { fetchDeviceLogs } from "./device.service.js";
import crypto from "crypto";
import { Parser as Json2CsvParser } from "json2csv";
import mongoose from "mongoose";

const redisClient = createRedisClient();

export async function exportDeviceLogs(userId, startDate, endDate, format = "json") {
  // 1️⃣ Fetch logs directly as strings (let fetchDeviceLogs handle ObjectId)
  const logs = await fetchDeviceLogs(userId, startDate, endDate);

  console.log("✅ User ID:", userId);
  console.log("✅ Start Date:", startDate);
  console.log("✅ End Date:", endDate);
  console.log("✅ Logs fetched:", logs.length);

  // 2️⃣ Map logs to CSV/JSON fields
  const defaultFields = ["device_id", "event", "value", "timestamp"];
  const mappedLogs = logs.map(log => ({
    device_id: log.device_id.toString(),
    event: log.event,
    value: log.value,
    timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : "",
  }));

  // 3️⃣ Handle large datasets async
  if (mappedLogs.length > 50) {
    const jobId = crypto.randomUUID();
    await redisClient.set(`export:${jobId}`, JSON.stringify({ status: "processing" }), "EX", 3600);

    process.nextTick(async () => {
      let output;
      if (format === "csv") {
        const parser = new Json2CsvParser({ fields: defaultFields });
        output = parser.parse(mappedLogs);
      } else {
        output = JSON.stringify(mappedLogs);
      }

      await redisClient.set(`export:${jobId}`, JSON.stringify({ status: "ready", data: output }), "EX", 3600);
      
      // Email simulation for large dataset
      console.log(`📧 Export job ${jobId} ready for user ${userId} (async large dataset)`);
    });

    return { async: true, id: jobId };
  }

  // 4️⃣ Small dataset - return immediately
  let output;
  if (format === "csv") {
    const parser = new Json2CsvParser({ fields: defaultFields });
    output = parser.parse(mappedLogs);
  } else {
    output = JSON.stringify(mappedLogs);
  }

  // Email simulation for small dataset
  console.log(`📧 Export ready for user ${userId} (small dataset)`);

  return { async: false, data: output };
}

// Check async job status
export async function getExportJobStatus(jobId) {
  const jobData = await redisClient.get(`export:${jobId}`);
  if (!jobData) return null;
  return JSON.parse(jobData);
}
