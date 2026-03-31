'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface TelegramVinculacion {
  verificado: boolean;
  telegramChatId?: number;
  codigoVerificacion?: string;
  codigoExpiraAt?: string;
  fechaVinculacion?: string;
}

interface GenerarCodigoResponse {
  codigo: string;
  expiraAt: string;
}

export default function PadreTelegramPage() {
  const [vinculacion, setVinculacion] = useState<TelegramVinculacion | null>(null);
  const [codigo, setCodigo] = useState<GenerarCodigoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVinculacion();
  }, []);

  const fetchVinculacion = async () => {
    try {
      setLoading(true);
      const response = await api.get<TelegramVinculacion>('/api/telegram/vinculacion');
      setVinculacion(response.data);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar el estado de vinculación.');
    } finally {
      setLoading(false);
    }
  };

  const generarCodigo = async () => {
    try {
      setGenerating(true);
      setError(null);
      const response = await api.post<GenerarCodigoResponse>('/api/telegram/generar-codigo');
      setCodigo(response.data);
      await fetchVinculacion();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo generar el código.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Vincular Telegram</h1>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {loading ? (
          <p className="text-gray-500">Cargando estado...</p>
        ) : (
          <>
            <p className="text-sm text-gray-700">
              Estado actual:{' '}
              <span className={vinculacion?.verificado ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                {vinculacion?.verificado ? 'Vinculado' : 'No vinculado'}
              </span>
            </p>

            {vinculacion?.verificado && vinculacion.telegramChatId && (
              <p className="text-sm text-gray-600">Chat ID vinculado: {vinculacion.telegramChatId}</p>
            )}

            <button
              onClick={generarCodigo}
              disabled={generating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? 'Generando...' : 'Generar código'}
            </button>

            {codigo && (
              <div className="p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-gray-700">Código:</p>
                <p className="text-2xl font-bold tracking-widest text-blue-700">{codigo.codigo}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Expira: {new Date(codigo.expiraAt).toLocaleString()}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Instrucciones</h2>
        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
          <li>Abre el bot oficial del colegio en Telegram.</li>
          <li>Genera tu código desde esta pantalla.</li>
          <li>En el bot, envía: <code className="bg-gray-100 px-1 py-0.5 rounded">/vincular CODIGO</code></li>
          <li>Luego podrás usar <code className="bg-gray-100 px-1 py-0.5 rounded">/notas</code> y <code className="bg-gray-100 px-1 py-0.5 rounded">/deudas</code>.</li>
        </ol>
      </div>
    </div>
  );
}
