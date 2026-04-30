
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

  // Loop guard
  const lastNavRef = useRef<string | null>(null);
  const redirectCountRef = useRef(0);
  const MAX_REDIRECTS = 3;

  useEffect(() => {
    if (loading) return;

    const safeNavigate = (target: string) => {
      const currentFull = location.pathname + location.search;
      if (
        target === currentFull ||
        target === lastNavRef.current ||
        redirectCountRef.current >= MAX_REDIRECTS
      ) {
        return;
      }
      lastNavRef.current = target;
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
      // Only bounce away from explicit auth pages — don't yank users off
      // arbitrary public routes (landing, marketplace, etc.).
      if (isAuthPath(location.pathname) && location.pathname !== '/dashboard') {
        safeNavigate('/dashboard');
      }
    }
    setIsChecking(false);
  }, [user, loading, requireAuth, redirect, navigate, location.pathname, location.search]);

  return { isChecking: loading || isChecking, user };
}
