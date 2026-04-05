'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { SearchInput, Pagination, Badge, Select, Modal, FormField } from '@/components';

interface Beca {
  id: string;
  alumnoId: string;
  alumnoNombres: string;
  alumnoApellidos: string;
  alumnoCodigo: string;
  anioEscolarId: string;
  anioEscolar: number;
  tipo: string;
  porcentaje: number;
  motivo: string;
  aprobadoPorNombre: string;
  vigente: boolean;
}

interface Alumno {
  id: string;
  nombres: string;
  apellidos: string;
  codigoEstudiante: string;
}

interface AnioEscolar {
  id: string;
  anio: number;
  activo: boolean;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

const TIPOS_BECA = [
  { value: 'ACADEMICA', label: 'Académica' },
  { value: 'DEPORTIVA', label: 'Deportiva' },
  { value: 'SOCIAL', label: 'Social' },
  { value: 'HERMANOS', label: 'Hermanos' },
];

export default function BecasPage() {
  const [becas, setBecas] = useState<Beca[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [aniosEscolares, setAniosEscolares] = useState<AnioEscolar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('');
  const [filterVigente, setFilterVigente] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBeca, setEditingBeca] = useState<Beca | null>(null);
  const [form, setForm] = useState({
    alumnoId: '',
    anioEscolarId: '',
    tipo: 'ACADEMICA',
    porcentaje: '',
    motivo: '',
  });

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchBecas();
  }, [currentPage, filterTipo, filterVigente]);

  const fetchFilters = async () => {
    try {
      const [alumnosRes, aniosRes] = await Promise.all([
        api.get<{ content: Alumno[] }>('/api/alumnos?size=500'),
        api.get<AnioEscolar[]>('/api/anios-escolares'),
      ]);
      setAlumnos(alumnosRes.data.content || alumnosRes.data);
      setAniosEscolares(aniosRes.data);
      
      // Set default year
      const activeYear = aniosRes.data.find(a => a.activo);
      if (activeYear) {
        setForm(prev => ({ ...prev, anioEscolarId: activeYear.id }));
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchBecas = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = `/api/becas?page=${currentPage}&size=${pageSize}`;
      if (filterTipo) endpoint += `&tipo=${filterTipo}`;
      if (filterVigente) endpoint += `&vigente=${filterVigente}`;

      const response = await api.get<PageResponse<Beca>>(endpoint);
      setBecas(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (error) {
      console.error('Error fetching becas:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterTipo, filterVigente]);

  const handleCreate = () => {
    setEditingBeca(null);
    setForm({
      alumnoId: '',
      anioEscolarId: aniosEscolares.find(a => a.activo)?.id || '',
      tipo: 'ACADEMICA',
      porcentaje: '',
      motivo: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (beca: Beca) => {
    setEditingBeca(beca);
    setForm({
      alumnoId: beca.alumnoId,
      anioEscolarId: beca.anioEscolarId,
      tipo: beca.tipo,
      porcentaje: beca.porcentaje.toString(),
      motivo: beca.motivo || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        alumnoId: form.alumnoId,
        anioEscolarId: form.anioEscolarId,
        tipo: form.tipo,
        porcentaje: parseFloat(form.porcentaje),
        motivo: form.motivo,
      };

      if (editingBeca) {
        await api.put(`/api/becas/${editingBeca.id}`, payload);
      } else {
        await api.post('/api/becas', payload);
      }
      
      setModalOpen(false);
      fetchBecas();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al guardar la beca');
    }
  };

  const handleToggleVigencia = async (beca: Beca) => {
    try {
      await api.put(`/api/becas/${beca.id}/toggle-vigencia`);
      fetchBecas();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al cambiar vigencia');
    }
  };

  const handleDelete = async (beca: Beca) => {
    if (window.confirm(`¿Está seguro de eliminar la beca de ${beca.alumnoNombres} ${beca.alumnoApellidos}?`)) {
      try {
        await api.delete(`/api/becas/${beca.id}`);
        fetchBecas();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al eliminar');
      }
    }
  };

  const displayedBecas = search
    ? becas.filter(b =>
        b.alumnoNombres.toLowerCase().includes(search.toLowerCase()) ||
        b.alumnoApellidos.toLowerCase().includes(search.toLowerCase()) ||
        b.alumnoCodigo.toLowerCase().includes(search.toLowerCase())
      )
    : becas;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Becas</h1>
          <p className="text-gray-600 mt-1">Administrar becas y descuentos por alumno</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Nueva Beca
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por alumno..."
          />
          <Select
            label="Tipo"
            value={filterTipo}
            onChange={(e) => { setFilterTipo(e.target.value); setCurrentPage(0); }}
            options={[
              { value: '', label: 'Todos los tipos' },
              ...TIPOS_BECA,
            ]}
          />
          <Select
            label="Estado"
            value={filterVigente}
            onChange={(e) => { setFilterVigente(e.target.value); setCurrentPage(0); }}
            options={[
              { value: '', label: 'Todos' },
              { value: 'true', label: 'Vigentes' },
              { value: 'false', label: 'No vigentes' },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : displayedBecas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay becas registradas
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alumno</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Año</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Porcentaje</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedBecas.map((beca, idx) => (
                    <tr key={beca.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {beca.alumnoApellidos}, {beca.alumnoNombres}
                        </div>
                        <div className="text-xs text-gray-500">{beca.alumnoCodigo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {beca.anioEscolar}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="info">{beca.tipo}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-bold text-primary-600">{beca.porcentaje}%</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {beca.motivo || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge variant={beca.vigente ? 'success' : 'error'}>
                          {beca.vigente ? 'Vigente' : 'No vigente'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(beca)} className="text-blue-600 hover:text-blue-900">
                            Editar
                          </button>
                          <button onClick={() => handleToggleVigencia(beca)} className="text-yellow-600 hover:text-yellow-900">
                            {beca.vigente ? 'Desactivar' : 'Activar'}
                          </button>
                          <button onClick={() => handleDelete(beca)} className="text-red-600 hover:text-red-900">
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalElements}
                pageSize={pageSize}
              />
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBeca ? 'Editar Beca' : 'Nueva Beca'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Alumno"
            value={form.alumnoId}
            onChange={(e) => setForm({ ...form, alumnoId: e.target.value })}
            options={[
              { value: '', label: 'Seleccione un alumno' },
              ...alumnos.map(a => ({
                value: a.id,
                label: `${a.apellidos}, ${a.nombres} (${a.codigoEstudiante})`,
              })),
            ]}
            disabled={!!editingBeca}
            required
          />
          <Select
            label="Año Escolar"
            value={form.anioEscolarId}
            onChange={(e) => setForm({ ...form, anioEscolarId: e.target.value })}
            options={[
              { value: '', label: 'Seleccione un año' },
              ...aniosEscolares.map(a => ({ value: a.id, label: a.anio.toString() })),
            ]}
            disabled={!!editingBeca}
            required
          />
          <Select
            label="Tipo de Beca"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            options={TIPOS_BECA}
            required
          />
          <FormField
            label="Porcentaje de Descuento"
            type="number"
            value={form.porcentaje}
            onChange={(e) => setForm({ ...form, porcentaje: e.target.value })}
            placeholder="Ej: 25"
            min="1"
            max="100"
            step="0.01"
            required
          />
          <FormField
            label="Motivo"
            value={form.motivo}
            onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            placeholder="Motivo de la beca..."
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              {editingBeca ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
