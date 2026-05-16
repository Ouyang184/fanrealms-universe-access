
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { buildLoginUrl, isAuthPath } from '@/utils/auth-redirects';


export function useAuthCheck(
  requireAuth: boolean = true,
  redirect: string = '/login'
) {
  const [isChecking, setIsChecking] = useState(true);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Loop guard — keyed per (user × requireAuth × path) transition so we
  // dispatch at most one navigation per transition and reset the counter
  // when the inputs that drive the decision actually change.
  const MAX_REDIRECTS_PER_KEY = 1;
  const transitionKeyRef = useRef<string | null>(null);
  const dispatchedKeyRef = useRef<string | null>(null);
  const lastNavRef = useRef<string | null>(null);
  const redirectCountRef = useRef(0);

  const transitionKey = `${user?.id ?? 'anon'}|${requireAuth}|${location.pathname}${location.search}`;
  if (transitionKeyRef.current !== transitionKey) {
    transitionKeyRef.current = transitionKey;
    redirectCountRef.current = 0;
    dispatchedKeyRef.current = null;
  }

  useEffect(() => {
    if (loading) return;

    const safeNavigate = (target: string) => {
      const currentFull = location.pathname + location.search;
      if (
        target === currentFull ||
        target === lastNavRef.current ||
        dispatchedKeyRef.current === transitionKey ||
        redirectCountRef.current >= MAX_REDIRECTS_PER_KEY
      ) {
        return;
      }
      lastNavRef.current = target;
      dispatchedKeyRef.current = transitionKey;
      redirectCountRef.current += 1;
      navigate(target, { replace: true });
    };

    if (requireAuth && !user) {
      if (!isAuthPath(location.pathname)) {
        const target =
          redirect === '/login'
            ? buildLoginUrl(location.pathname, location.search)
            : redirect;
        safeNavigate(target);
      }
    } else if (!requireAuth && user) {
      if (isAuthPath(location.pathname) && location.pathname !== '/dashboard') {
        safeNavigate('/dashboard');
      }
    }
    setIsChecking(false);
  }, [user, loading, requireAuth, redirect, navigate, location.pathname, location.search, transitionKey]);

  return { isChecking: loading || isChecking, user };
}
