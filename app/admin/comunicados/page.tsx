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
  esReunion?: boolean;
  fechaReunionInicio?: string;
  fechaReunionFin?: string;
  lugarReunion?: string;
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

interface Grado {
  id: string;
  nombre: string;
  nivel: 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA';
}

interface Seccion {
  id: string;
  nombre: string;
  gradoId: string;
  gradoNombre: string;
  gradoNivel: 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA';
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
  const [grados, setGrados] = useState<Grado[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const pageSize = 20;

  const [form, setForm] = useState({
    titulo: '',
    contenido: '',
    adjuntoUrl: '',
    destinoTipo: 'TODOS' as Comunicado['destinoTipo'],
    destinoIdsText: '',
    esReunion: false,
    fechaReunionInicio: '',
    fechaReunionFin: '',
    lugarReunion: '',
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

  useEffect(() => {
    const fetchDestinos = async () => {
      try {
        const [gradosRes, seccionesRes] = await Promise.all([
          api.get<Grado[]>('/api/grados/activos'),
          api.get<Seccion[]>('/api/secciones'),
        ]);
        setGrados(gradosRes.data);
        setSecciones(seccionesRes.data);
      } catch (err) {
        console.error('No se pudieron cargar destinos de comunicados', err);
      }
    };
    fetchDestinos();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const destinoIds = form.destinoIdsText
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
        .filter((v) => /^[0-9a-fA-F-]{36}$/.test(v));

      await api.post('/api/comunicados', {
        titulo: form.titulo,
        contenido: form.contenido,
        adjuntoUrl: form.adjuntoUrl || null,
        destinoTipo: form.destinoTipo,
        destinoIds,
        esReunion: form.esReunion,
        fechaReunionInicio: form.esReunion && form.fechaReunionInicio ? form.fechaReunionInicio : null,
        fechaReunionFin: form.esReunion && form.fechaReunionFin ? form.fechaReunionFin : null,
        lugarReunion: form.esReunion ? (form.lugarReunion || null) : null,
      });

      setForm({
        titulo: '',
        contenido: '',
        adjuntoUrl: '',
        destinoTipo: 'TODOS',
        destinoIdsText: '',
        esReunion: false,
        fechaReunionInicio: '',
        fechaReunionFin: '',
        lugarReunion: '',
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

  const opcionesDestino = (() => {
    if (form.destinoTipo === 'GRADO') {
      return grados.map((g) => ({
        id: g.id,
        label: `${g.nombre} (${g.nivel})`,
      }));
    }

    if (form.destinoTipo === 'SECCION') {
      return secciones.map((s) => ({
        id: s.id,
        label: `${s.gradoNombre} ${s.nombre} (${s.gradoNivel})`,
      }));
    }

    if (form.destinoTipo === 'NIVEL') {
      const niveles: Array<'INICIAL' | 'PRIMARIA' | 'SECUNDARIA'> = ['INICIAL', 'PRIMARIA', 'SECUNDARIA'];
      return niveles.map((nivel) => {
        const gradoIds = grados.filter((g) => g.nivel === nivel).map((g) => g.id);
        return {
          id: gradoIds.join(','),
          label: `${nivel} (${gradoIds.length} grados)`,
        };
      });
    }

    return [] as Array<{ id: string; label: string }>;
  })();

  const toggleDestinoId = (value: string) => {
    const parts = value.split(',').map((x) => x.trim()).filter(Boolean);
    const current = new Set(form.destinoIdsText.split(',').map((x) => x.trim()).filter(Boolean));
    const allPresent = parts.every((p) => current.has(p));
    if (allPresent) {
      parts.forEach((p) => current.delete(p));
    } else {
      parts.forEach((p) => current.add(p));
    }
    setForm({ ...form, destinoIdsText: Array.from(current).join(',') });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Comunicados</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Crear comunicado institucional</h2>
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
                placeholder={form.destinoTipo === 'TODOS' ? 'No requerido para TODOS' : 'Seleccioná desde la lista o pegá UUIDs'}
              />
            </div>
          </div>

          <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3 space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-indigo-900">
              <input
                type="checkbox"
                checked={form.esReunion}
                onChange={(e) => setForm({ ...form, esReunion: e.target.checked })}
              />
              Este comunicado define una reunión
            </label>

            {form.esReunion && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Inicio reunión</label>
                  <input
                    type="datetime-local"
                    value={form.fechaReunionInicio}
                    onChange={(e) => setForm({ ...form, fechaReunionInicio: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required={form.esReunion}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fin reunión</label>
                  <input
                    type="datetime-local"
                    value={form.fechaReunionFin}
                    onChange={(e) => setForm({ ...form, fechaReunionFin: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lugar / enlace</label>
                  <input
                    value={form.lugarReunion}
                    onChange={(e) => setForm({ ...form, lugarReunion: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="Auditorio / Meet / Zoom"
                  />
                </div>
              </div>
            )}
          </div>

          {form.destinoTipo !== 'TODOS' && opcionesDestino.length > 0 && (
            <div className="rounded-md border border-gray-200 p-3 bg-gray-50">
              <p className="text-sm font-medium text-gray-700 mb-2">Seleccioná destinatarios</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-44 overflow-y-auto">
                {opcionesDestino.map((op) => {
                  const parts = op.id.split(',').map((x) => x.trim()).filter(Boolean);
                  const current = new Set(form.destinoIdsText.split(',').map((x) => x.trim()).filter(Boolean));
                  const checked = parts.every((p) => current.has(p));
                  return (
                    <label key={op.id + op.label} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDestinoId(op.id)}
                      />
                      <span>{op.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar borrador'}
            </button>

            <span className="text-sm text-gray-500 self-center">Al publicar, el sistema enviará el comunicado por Telegram a los destinatarios vinculados.</span>
          </div>
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
                    {c.esReunion && c.fechaReunionInicio && (
                      <p className="text-xs text-indigo-700 mt-1">
                        📅 Reunión: {new Date(c.fechaReunionInicio).toLocaleString()}
                        {c.fechaReunionFin ? ` - ${new Date(c.fechaReunionFin).toLocaleString()}` : ''}
                        {c.lugarReunion ? ` | ${c.lugarReunion}` : ''}
                      </p>
                    )}
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
