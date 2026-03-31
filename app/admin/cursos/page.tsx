'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { SearchInput, Pagination, Badge, Select, Modal, FormField } from '@/components';

interface Curso {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  horasSemanales: number;
  gradoId: string;
  gradoNombre: string;
  gradoNivel: string;
  estado: string;
}

interface Grado {
  id: string;
  nombre: string;
  nivel: string;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export default function CursosPage() {
  const router = useRouter();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterGrado, setFilterGrado] = useState('');
  const [filterNivel, setFilterNivel] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const pageSize = 10;

  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    horasSemanales: 2,
    gradoId: '',
  });

  useEffect(() => {
    fetchGrados();
  }, []);

  useEffect(() => {
    fetchCursos();
  }, [currentPage, search, filterGrado, filterNivel]);

  const fetchGrados = async () => {
    try {
      const response = await api.get<Grado[]>('/api/grados');
      setGrados(response.data);
    } catch (error) {
      console.error('Error fetching grados:', error);
    }
  };

  const fetchCursos = async () => {
    setLoading(true);
    try {
      let endpoint = `/api/cursos/paginated?page=${currentPage}&size=${pageSize}`;
      
      if (search) {
        endpoint = `/api/cursos/search?q=${encodeURIComponent(search)}&page=${currentPage}&size=${pageSize}`;
      } else if (filterGrado) {
        endpoint = `/api/cursos/grado/${filterGrado}?page=${currentPage}&size=${pageSize}`;
      } else if (filterNivel) {
        endpoint = `/api/cursos/nivel/${filterNivel}?page=${currentPage}&size=${pageSize}`;
      }
      
      const response = await api.get<PageResponse<Curso>>(endpoint);
      setCursos(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (error) {
      console.error('Error fetching cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setFilterGrado('');
    setFilterNivel('');
    setCurrentPage(0);
  };

  const handleNivelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterNivel(e.target.value);
    setFilterGrado('');
    setSearch('');
    setCurrentPage(0);
  };

  const handleGradoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterGrado(e.target.value);
    setFilterNivel('');
    setSearch('');
    setCurrentPage(0);
  };

  const openModal = (curso?: Curso) => {
    if (curso) {
      setEditingCurso(curso);
      setFormData({
        nombre: curso.nombre,
        codigo: curso.codigo,
        descripcion: curso.descripcion || '',
        horasSemanales: curso.horasSemanales,
        gradoId: curso.gradoId,
      });
    } else {
      setEditingCurso(null);
      setFormData({
        nombre: '',
        codigo: '',
        descripcion: '',
        horasSemanales: 2,
        gradoId: '',
      });
    }
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCurso(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingCurso) {
        await api.put(`/api/cursos/${editingCurso.id}`, formData);
      } else {
        await api.post('/api/cursos', formData);
      }
      closeModal();
      fetchCursos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (curso: Curso) => {
    if (window.confirm(`¿Está seguro de eliminar el curso "${curso.nombre}"?`)) {
      try {
        await api.delete(`/api/cursos/${curso.id}`);
        fetchCursos();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al eliminar');
      }
    }
  };

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getNivelBadge = (nivel: string) => {
    switch (nivel) {
      case 'INICIAL':
        return <Badge variant="info">Inicial</Badge>;
      case 'PRIMARIA':
        return <Badge variant="success">Primaria</Badge>;
      case 'SECUNDARIA':
        return <Badge variant="warning">Secundaria</Badge>;
      default:
        return <Badge variant="default">{nivel}</Badge>;
    }
  };

  const filteredGrados = filterNivel
    ? grados.filter((g) => g.nivel === filterNivel)
    : grados;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Cursos</h1>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
        >
          Nuevo Curso
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Buscar por nombre o código..."
            />
          </div>
          <Select
            label="Nivel"
            value={filterNivel}
            onChange={handleNivelChange}
            options={[
              { value: '', label: 'Todos los niveles' },
              { value: 'INICIAL', label: 'Inicial' },
              { value: 'PRIMARIA', label: 'Primaria' },
              { value: 'SECUNDARIA', label: 'Secundaria' },
            ]}
          />
          <Select
            label="Grado"
            value={filterGrado}
            onChange={handleGradoChange}
            options={[
              { value: '', label: 'Todos los grados' },
              ...filteredGrados.map((g) => ({ value: g.id, label: `${g.nombre} (${g.nivel})` })),
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
        ) : cursos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search || filterGrado || filterNivel ? 'No se encontraron cursos' : 'No hay cursos registrados'}
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Curso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nivel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horas/Sem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cursos.map((curso) => (
                  <tr key={curso.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{curso.nombre}</div>
                        {curso.descripcion && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">{curso.descripcion}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {curso.codigo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {curso.gradoNombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getNivelBadge(curso.gradoNivel)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {curso.horasSemanales}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(curso)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(curso)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
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
        isOpen={showModal}
        onClose={closeModal}
        title={editingCurso ? 'Editar Curso' : 'Nuevo Curso'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>
          )}

          <FormField
            label="Nombre"
            type="text"
            value={formData.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            required
            maxLength={100}
          />

          <FormField
            label="Código"
            type="text"
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            required
            maxLength={20}
            hint="Ej: MAT-01, COM-01"
          />

          <Select
            label="Grado"
            value={formData.gradoId}
            onChange={(e) => handleChange('gradoId', e.target.value)}
            options={[
              { value: '', label: 'Seleccione un grado' },
              ...grados.map((g) => ({ value: g.id, label: `${g.nombre} (${g.nivel})` })),
            ]}
            required
          />

          <FormField
            label="Horas Semanales"
            type="number"
            value={formData.horasSemanales.toString()}
            onChange={(e) => handleChange('horasSemanales', parseInt(e.target.value) || 1)}
            required
            min={1}
            max={20}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              rows={3}
              maxLength={500}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
