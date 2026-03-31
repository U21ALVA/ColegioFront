'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { LoginRequest } from '@/lib/api';

const QUICK_ACCESS_USERS: Array<{ label: string; username: string; password: string }> = [
  { label: 'Admin', username: 'admin', password: 'admin123' },
  { label: 'Profesor', username: 'profesor', password: 'profesor123' },
  { label: 'Padre', username: 'padre', password: 'padre123' },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isAuthenticated, user, isLoading } = useAuthContext();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
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
  }, [isAuthenticated, user, isLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const credentials: LoginRequest = { username, password };
      await login(credentials);
      // Redirect will happen in useEffect when user state updates
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al iniciar sesión';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAccess = async (credentials: LoginRequest) => {
    setUsername(credentials.username);
    setPassword(credentials.password);
    setError('');
    setIsSubmitting(true);

    try {
      await login(credentials);
      // Redirect happens in useEffect when auth state updates
    } catch (err: unknown) {
      const errorMessage = err instanceof Error
        ? err.message
        : (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al iniciar sesión';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Colegio Ricardo Palma</h1>
          <p className="mt-2 text-gray-600">Sistema de Gestión Académica</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Iniciar Sesión
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Ingrese su usuario"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Ingrese su contraseña"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ingresando...
                </span>
              ) : (
                'Ingresar'
              )}
            </button>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3 text-center">Acceso rápido</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {QUICK_ACCESS_USERS.map((quickUser) => (
                  <button
                    key={quickUser.username}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleQuickAccess({
                      username: quickUser.username,
                      password: quickUser.password,
                    })}
                    className="py-2 px-3 border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Entrar {quickUser.label}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-500">
          © 2026 Colegio Ricardo Palma. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
