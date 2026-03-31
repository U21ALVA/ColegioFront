'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, LoginRequest, UserInfo, LoginResponse } from '@/lib/api';
import { 
  getAccessToken, 
  getRefreshToken, 
  setTokens, 
  clearTokens, 
  getStoredUser, 
  setStoredUser,
  isTokenExpired 
} from '@/lib/auth';

interface AuthContextType {
  user: UserInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = getStoredUser();
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();

        if (storedUser && accessToken) {
          // Check if access token is expired
          if (isTokenExpired(accessToken) && refreshToken) {
            // Try to refresh
            try {
              const response = await authApi.refresh(refreshToken);
              setTokens(response.accessToken, response.refreshToken);
              setStoredUser(response.user);
              setUser(response.user);
            } catch {
              // Refresh failed - clear everything
              clearTokens();
              setUser(null);
            }
          } else {
            // Token still valid - use stored user
            setUser(storedUser);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response: LoginResponse = await authApi.login(credentials);
      setTokens(response.accessToken, response.refreshToken);
      setStoredUser(response.user);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      // Ignore logout errors - we're clearing local state anyway
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userInfo = await authApi.me();
      setStoredUser(userInfo);
      setUser(userInfo);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      clearTokens();
      setUser(null);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
