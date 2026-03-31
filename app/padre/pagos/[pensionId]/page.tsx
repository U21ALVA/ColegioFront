'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface Pension {
  id: string;
  alumnoId: string;
  alumnoNombres: string;
  alumnoApellidos: string;
  alumnoCodigo: string;
  alumnoGrado: string;
  alumnoSeccion: string;
  anioEscolar: number;
  mes: number;
  nombreMes: string;
  monto: number;
  descuento: number;
  montoFinal: number;
  estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'PARCIAL';
  fechaVencimiento: string;
}

interface StripeCheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
  pagoId: string;
}

const ESTADOS = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  PAGADO: { label: 'Pagado', color: 'bg-green-100 text-green-800' },
  VENCIDO: { label: 'Vencido', color: 'bg-red-100 text-red-800' },
  PARCIAL: { label: 'Parcial', color: 'bg-blue-100 text-blue-800' },
};

export default function PensionPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const pensionId = params.pensionId as string;

  const [pension, setPension] = useState<Pension | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pensionId) {
      fetchPension();
    }
  }, [pensionId]);

  const fetchPension = async () => {
    try {
      const response = await api.get<Pension>(`/api/pensiones/${pensionId}`);
      setPension(response.data);
    } catch (err: any) {
      console.error('Error fetching pension:', err);
      if (err.response?.status === 403) {
        setError('No tiene permiso para ver esta pensión');
      } else if (err.response?.status === 404) {
        setError('Pensión no encontrada');
      } else {
        setError('Error al cargar la pensión');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!pension) return;

    setProcessing(true);
    setError(null);

    try {
      const baseUrl = window.location.origin;
      const response = await api.post<StripeCheckoutResponse>('/api/stripe/checkout', {
        pensionId: pension.id,
        successUrl: `${baseUrl}/padre/pagos/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/padre/pagos/cancel?pension_id=${pension.id}`,
      });

      // Redirect to Stripe Checkout
      window.location.href = response.data.checkoutUrl;
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      setError(err.response?.data?.error || 'Error al iniciar el pago');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
        <Link
          href="/padre/pagos"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Estado de Cuenta
        </Link>
      </div>
    );
  }

  if (!pension) {
    return null;
  }

  // If already paid, show message
  if (pension.estado === 'PAGADO') {
    return (
      <div className="space-y-6">
        <Link
          href="/padre/pagos"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Estado de Cuenta
        </Link>

        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-green-800 mb-2">Pensión Pagada</h2>
          <p className="text-green-700">
            Esta pensión ya ha sido pagada. No es necesario realizar un nuevo pago.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/padre/pagos"
        className="inline-flex items-center text-blue-600 hover:text-blue-800"
      >
        <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a Estado de Cuenta
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pagar Pensión</h1>
        <p className="text-gray-600 mt-1">Completa el pago de la pensión de forma segura</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Detalle de Pago</h2>
        </div>

        {/* Student Info */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-900">
                {pension.alumnoApellidos}, {pension.alumnoNombres}
              </h3>
              <p className="text-sm text-gray-500">
                {pension.alumnoCodigo} • {pension.alumnoGrado} {pension.alumnoSeccion}
              </p>
            </div>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${ESTADOS[pension.estado].color}`}>
              {ESTADOS[pension.estado].label}
            </span>
          </div>
        </div>

        {/* Payment Details */}
        <div className="px-6 py-6 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <span className="text-gray-600">Concepto</span>
            <span className="font-medium text-gray-900">
              Pensión {pension.nombreMes} {pension.anioEscolar}
            </span>
          </div>

          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <span className="text-gray-600">Fecha de Vencimiento</span>
            <span className="font-medium text-gray-900">
              {new Date(pension.fechaVencimiento).toLocaleDateString('es-PE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <span className="text-gray-600">Monto Base</span>
            <span className="font-medium text-gray-900">S/. {pension.monto.toFixed(2)}</span>
          </div>

          {pension.descuento > 0 && (
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Descuento (Beca)</span>
              <span className="font-medium text-green-600">-S/. {pension.descuento.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="text-lg font-semibold text-gray-900">Total a Pagar</span>
            <span className="text-2xl font-bold text-blue-600">
              S/. {pension.montoFinal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Button */}
        <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={processing}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-white text-lg transition-all ${
              processing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:transform active:scale-[0.99]'
            }`}
          >
            {processing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Procesando...
              </span>
            ) : (
              <>
                <span className="flex items-center justify-center">
                  <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Pagar con Tarjeta
                </span>
              </>
            )}
          </button>

          <p className="mt-4 text-center text-xs text-gray-500">
            Pago seguro procesado por Stripe. No almacenamos datos de tarjeta.
          </p>

          {/* Payment Methods Icons */}
          <div className="mt-4 flex justify-center items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-400">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 4H2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H2V6h20v12z" />
              </svg>
              <span className="text-xs">Visa</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 4H2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H2V6h20v12z" />
              </svg>
              <span className="text-xs">Mastercard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
