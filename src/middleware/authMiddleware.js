import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Middleware to protect routes using access tokens
 */
export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  // 1️⃣ Check if Authorization header exists and has Bearer token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Access token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 2️⃣ Verify access token using the ACCESS_TOKEN_SECRET
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 3️⃣ Fetch user from DB to attach full info to req
    const user = await User.findById(decoded.sub).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    // ✅ Attach user with `id` field that matches owner_id in DB
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next(); // continue to the route
  } catch (err) {
    // 4️⃣ Differentiate between expired token and invalid token
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Access token expired" });
    }

    return res
      .status(401)
      .json({ success: false, message: "Invalid access token" });
  }
};
