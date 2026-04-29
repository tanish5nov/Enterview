const defaultApiBaseUrl = "http://127.0.0.1:4000";

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl;
