/**
 * Scrub any leftover Supabase auth keys from browser storage.
 * Used by the sign-out flow as a belt-and-suspenders pass in case the
 * SDK's own teardown missed something (e.g. timeout fallback path).
 */
export const purgeSupabaseAuthStorage = () => {
  try {
    const purge = (storage: Storage) => {
      const keys: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (!k) continue;
        if (
          k === 'fanrealms-auth' ||
          k.startsWith('sb-') ||
          k.startsWith('supabase.auth.')
        ) {
          keys.push(k);
        }
      }
      keys.forEach((k) => storage.removeItem(k));
    };
    purge(window.localStorage);
    purge(window.sessionStorage);
  } catch {
    /* ignore storage errors (private mode, etc.) */
  }
};
