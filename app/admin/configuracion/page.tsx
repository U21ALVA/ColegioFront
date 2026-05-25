'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Modal, Badge } from '@/components';

interface AnioEscolar {
  id: string;
  anio: number;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
}

interface Bimestre {
  id: string;
  numero: number;
  fechaInicio: string;
  fechaFin: string;
  cerrado: boolean;
  anioEscolarId: string;
}

interface NoticeState {
  type: 'success' | 'warning' | 'error';
  text: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateToUTC(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);

  if (!year || !month || !day) {
    throw new Error('Formato de fecha inválido. Debe ser YYYY-MM-DD.');
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function formatUTCDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDaysUTC(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function buildDefaultBimestres(fechaInicio: string, fechaFin: string) {
  const start = parseDateToUTC(fechaInicio);
  const end = parseDateToUTC(fechaFin);

  const totalDays = Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;

  if (totalDays < 4) {
    throw new Error('El rango del año escolar debe tener al menos 4 días para crear 4 bimestres.');
  }

  const base = Math.floor(totalDays / 4);
  const remainder = totalDays % 4;

  const ranges: Array<{ numero: number; fechaInicio: string; fechaFin: string }> = [];
  let cursor = start;

  for (let i = 0; i < 4; i++) {
    const length = base + (i < remainder ? 1 : 0);
    const rangeEnd = addDaysUTC(cursor, length - 1);

    ranges.push({
      numero: i + 1,
      fechaInicio: formatUTCDate(cursor),
      fechaFin: formatUTCDate(rangeEnd),
    });

    cursor = addDaysUTC(rangeEnd, 1);
  }

  return ranges;
}

export default function ConfiguracionPage() {
  const [aniosEscolares, setAniosEscolares] = useState<AnioEscolar[]>([]);
  const [bimestres, setBimestres] = useState<Bimestre[]>([]);
  const [selectedAnio, setSelectedAnio] = useState<AnioEscolar | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnioModal, setShowAnioModal] = useState(false);
  const [editingAnio, setEditingAnio] = useState<AnioEscolar | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  useEffect(() => {
    fetchAniosEscolares();
  }, []);

  useEffect(() => {
    if (selectedAnio) {
      fetchBimestres(selectedAnio.id);
    }
  }, [selectedAnio]);

  const fetchAniosEscolares = async (preferredAnioId?: string) => {
    try {
      const response = await api.get<AnioEscolar[]>('/api/anios-escolares');
      setAniosEscolares(response.data);

      if (preferredAnioId) {
        const selected = response.data.find((a) => a.id === preferredAnioId);
        if (selected) {
          setSelectedAnio(selected);
          return;
        }
      }

      const activo = response.data.find((a) => a.activo);
      if (activo) setSelectedAnio(activo);
      else if (response.data.length > 0) setSelectedAnio(response.data[0]);
    } catch (error) {
      console.error('Error fetching años escolares:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBimestres = async (anioId: string) => {
    try {
      const response = await api.get<Bimestre[]>(`/api/bimestres/anio-escolar/${anioId}`);
      setBimestres(response.data);
    } catch (error) {
      console.error('Error fetching bimestres:', error);
    }
  };

  const handleActivateAnio = async (anio: AnioEscolar) => {
    if (window.confirm(`¿Está seguro de activar el año escolar ${anio.anio}?`)) {
      try {
        await api.post(`/api/anios-escolares/${anio.id}/activar`);
        fetchAniosEscolares();
      } catch (error) {
        console.error('Error activating año:', error);
        alert('Error al activar el año escolar');
      }
    }
  };

  const handleCerrarBimestre = async (bimestre: Bimestre) => {
    if (window.confirm(`¿Está seguro de cerrar el bimestre ${bimestre.numero}?`)) {
      try {
        await api.post(`/api/bimestres/${bimestre.id}/cerrar`);
        if (selectedAnio) fetchBimestres(selectedAnio.id);
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al cerrar el bimestre');
      }
    }
  };

  const handleReabrirBimestre = async (bimestre: Bimestre) => {
    if (window.confirm(`¿Está seguro de reabrir el bimestre ${bimestre.numero}?`)) {
      try {
        await api.post(`/api/bimestres/${bimestre.id}/reabrir`);
        if (selectedAnio) fetchBimestres(selectedAnio.id);
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al reabrir el bimestre');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Configuración Académica</h1>
      </div>

      {notice && (
        <div
          className={`p-3 rounded-md text-sm border ${
            notice.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : notice.type === 'warning'
              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Años Escolares */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Años Escolares</h2>
          <button
            onClick={() => {
              setEditingAnio(null);
              setShowAnioModal(true);
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
          >
            Nuevo Año
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aniosEscolares.map((anio) => (
            <div
              key={anio.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedAnio?.id === anio.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedAnio(anio)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{anio.anio}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(anio.fechaInicio).toLocaleDateString()} -{' '}
                    {new Date(anio.fechaFin).toLocaleDateString()}
                  </p>
                </div>
                {anio.activo ? (
                  <Badge variant="success">Activo</Badge>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActivateAnio(anio);
                    }}
                    className="text-xs text-primary-600 hover:text-primary-800"
                  >
                    Activar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bimestres */}
      {selectedAnio && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Bimestres - {selectedAnio.anio}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {bimestres.map((bimestre) => (
              <div key={bimestre.id} className="border rounded-lg p-4 border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">Bimestre {bimestre.numero}</h3>
                  {bimestre.cerrado ? (
                    <Badge variant="default">Cerrado</Badge>
                  ) : (
                    <Badge variant="success">Abierto</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  {new Date(bimestre.fechaInicio).toLocaleDateString()} -{' '}
                  {new Date(bimestre.fechaFin).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  {bimestre.cerrado ? (
                    <button
                      onClick={() => handleReabrirBimestre(bimestre)}
                      className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Reabrir
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCerrarBimestre(bimestre)}
                      className="text-xs px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100"
                    >
                      Cerrar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para nuevo año escolar */}
      <Modal
        isOpen={showAnioModal}
        onClose={() => setShowAnioModal(false)}
        title={editingAnio ? 'Editar Año Escolar' : 'Nuevo Año Escolar'}
      >
        <AnioEscolarForm
          anio={editingAnio}
          onSuccess={(createdAnioId, warningMessage) => {
            setShowAnioModal(false);
            fetchAniosEscolares(createdAnioId);

            if (warningMessage) {
              setNotice({ type: 'warning', text: warningMessage });
              return;
            }

            setNotice({
              type: 'success',
              text: editingAnio ? 'Año escolar actualizado correctamente.' : 'Año escolar creado con sus 4 bimestres.',
            });
          }}
          onCancel={() => setShowAnioModal(false)}
        />
      </Modal>
    </div>
  );
}

interface AnioEscolarFormProps {
  anio: AnioEscolar | null;
  onSuccess: (createdAnioId?: string, warningMessage?: string) => void;
  onCancel: () => void;
}

function AnioEscolarForm({ anio, onSuccess, onCancel }: AnioEscolarFormProps) {
  const [formData, setFormData] = useState({
    anio: anio?.anio || new Date().getFullYear() + 1,
    fechaInicio: anio?.fechaInicio || '',
    fechaFin: anio?.fechaFin || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (formData.fechaFin < formData.fechaInicio) {
        throw new Error('La fecha de fin no puede ser menor que la fecha de inicio.');
      }

      if (anio) {
        await api.put(`/api/anios-escolares/${anio.id}`, formData);
        onSuccess(anio.id);
      } else {
        const createdAnioResponse = await api.post<AnioEscolar>('/api/anios-escolares', formData);
        const createdAnio = createdAnioResponse.data;

        const defaultBimestres = buildDefaultBimestres(formData.fechaInicio, formData.fechaFin);

        const results = await Promise.allSettled(
          defaultBimestres.map((bimestre) =>
            api.post('/api/bimestres', {
              numero: bimestre.numero,
              anioEscolarId: createdAnio.id,
              fechaInicio: bimestre.fechaInicio,
              fechaFin: bimestre.fechaFin,
            })
          )
        );

        const failed = results
          .map((result, index) => ({ result, numero: defaultBimestres[index].numero }))
          .filter((item) => item.result.status === 'rejected');

        if (failed.length > 0) {
          const failedList = failed.map((f) => f.numero).join(', ');
          onSuccess(
            createdAnio.id,
            `Año escolar creado, pero falló la creación de los bimestres: ${failedList}. Revisá logs/API y reintentá.`
          );
        } else {
          onSuccess(createdAnio.id);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Año</label>
        <input
          type="number"
          value={formData.anio}
          onChange={(e) => setFormData({ ...formData, anio: parseInt(e.target.value) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
        <input
          type="date"
          value={formData.fechaInicio}
          onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
        <input
          type="date"
          value={formData.fechaFin}
          onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          required
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
