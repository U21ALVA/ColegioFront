'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { SearchInput, Pagination, Badge, Select, Modal, FormField } from '@/components';

type Nivel = 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA';
type Estado = 'ACTIVO' | 'INACTIVO' | 'ELIMINADO';

interface Curso {
  id: string;
  nombre: string;
  nivel: Nivel;
  estado?: Estado;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
    nivel: '' as '' | Nivel,
  });

  useEffect(() => {
    fetchCursos();
  }, [currentPage, search, filterNivel]);

  const fetchCursos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('size', String(pageSize));

      if (search) {
        params.set('q', search);
      }

      if (filterNivel) {
        params.set('nivel', filterNivel);
      }

      const response = await api.get<PageResponse<Curso>>(`/api/cursos/search?${params.toString()}`);
      setCursos(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (fetchError) {
      console.error('Error fetching cursos:', fetchError);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(0);
  };

  const handleNivelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterNivel(e.target.value);
    setCurrentPage(0);
  };

  const openModal = (curso?: Curso) => {
    if (curso) {
      setEditingCurso(curso);
      setFormData({
        nombre: curso.nombre,
        nivel: curso.nivel,
      });
    } else {
      setEditingCurso(null);
      setFormData({
        nombre: '',
        nivel: '',
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
      const payload = {
        nombre: formData.nombre.trim(),
        nivel: formData.nivel,
      };

      if (editingCurso) {
        await api.put(`/api/cursos/${editingCurso.id}`, payload);
      } else {
        await api.post('/api/cursos', payload);
      }

      closeModal();
      fetchCursos();
    } catch (submitError: any) {
      setError(submitError.response?.data?.message || 'Error al guardar el curso');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (curso: Curso) => {
    if (!window.confirm(`¿Está seguro de eliminar el curso "${curso.nombre}"?`)) {
      return;
    }

    try {
      await api.delete(`/api/cursos/${curso.id}`);
      fetchCursos();
    } catch (deleteError: any) {
      alert(deleteError.response?.data?.message || 'Error al eliminar el curso');
    }
  };

  const getNivelBadge = (nivel: Nivel) => {
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

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar por nombre..."
          />
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
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : cursos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search || filterNivel ? 'No se encontraron cursos' : 'No hay cursos registrados'}
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nivel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cursos.map((curso) => (
                  <tr key={curso.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{curso.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getNivelBadge(curso.nivel)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button onClick={() => openModal(curso)} className="text-primary-600 hover:text-primary-900">Editar</button>
                        <button onClick={() => handleDelete(curso)} className="text-red-600 hover:text-red-900">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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

      <Modal isOpen={showModal} onClose={closeModal} title={editingCurso ? 'Editar Curso' : 'Nuevo Curso'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

          <FormField
            label="Nombre"
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
            required
            maxLength={100}
          />

          <Select
            label="Nivel"
            value={formData.nivel}
            onChange={(e) => setFormData((prev) => ({ ...prev, nivel: e.target.value as Nivel }))}
            options={[
              { value: '', label: 'Seleccione un nivel' },
              { value: 'INICIAL', label: 'Inicial' },
              { value: 'PRIMARIA', label: 'Primaria' },
              { value: 'SECUNDARIA', label: 'Secundaria' },
            ]}
            required
          />

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
