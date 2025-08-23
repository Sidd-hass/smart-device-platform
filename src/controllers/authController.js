import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// -------------------- Register -------------------- //
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body; // updated to use name & email
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword });
    res.status(201).json({ message: "User registered", userId: newUser._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------- Login -------------------- //
export const login = async (req, res) => {
  try {
    const { email, password } = req.body; // changed from username to email
    const user = await User.findOne({ email }); // find by email now
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
