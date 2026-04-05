'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function CancelContent() {
  const searchParams = useSearchParams();
  const pensionId = searchParams.get('pension_id');

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Cancel Header */}
        <div className="bg-yellow-500 px-6 py-8 text-center">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
            <svg className="h-10 w-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Pago Cancelado</h1>
        </div>

        {/* Content */}
        <div className="px-6 py-8 text-center">
          <p className="text-gray-600 mb-6">
            El proceso de pago ha sido cancelado. No se ha realizado ningún cargo a tu tarjeta.
          </p>

          <p className="text-sm text-gray-500 mb-6">
            Si experimentaste algún problema durante el proceso de pago, puedes intentarlo nuevamente o contactar con el colegio para asistencia.
          </p>

          <div className="space-y-3">
            {pensionId ? (
              <Link
                href={`/padre/pagos/${pensionId}`}
                className="block w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Intentar Nuevamente
              </Link>
            ) : null}
            <Link
              href="/padre/pagos"
              className="block w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Ver Estado de Cuenta
            </Link>
            <Link
              href="/padre"
              className="block w-full py-3 px-4 text-gray-600 font-medium hover:text-gray-800 transition-colors"
            >
              Ir al Inicio
            </Link>
          </div>
        </div>

        {/* Help Section */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-2">
            ¿Necesitas ayuda?
          </p>
          <p className="text-xs text-gray-600 text-center">
            Contacta a la administración del colegio al{' '}
            <span className="font-medium">01-123-4567</span> o escríbenos a{' '}
            <span className="font-medium">tesoreria@colegiorpalma.edu.pe</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pago Cancelado</h1>
      </div>

      <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      }>
        <CancelContent />
      </Suspense>
    </div>
  );
}
