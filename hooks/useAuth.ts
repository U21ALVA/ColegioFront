'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { LoginRequest } from '@/lib/api';

export function useAuth() {
  const { user, isLoading, isAuthenticated, login, logout, refreshUser } = useAuthContext();
  const router = useRouter();

  const handleLogin = useCallback(async (credentials: LoginRequest) => {
    await login(credentials);
    
    // Redirect based on role
    if (user?.rol) {
      switch (user.rol) {
        case 'ADMIN':
          router.push('/admin');
          break;
        case 'PROFESOR':
          router.push('/profesor');
          break;
        case 'PADRE':
          router.push('/padre');
          break;
        default:
          router.push('/');
      }
    }
  }, [login, router, user?.rol]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/login');
  }, [logout, router]);

  const requireAuth = useCallback((allowedRoles?: string[]) => {
    if (!isAuthenticated) {
      router.push('/login');
      return false;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
      // Redirect to appropriate dashboard
      switch (user.rol) {
        case 'ADMIN':
          router.push('/admin');
          break;
        case 'PROFESOR':
          router.push('/profesor');
          break;
        case 'PADRE':
          router.push('/padre');
          break;
        default:
          router.push('/');
      }
      return false;
    }

    return true;
  }, [isAuthenticated, user, router]);

  const redirectToDashboard = useCallback(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    switch (user.rol) {
      case 'ADMIN':
        router.push('/admin');
        break;
      case 'PROFESOR':
        router.push('/profesor');
        break;
      case 'PADRE':
        router.push('/padre');
        break;
      default:
        router.push('/');
    }
  }, [user, router]);

  return {
    user,
    isLoading,
    isAuthenticated,
    login: handleLogin,
    logout: handleLogout,
    refreshUser,
    requireAuth,
    redirectToDashboard,
  };
}

export default useAuth;
