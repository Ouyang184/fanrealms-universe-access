import { sanitizeReturnTo } from "@/utils/auth-redirects";

const OAUTH_RETURN_TO_KEY = "fanrealms.oauth.returnTo";
const OAUTH_INTENT_KEY = "fanrealms.oauth.intent";

export type OAuthIntent = "login" | "signup";

export const storeOAuthIntent = (intent: OAuthIntent) => {
  try {
    window.localStorage.setItem(OAUTH_INTENT_KEY, intent);
  } catch {
    // ignore
  }
  try {
    window.sessionStorage.setItem("oauth_intent", intent);
  } catch {
    // ignore
  }
};

export const getStoredOAuthIntent = (): OAuthIntent | null => {
  try {
    const fromSession = window.sessionStorage.getItem("oauth_intent");
    if (fromSession === "login" || fromSession === "signup") return fromSession;
  } catch {
    // ignore
  }
  try {
    const fromLocal = window.localStorage.getItem(OAUTH_INTENT_KEY);
    if (fromLocal === "login" || fromLocal === "signup") return fromLocal;
  } catch {
    // ignore
  }
  return null;
};

export const clearStoredOAuthIntent = () => {
  try { window.sessionStorage.removeItem("oauth_intent"); } catch { /* ignore */ }
  try { window.localStorage.removeItem(OAUTH_INTENT_KEY); } catch { /* ignore */ }
};

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