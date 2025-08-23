import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { cache } from "../middleware/cache.js";
import User from "../models/User.js";

const router = express.Router();
const userTtl = Number(process.env.USER_DATA_TTL_SECONDS || 1800);

// All user routes require auth
router.use(authMiddleware);

// GET /users/me — cached
router.get(
  "/me",
  cache(userTtl, (req) => `user:${req.user?.id || "anon"}`),
  async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    return res.json({ success: true, user });
  }
);

export default router;
