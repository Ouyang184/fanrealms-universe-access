
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function useAuthCheck(
  requireAuth: boolean = true,
  redirect: string = '/login'
) {
  const [isChecking, setIsChecking] = useState(true);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // Redirect to login if authentication is required but user is not logged in
        navigate(redirect, { replace: true });
      } else if (!requireAuth && user) {
        // Redirect to dashboard if user is already logged in and trying to access public routes
        navigate('/dashboard', { replace: true });
      }
      setIsChecking(false);
    }
  }, [user, loading, requireAuth, redirect, navigate]);

  return { isChecking: loading || isChecking, user };
}
