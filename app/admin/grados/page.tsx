'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Modal, Badge, SearchInput } from '@/components';

interface Grado {
  id: string;
  nombre: string;
  nivel: 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA';
  orden: number;
  estado: string;
}

interface Seccion {
  id: string;
  nombre: string;
  gradoId: string;
  gradoNombre: string;
  capacidad: number;
  estado: string;
  alumnosActivos: number;
}

export default function GradosPage() {
  const [grados, setGrados] = useState<Grado[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [selectedGrado, setSelectedGrado] = useState<Grado | null>(null);
  const [selectedNivel, setSelectedNivel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showGradoModal, setShowGradoModal] = useState(false);
  const [showSeccionModal, setShowSeccionModal] = useState(false);
  const [editingGrado, setEditingGrado] = useState<Grado | null>(null);
  const [editingSeccion, setEditingSeccion] = useState<Seccion | null>(null);

  useEffect(() => {
    fetchGrados();
  }, []);

  useEffect(() => {
    if (selectedGrado) {
      fetchSecciones(selectedGrado.id);
    } else {
      setSecciones([]);
    }
  }, [selectedGrado]);

  const fetchGrados = async () => {
    try {
      const response = await api.get<Grado[]>('/api/grados');
      setGrados(response.data);
    } catch (error) {
      console.error('Error fetching grados:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSecciones = async (gradoId: string) => {
    try {
      const response = await api.get<Seccion[]>(`/api/secciones/grado/${gradoId}`);
      setSecciones(response.data);
    } catch (error) {
      console.error('Error fetching secciones:', error);
    }
  };

  const filteredGrados = selectedNivel
    ? grados.filter((g) => g.nivel === selectedNivel)
    : grados;

  const nivelLabels: Record<string, string> = {
    INICIAL: 'Inicial',
    PRIMARIA: 'Primaria',
    SECUNDARIA: 'Secundaria',
  };

  const handleDeleteGrado = async (grado: Grado) => {
    if (window.confirm(`¿Está seguro de eliminar el grado ${grado.nombre}?`)) {
      try {
        await api.delete(`/api/grados/${grado.id}`);
        fetchGrados();
        if (selectedGrado?.id === grado.id) setSelectedGrado(null);
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al eliminar');
      }
    }
  };

  const handleDeleteSeccion = async (seccion: Seccion) => {
    if (window.confirm(`¿Está seguro de eliminar la sección ${seccion.nombre}?`)) {
      try {
        await api.delete(`/api/secciones/${seccion.id}`);
        if (selectedGrado) fetchSecciones(selectedGrado.id);
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al eliminar');
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
        <h1 className="text-2xl font-bold text-gray-900">Grados y Secciones</h1>
        <button
          onClick={() => {
            setEditingGrado(null);
            setShowGradoModal(true);
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
        >
          Nuevo Grado
        </button>
      </div>

      {/* Filtro por nivel */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedNivel('')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            selectedNivel === '' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos
        </button>
        {['INICIAL', 'PRIMARIA', 'SECUNDARIA'].map((nivel) => (
          <button
            key={nivel}
            onClick={() => setSelectedNivel(nivel)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedNivel === nivel ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {nivelLabels[nivel]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Grados */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-800">Grados</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
            {filteredGrados.length === 0 ? (
              <p className="p-4 text-gray-500 text-center">No hay grados</p>
            ) : (
              filteredGrados.map((grado) => (
                <div
                  key={grado.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedGrado?.id === grado.id ? 'bg-primary-50' : ''
                  }`}
                  onClick={() => setSelectedGrado(grado)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{grado.nombre}</h3>
                      <p className="text-sm text-gray-500">{nivelLabels[grado.nivel]}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={grado.estado === 'ACTIVO' ? 'success' : 'default'}
                        size="sm"
                      >
                        {grado.estado}
                      </Badge>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingGrado(grado);
                          setShowGradoModal(true);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGrado(grado);
                        }}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Secciones del grado seleccionado */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">
              Secciones {selectedGrado ? `- ${selectedGrado.nombre}` : ''}
            </h2>
            {selectedGrado && (
              <button
                onClick={() => {
                  setEditingSeccion(null);
                  setShowSeccionModal(true);
                }}
                className="px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
              >
                Nueva Sección
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-200">
            {!selectedGrado ? (
              <p className="p-4 text-gray-500 text-center">Seleccione un grado</p>
            ) : secciones.length === 0 ? (
              <p className="p-4 text-gray-500 text-center">No hay secciones</p>
            ) : (
              secciones.map((seccion) => (
                <div key={seccion.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">Sección {seccion.nombre}</h3>
                      <p className="text-sm text-gray-500">
                        Capacidad: {seccion.capacidad} | Alumnos: {seccion.alumnosActivos}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingSeccion(seccion);
                          setShowSeccionModal(true);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteSeccion(seccion)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal para grado */}
      <Modal
        isOpen={showGradoModal}
        onClose={() => setShowGradoModal(false)}
        title={editingGrado ? 'Editar Grado' : 'Nuevo Grado'}
      >
        <GradoForm
          grado={editingGrado}
          onSuccess={() => {
            setShowGradoModal(false);
            fetchGrados();
          }}
          onCancel={() => setShowGradoModal(false)}
        />
      </Modal>

      {/* Modal para sección */}
      <Modal
        isOpen={showSeccionModal}
        onClose={() => setShowSeccionModal(false)}
        title={editingSeccion ? 'Editar Sección' : 'Nueva Sección'}
      >
        {selectedGrado && (
          <SeccionForm
            seccion={editingSeccion}
            gradoId={selectedGrado.id}
            onSuccess={() => {
              setShowSeccionModal(false);
              fetchSecciones(selectedGrado.id);
            }}
            onCancel={() => setShowSeccionModal(false)}
          />
        )}
      </Modal>
    </div>
  );
}

interface GradoFormProps {
  grado: Grado | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function GradoForm({ grado, onSuccess, onCancel }: GradoFormProps) {
  const [formData, setFormData] = useState({
    nombre: grado?.nombre || '',
    nivel: grado?.nivel || 'PRIMARIA',
    orden: grado?.orden || 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (grado) {
        await api.put(`/api/grados/${grado.id}`, formData);
      } else {
        await api.post('/api/grados', formData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
        <input
          type="text"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          placeholder="Ej: 1° Primaria"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Nivel</label>
        <select
          value={formData.nivel}
          onChange={(e) => setFormData({ ...formData, nivel: e.target.value as any })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        >
          <option value="INICIAL">Inicial</option>
          <option value="PRIMARIA">Primaria</option>
          <option value="SECUNDARIA">Secundaria</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Orden</label>
        <input
          type="number"
          value={formData.orden}
          onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          min={1}
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

interface SeccionFormProps {
  seccion: Seccion | null;
  gradoId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function SeccionForm({ seccion, gradoId, onSuccess, onCancel }: SeccionFormProps) {
  const [formData, setFormData] = useState({
    nombre: seccion?.nombre || '',
    gradoId: gradoId,
    capacidad: seccion?.capacidad || 30,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (seccion) {
        await api.put(`/api/secciones/${seccion.id}`, formData);
      } else {
        await api.post('/api/secciones', formData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
        <input
          type="text"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          placeholder="Ej: A, B, C"
          maxLength={10}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Capacidad</label>
        <input
          type="number"
          value={formData.capacidad}
          onChange={(e) => setFormData({ ...formData, capacidad: parseInt(e.target.value) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          min={1}
          max={50}
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
