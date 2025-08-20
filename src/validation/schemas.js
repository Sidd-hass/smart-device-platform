// schemas.js
import { z } from "zod";

// Auth schemas
export const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["user", "admin"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Device schemas
export const deviceCreateSchema = z.object({
  name: z.string().min(1, "name required"),
  type: z.string().min(1, "type required"),
  status: z.enum(["active", "inactive"]).optional().default("inactive"),
});

export const deviceUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// Heartbeat schema
export const heartbeatSchema = z.object({
  status: z.enum(["active", "inactive"]).optional(),
});


// Data & Analytic
export const logCreateSchema = z.object({
  event: z.string().min(1, "event required"),
  value: z.number(),
});