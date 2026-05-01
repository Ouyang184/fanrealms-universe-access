import { sanitizeReturnTo } from "@/utils/auth-redirects";

const OAUTH_RETURN_TO_KEY = "fanrealms.oauth.returnTo";

export const storeOAuthReturnTo = (returnTo: string) => {
  try {
    window.localStorage.setItem(OAUTH_RETURN_TO_KEY, sanitizeReturnTo(returnTo, "/dashboard"));
  } catch {
    // Ignore storage failures; the callback will use its safe default.
  }
};

export const getStoredOAuthReturnTo = (fallback = "/dashboard") => {
  try {
    return sanitizeReturnTo(window.localStorage.getItem(OAUTH_RETURN_TO_KEY), fallback);
  } catch {
    return fallback;
  }
};

export const clearStoredOAuthReturnTo = () => {
  try {
    window.localStorage.removeItem(OAUTH_RETURN_TO_KEY);
  } catch {
    // Ignore storage failures.
  }
};