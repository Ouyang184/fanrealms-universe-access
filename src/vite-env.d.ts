
/// <reference types="vite/client" />

interface Window {
  env?: {
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
  };
}

