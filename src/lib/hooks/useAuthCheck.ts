
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function useAuthCheck(
  requireAuth: boolean = true,
  redirect: string = '/login'
) {
  const [isChecking, setIsChecking] = useState(true);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // Save the current location to redirect back after login
        const returnTo = location.pathname + location.search;
        navigate(`${redirect}?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
      } else if (!requireAuth && user) {
        // Redirect to dashboard if user is already logged in and trying to access public routes
        navigate('/dashboard', { replace: true });
      }
      setIsChecking(false);
    }
  }, [user, loading, requireAuth, redirect, navigate, location]);

  return { isChecking: loading || isChecking, user };
}
