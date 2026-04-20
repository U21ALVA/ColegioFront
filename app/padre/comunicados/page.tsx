'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { Pagination } from '@/components';

interface Comunicado {
  id: string;
  titulo: string;
  contenido: string;
  adjuntoUrl?: string;
  esReunion?: boolean;
  fechaReunionInicio?: string;
  fechaReunionFin?: string;
  lugarReunion?: string;
  fechaPublicacion?: string;
  createdAt: string;
}

function formatYmd(dateIso?: string) {
  if (!dateIso) return '';
  const d = new Date(dateIso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Calendario de reuniones</h2>
        {(() => {
          const reuniones = comunicados
            .filter((c) => c.esReunion && c.fechaReunionInicio)
            .sort((a, b) => new Date(a.fechaReunionInicio || '').getTime() - new Date(b.fechaReunionInicio || '').getTime());

          if (reuniones.length === 0) {
            return <p className="text-sm text-gray-500">No hay reuniones programadas por ahora.</p>;
          }

          const grouped = reuniones.reduce((acc, r) => {
            const key = formatYmd(r.fechaReunionInicio);
            if (!acc[key]) acc[key] = [];
            acc[key].push(r);
            return acc;
          }, {} as Record<string, Comunicado[]>);

          return (
            <div className="space-y-3">
              {Object.entries(grouped).map(([date, items]) => (
                <div key={date} className="rounded border border-indigo-200 bg-indigo-50 p-3">
                  <div className="font-medium text-indigo-900 mb-2">{new Date(date + 'T00:00:00').toLocaleDateString()}</div>
                  <div className="space-y-2">
                    {items.map((it) => (
                      <div key={it.id} className="rounded bg-white border border-indigo-100 p-2">
                        <div className="text-sm font-semibold text-gray-900">{it.titulo}</div>
                        <div className="text-xs text-indigo-700">
                          {it.fechaReunionInicio ? new Date(it.fechaReunionInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          {it.fechaReunionFin ? ` - ${new Date(it.fechaReunionFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                          {it.lugarReunion ? ` | ${it.lugarReunion}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

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
                {item.esReunion && item.fechaReunionInicio && (
                  <p className="text-sm text-indigo-700 mt-3">
                    📅 Reunión: {new Date(item.fechaReunionInicio).toLocaleString()}
                    {item.fechaReunionFin ? ` - ${new Date(item.fechaReunionFin).toLocaleString()}` : ''}
                    {item.lugarReunion ? ` | ${item.lugarReunion}` : ''}
                  </p>
                )}
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
