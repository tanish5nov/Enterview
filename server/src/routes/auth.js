import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAuth } from "../auth-middleware.js";
import {
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiryDate,
  hashRefreshToken,
} from "../auth-tokens.js";
import { AuthSession } from "../models/AuthSession.js";
import { User } from "../models/User.js";

const signupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(32),
});

export const authRouter = Router();

function formatUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

authRouter.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid signup payload",
      details: parsed.error.flatten(),
    });
  }

  const { name, email, password } = parsed.data;

  try {
    const existingUser = await User.findOne({ email }).lean();

    if (existingUser) {
      return res.status(409).json({
        ok: false,
        error: "User already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
    });

    return res.status(201).json({
      ok: true,
      user: formatUser(user),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        ok: false,
        error: "User already exists",
      });
    }

    return res.status(500).json({
      ok: false,
      error: "Failed to sign up user",
    });
  }
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid login payload",
      details: parsed.error.flatten(),
    });
  }

  const { email, password } = parsed.data;

  try {
    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        ok: false,
        error: "Invalid email or password",
      });
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const expiresAt = getRefreshTokenExpiryDate();

    await AuthSession.create({
      userId: user._id,
      refreshTokenHash,
      expiresAt,
      deviceInfo: req.get("user-agent") || "",
      ipAddress: req.ip || "",
    });

    return res.status(200).json({
      ok: true,
      accessToken,
      refreshToken,
      user: formatUser(user),
    });
  } catch {
    return res.status(500).json({
      ok: false,
      error: "Failed to log in user",
    });
  }
});

authRouter.post("/refresh", async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Missing or invalid refresh token",
      details: parsed.error.flatten(),
    });
  }

  const refreshTokenHash = hashRefreshToken(parsed.data.refreshToken);

  try {
    const authSession = await AuthSession.findOne({
      refreshTokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!authSession) {
      return res.status(401).json({
        ok: false,
        error: "Invalid or expired refresh token",
      });
    }

    const user = await User.findById(authSession.userId);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Invalid or expired refresh token",
      });
    }

    const accessToken = createAccessToken(user);

    return res.status(200).json({
      ok: true,
      accessToken,
      user: formatUser(user),
    });
  } catch {
    return res.status(500).json({
      ok: false,
      error: "Failed to refresh access token",
    });
  }
});

authRouter.post("/logout", async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Missing or invalid refresh token",
      details: parsed.error.flatten(),
    });
  }

  const refreshTokenHash = hashRefreshToken(parsed.data.refreshToken);

  try {
    const authSession = await AuthSession.findOne({
      refreshTokenHash,
    });

    if (!authSession) {
      return res.status(200).json({
        ok: true,
      });
    }

    if (!authSession.revokedAt) {
      authSession.revokedAt = new Date();
      await authSession.save();
    }

    return res.status(200).json({
      ok: true,
    });
  } catch {
    return res.status(500).json({
      ok: false,
      error: "Failed to log out user",
    });
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  return res.status(200).json({
    ok: true,
    user: formatUser(req.user),
  });
});
