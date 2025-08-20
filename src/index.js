// import express from "express";
// import dotenv from "dotenv";
// import mongoose from "mongoose";
// import morgan from "morgan";
// import cors from "cors";

// import authRoutes from "./routes/auth.js";
// import deviceRoutes from "./routes/device.routes.js";
// import { authMiddleware } from "./middleware/authMiddleware.js";
// import { perUserLimiter } from "./middleware/ratelimiter.js";

// // Load environment variables
// dotenv.config();

// const app = express();

// // Middleware
// app.use(express.json());
// app.use(cors());
// app.use(morgan("dev"));

// // ✅ Database connection
// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => {
//   console.log("✅ MongoDB Connected");

//   // ✅ Start background job
//   import("./jobs/inactiveDeviceJob.js");

//   // Public routes
//   app.use("/auth", authRoutes);

//   // Authenticated routes: apply auth middleware, then per-user rate limiter
//   app.use("/devices", authMiddleware, perUserLimiter, deviceRoutes);

//   // Default route
//   app.get("/", (req, res) => {
//     res.send("API is running...");
//   });

//   // Start server
//   const PORT = process.env.PORT || 5000;
//   app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
// })
// .catch((err) => console.error("❌ DB Connection Error:", err));







import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import deviceRoutes from "./routes/device.routes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import { perUserLimiter } from "./middleware/ratelimiter.js";

// Load environment variables at the very top
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// ✅ Mongoose recommended option
mongoose.set("strictQuery", true);

// ✅ Connect to DB only if not in test mode
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async () => {
      console.log("✅ MongoDB Connected");

      // ✅ Start background job safely
      try {
        const { default: startInactiveDeviceJob } = await import("./jobs/inactiveDeviceJob.js");
        if (typeof startInactiveDeviceJob === "function") {
          startInactiveDeviceJob(); // in case your job exports a function
        }
      } catch (err) {
        console.error("⚠️ Failed to start inactive device job:", err.message);
      }

      // Start server
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error("❌ DB Connection Error:", err.message);
      process.exit(1); // Exit if DB connection fails
    });
}

// Public routes
app.use("/auth", authRoutes);

// Authenticated routes: apply auth middleware, then per-user rate limiter
app.use("/devices", authMiddleware, perUserLimiter, deviceRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Global Error Handler:", err);
  res.status(500).json({ message: "Something went wrong!" });
});

// ✅ Export app for testing
export default app;

