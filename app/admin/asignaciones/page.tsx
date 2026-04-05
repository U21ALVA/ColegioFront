'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Select, Badge, Modal, Pagination } from '@/components';

interface DocenteCurso {
  id: string;
  docenteId: string;
  docenteNombres: string;
  docenteApellidos: string;
  docenteDni: string;
  cursoId: string;
  cursoNombre: string;
  cursoCodigo: string;
  seccionId: string;
  seccionNombre: string;
  gradoNombre: string;
  gradoNivel: string;
  anioEscolarId: string;
  anioEscolarNombre: string;
}

interface Docente {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  especialidad: string;
}

interface Curso {
  id: string;
  nombre: string;
  codigo: string;
  gradoId: string;
  gradoNombre: string;
  gradoNivel: string;
}

interface Seccion {
  id: string;
  nombre: string;
  gradoId: string;
  gradoNombre: string;
  gradoNivel: string;
}

interface AnioEscolar {
  id: string;
  nombre: string;
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

export default function AsignacionesPage() {
  const [asignaciones, setAsignaciones] = useState<DocenteCurso[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [aniosEscolares, setAniosEscolares] = useState<AnioEscolar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [filterAnio, setFilterAnio] = useState('');
  const [filterDocente, setFilterDocente] = useState('');
  const [filterNivel, setFilterNivel] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  // Form state
  const [formData, setFormData] = useState({
    docenteId: '',
    cursoId: '',
    seccionId: '',
    anioEscolarId: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchAsignaciones();
  }, [currentPage, filterAnio, filterDocente, filterNivel]);

  const fetchInitialData = async () => {
    try {
      const [docentesRes, cursosRes, seccionesRes, aniosRes] = await Promise.all([
        api.get<Docente[]>('/api/docentes'),
        api.get<Curso[]>('/api/cursos'),
        api.get<Seccion[]>('/api/secciones'),
        api.get<AnioEscolar[]>('/api/anios-escolares'),
      ]);
      setDocentes(docentesRes.data);
      setCursos(cursosRes.data);
      setSecciones(seccionesRes.data);
      setAniosEscolares(aniosRes.data);

      // Set default filter to active year
      const activeYear = aniosRes.data.find((a) => a.activo);
      if (activeYear) {
        setFilterAnio(activeYear.id);
        setFormData((prev) => ({ ...prev, anioEscolarId: activeYear.id }));
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchAsignaciones = async () => {
    if (!filterAnio) return;
    
    setLoading(true);
    try {
      let endpoint = `/api/docente-cursos/paginated?page=${currentPage}&size=${pageSize}`;
      
      // Add filters
      const params = new URLSearchParams();
      if (filterAnio) params.append('anioEscolarId', filterAnio);
      if (filterDocente) params.append('docenteId', filterDocente);
      if (filterNivel) params.append('nivel', filterNivel);
      
      if (params.toString()) {
        endpoint = `/api/docente-cursos/filter?${params.toString()}&page=${currentPage}&size=${pageSize}`;
      }
      
      const response = await api.get<PageResponse<DocenteCurso>>(endpoint);
      setAsignaciones(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (error) {
      console.error('Error fetching asignaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setFormData({
      docenteId: '',
      cursoId: '',
      seccionId: '',
      anioEscolarId: filterAnio || (aniosEscolares.find((a) => a.activo)?.id || ''),
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.post('/api/docente-cursos', formData);
      closeModal();
      fetchAsignaciones();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la asignación');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (asignacion: DocenteCurso) => {
    const msg = `¿Está seguro de eliminar la asignación de ${asignacion.docenteApellidos} al curso ${asignacion.cursoNombre}?`;
    if (window.confirm(msg)) {
      try {
        await api.delete(`/api/docente-cursos/${asignacion.id}`);
        fetchAsignaciones();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al eliminar');
      }
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
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

  // Filter cursos by selected seccion's grade
  const selectedSeccion = secciones.find((s) => s.id === formData.seccionId);
  const filteredCursos = selectedSeccion
    ? cursos.filter((c) => c.gradoId === selectedSeccion.gradoId)
    : cursos;

  // Group asignaciones by docente for a better view
  const groupedByDocente = asignaciones.reduce(
    (acc, a) => {
      const key = a.docenteId;
      if (!acc[key]) {
        acc[key] = {
          docente: {
            id: a.docenteId,
            nombres: a.docenteNombres,
            apellidos: a.docenteApellidos,
            dni: a.docenteDni,
          },
          cursos: [],
        };
      }
      acc[key].cursos.push(a);
      return acc;
    },
    {} as Record<string, { docente: { id: string; nombres: string; apellidos: string; dni: string }; cursos: DocenteCurso[] }>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Asignaciones de Docentes</h1>
        <button
          onClick={openModal}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
        >
          Nueva Asignación
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Año Escolar"
            value={filterAnio}
            onChange={(e) => {
              setFilterAnio(e.target.value);
              setCurrentPage(0);
            }}
            options={[
              { value: '', label: 'Seleccione un año' },
              ...aniosEscolares.map((a) => ({
                value: a.id,
                label: `${a.nombre}${a.activo ? ' (Activo)' : ''}`,
              })),
            ]}
          />
          <Select
            label="Docente"
            value={filterDocente}
            onChange={(e) => {
              setFilterDocente(e.target.value);
              setCurrentPage(0);
            }}
            options={[
              { value: '', label: 'Todos los docentes' },
              ...docentes.map((d) => ({
                value: d.id,
                label: `${d.apellidos}, ${d.nombres}`,
              })),
            ]}
          />
          <Select
            label="Nivel"
            value={filterNivel}
            onChange={(e) => {
              setFilterNivel(e.target.value);
              setCurrentPage(0);
            }}
            options={[
              { value: '', label: 'Todos los niveles' },
              { value: 'INICIAL', label: 'Inicial' },
              { value: 'PRIMARIA', label: 'Primaria' },
              { value: 'SECUNDARIA', label: 'Secundaria' },
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
        ) : !filterAnio ? (
          <div className="p-8 text-center text-gray-500">
            Seleccione un año escolar para ver las asignaciones
          </div>
        ) : asignaciones.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay asignaciones registradas para los filtros seleccionados
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Docente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Curso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grado / Sección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nivel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {asignaciones.map((asignacion) => (
                  <tr key={asignacion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {asignacion.docenteApellidos}, {asignacion.docenteNombres}
                      </div>
                      <div className="text-sm text-gray-500">DNI: {asignacion.docenteDni}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{asignacion.cursoNombre}</div>
                      <div className="text-sm text-gray-500">{asignacion.cursoCodigo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {asignacion.gradoNombre} {asignacion.seccionNombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getNivelBadge(asignacion.gradoNivel)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDelete(asignacion)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
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
      <Modal isOpen={showModal} onClose={closeModal} title="Nueva Asignación">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>
          )}

          <Select
            label="Año Escolar"
            value={formData.anioEscolarId}
            onChange={(e) => handleChange('anioEscolarId', e.target.value)}
            options={[
              { value: '', label: 'Seleccione un año' },
              ...aniosEscolares.map((a) => ({
                value: a.id,
                label: `${a.nombre}${a.activo ? ' (Activo)' : ''}`,
              })),
            ]}
            required
          />

          <Select
            label="Docente"
            value={formData.docenteId}
            onChange={(e) => handleChange('docenteId', e.target.value)}
            options={[
              { value: '', label: 'Seleccione un docente' },
              ...docentes.map((d) => ({
                value: d.id,
                label: `${d.apellidos}, ${d.nombres} (${d.especialidad || 'Sin especialidad'})`,
              })),
            ]}
            required
          />

          <Select
            label="Sección"
            value={formData.seccionId}
            onChange={(e) => {
              handleChange('seccionId', e.target.value);
              handleChange('cursoId', ''); // Reset curso when section changes
            }}
            options={[
              { value: '', label: 'Seleccione una sección' },
              ...secciones.map((s) => ({
                value: s.id,
                label: `${s.gradoNombre} ${s.nombre} (${s.gradoNivel})`,
              })),
            ]}
            required
          />

          <Select
            label="Curso"
            value={formData.cursoId}
            onChange={(e) => handleChange('cursoId', e.target.value)}
            options={[
              { value: '', label: formData.seccionId ? 'Seleccione un curso' : 'Primero seleccione una sección' },
              ...filteredCursos.map((c) => ({
                value: c.id,
                label: `${c.nombre} (${c.codigo})`,
              })),
            ]}
            required
            disabled={!formData.seccionId}
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
              {saving ? 'Guardando...' : 'Asignar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
