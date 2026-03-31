'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { Pagination } from '@/components';

interface Comunicado {
  id: string;
  titulo: string;
  contenido: string;
  adjuntoUrl?: string;
  destinoTipo: 'TODOS' | 'NIVEL' | 'GRADO' | 'SECCION';
  destinoIds: string[];
  estado: 'BORRADOR' | 'PUBLICADO' | 'ARCHIVADO';
  fechaPublicacion?: string;
  createdAt: string;
}

interface ComunicadoEntrega {
  id: string;
  apoderadoId: string;
  apoderadoNombre: string;
  telegramMessageId?: number;
  entregado: boolean;
  leido: boolean;
  fechaEntrega?: string;
  errorMensaje?: string;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export default function AdminComunicadosPage() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedComunicadoId, setSelectedComunicadoId] = useState<string | null>(null);
  const [entregas, setEntregas] = useState<ComunicadoEntrega[]>([]);
  const [loadingEntregas, setLoadingEntregas] = useState(false);
  const pageSize = 20;

  const [form, setForm] = useState({
    titulo: '',
    contenido: '',
    adjuntoUrl: '',
    destinoTipo: 'TODOS' as Comunicado['destinoTipo'],
    destinoIdsText: '',
  });

  const fetchComunicados = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<PageResponse<Comunicado>>(
        `/api/comunicados/admin?page=${currentPage}&size=${pageSize}`
      );
      setComunicados(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los comunicados.');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchComunicados();
  }, [fetchComunicados]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const destinoIds = form.destinoIdsText
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

      await api.post('/api/comunicados', {
        titulo: form.titulo,
        contenido: form.contenido,
        adjuntoUrl: form.adjuntoUrl || null,
        destinoTipo: form.destinoTipo,
        destinoIds,
      });

      setForm({
        titulo: '',
        contenido: '',
        adjuntoUrl: '',
        destinoTipo: 'TODOS',
        destinoIdsText: '',
      });
      await fetchComunicados();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al crear comunicado.');
    } finally {
      setSaving(false);
    }
  };

  const loadEntregas = async (id: string) => {
    try {
      setLoadingEntregas(true);
      setSelectedComunicadoId(id);
      const response = await api.get<ComunicadoEntrega[]>(`/api/comunicados/${id}/entregas`);
      setEntregas(response.data);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'No se pudieron cargar las entregas.');
    } finally {
      setLoadingEntregas(false);
    }
  };

  const handlePublicar = async (id: string) => {
    try {
      await api.post(`/api/comunicados/${id}/publicar`);
      await fetchComunicados();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'No se pudo publicar el comunicado.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Comunicados</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Crear comunicado (borrador)</h2>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Título</label>
            <input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contenido</label>
            <textarea
              value={form.contenido}
              onChange={(e) => setForm({ ...form, contenido: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              rows={5}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Adjunto URL (opcional)</label>
            <input
              value={form.adjuntoUrl}
              onChange={(e) => setForm({ ...form, adjuntoUrl: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Destino</label>
              <select
                value={form.destinoTipo}
                onChange={(e) => setForm({ ...form, destinoTipo: e.target.value as Comunicado['destinoTipo'] })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="TODOS">TODOS</option>
                <option value="NIVEL">NIVEL</option>
                <option value="GRADO">GRADO</option>
                <option value="SECCION">SECCION</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Destino IDs (UUID, separados por coma)</label>
              <input
                value={form.destinoIdsText}
                onChange={(e) => setForm({ ...form, destinoIdsText: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder={form.destinoTipo === 'TODOS' ? 'Opcional para TODOS' : form.destinoTipo === 'NIVEL' ? 'Para NIVEL: IDs de grados o dejar vacío y enviar niveles desde API' : 'Requerido'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar borrador'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 font-semibold">Lista de comunicados</div>

        {loading ? (
          <div className="p-6 text-gray-500">Cargando...</div>
        ) : comunicados.length === 0 ? (
          <div className="p-6 text-gray-500">No hay comunicados registrados.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {comunicados.map((c) => (
              <div key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{c.titulo}</h3>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{c.contenido}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Destino: {c.destinoTipo} | Estado: {c.estado}
                      {c.fechaPublicacion ? ` | Publicado: ${new Date(c.fechaPublicacion).toLocaleString()}` : ''}
                    </p>
                  </div>

                  {c.estado === 'BORRADOR' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePublicar(c.id)}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        Publicar
                      </button>
                      <button
                        onClick={() => loadEntregas(c.id)}
                        className="px-3 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 text-sm"
                      >
                        Entregas
                      </button>
                    </div>
                  )}

                  {c.estado !== 'BORRADOR' && (
                    <button
                      onClick={() => loadEntregas(c.id)}
                      className="px-3 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 text-sm"
                    >
                      Entregas
                    </button>
                  )}
                </div>

                {selectedComunicadoId === c.id && (
                  <div className="mt-4 bg-slate-50 border border-slate-200 rounded-md p-3">
                    <h4 className="font-medium text-slate-800 mb-2">Estado de entregas</h4>
                    {loadingEntregas ? (
                      <p className="text-sm text-slate-600">Cargando entregas...</p>
                    ) : entregas.length === 0 ? (
                      <p className="text-sm text-slate-600">Sin entregas registradas todavía.</p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {entregas.map((e) => (
                          <div key={e.id} className="text-sm bg-white rounded border border-slate-200 p-2">
                            <div className="flex justify-between">
                              <span className="font-medium text-slate-800">{e.apoderadoNombre}</span>
                              <span className={e.entregado ? 'text-green-700' : 'text-amber-700'}>
                                {e.entregado ? 'Entregado' : 'Pendiente'}
                              </span>
                            </div>
                            {e.telegramMessageId && (
                              <div className="text-xs text-slate-500">message_id: {e.telegramMessageId}</div>
                            )}
                            {e.errorMensaje && (
                              <div className="text-xs text-red-600">{e.errorMensaje}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
