const AUTH_STORAGE_KEY = "ai-swe-auth";

export function storeAuthPayload(result) {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    }),
  );
}

export function loadAuthPayload() {
  const rawValue = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function clearAuthPayload() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function decodeJwtPayload(token) {
  try {
    const payloadPart = token.split(".")[1];

    if (!payloadPart) {
      return null;
    }

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(accessToken) {
  const payload = decodeJwtPayload(accessToken);

  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
}
