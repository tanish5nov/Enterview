import { verifyAccessToken } from "./auth-tokens.js";
import { User } from "./models/User.js";

export async function requireAuth(req, res, next) {
  const authorization = req.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      ok: false,
      error: "Authentication required",
    });
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return res.status(401).json({
      ok: false,
      error: "Authentication required",
    });
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Authentication required",
      });
    }

    req.auth = payload;
    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      ok: false,
      error: "Authentication required",
    });
  }
}
