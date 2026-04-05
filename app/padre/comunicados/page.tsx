'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { Pagination } from '@/components';

interface Comunicado {
  id: string;
  titulo: string;
  contenido: string;
  adjuntoUrl?: string;
  fechaPublicacion?: string;
  createdAt: string;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export default function PadreComunicadosPage() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const fetchComunicados = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<PageResponse<Comunicado>>(
        `/api/comunicados/mis-comunicados?page=${currentPage}&size=${pageSize}`
      );
      setComunicados(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar tus comunicados.');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchComunicados();
  }, [fetchComunicados]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mis Comunicados</h1>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-500">Cargando...</div>
        ) : comunicados.length === 0 ? (
          <div className="p-6 text-gray-500">No tienes comunicados por el momento.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {comunicados.map((item) => (
              <div key={item.id} className="p-5">
                <h2 className="text-lg font-semibold text-gray-900">{item.titulo}</h2>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(item.fechaPublicacion || item.createdAt).toLocaleString()}
                </p>
                <p className="text-sm text-gray-700 mt-3 whitespace-pre-line">{item.contenido}</p>
                {item.adjuntoUrl && (
                  <a
                    href={item.adjuntoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-3 text-sm text-blue-600 hover:underline"
                  >
                    Ver adjunto
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalElements}
            pageSize={pageSize}
          />
        )}
      </div>
    </div>
  );
}
