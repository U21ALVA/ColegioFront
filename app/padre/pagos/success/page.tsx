'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    } else {
      setVerifying(false);
      setVerified(true); // Assume success if no session_id (shouldn't happen normally)
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const response = await api.get<{ sessionId: string; paid: boolean }>(
        `/api/stripe/verify/${sessionId}`
      );
      setVerified(response.data.paid);
    } catch (err: any) {
      console.error('Error verifying payment:', err);
      // Even if verification fails, the webhook may have already processed it
      setVerified(true);
      setError('No se pudo verificar el estado del pago, pero este puede haber sido procesado.');
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Verificando pago...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Success Header */}
        <div className="bg-green-500 px-6 py-8 text-center">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
            <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {verified ? '¡Pago Exitoso!' : 'Pago Recibido'}
          </h1>
        </div>

        {/* Content */}
        <div className="px-6 py-8 text-center">
          {error && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
              {error}
            </div>
          )}

          <p className="text-gray-600 mb-6">
            {verified
              ? 'Tu pago ha sido procesado correctamente. El estado de la pensión se ha actualizado.'
              : 'Tu pago ha sido recibido y está siendo procesado. El estado de la pensión se actualizará en breve.'}
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Referencia de sesión</p>
            <p className="text-xs font-mono text-gray-700 break-all">
              {sessionId || 'N/A'}
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/padre/pagos"
              className="block w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ver Estado de Cuenta
            </Link>
            <Link
              href="/padre"
              className="block w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Ir al Inicio
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Recibirás un comprobante de pago en tu correo electrónico registrado.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resultado del Pago</h1>
      </div>

      <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
