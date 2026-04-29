import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { getConfig } from "./config.js";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export function createAccessToken(user) {
  const config = getConfig();

  return jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
      role: user.role,
      type: "access",
    },
    config.jwtAccessSecret,
    {
      expiresIn: ACCESS_TOKEN_TTL,
    },
  );
}

export function verifyAccessToken(token) {
  const config = getConfig();
  return jwt.verify(token, config.jwtAccessSecret);
}

export function createRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

export function hashRefreshToken(refreshToken) {
  const config = getConfig();

  return crypto
    .createHmac("sha256", config.jwtRefreshSecret)
    .update(refreshToken)
    .digest("hex");
}

export function getRefreshTokenExpiryDate() {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
}
