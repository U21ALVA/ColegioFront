'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { SearchInput, Pagination, Badge, Select, getStatusBadge } from '@/components';

interface Alumno {
  id: string;
  codigoEstudiante: string;
  dni: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  genero: string;
  direccion: string;
  seccionId: string;
  seccionNombre: string;
  gradoNombre: string;
  gradoNivel: string;
  estado: string;
  username?: string;
}

interface Seccion {
  id: string;
  nombre: string;
  gradoId: string;
  gradoNombre: string;
  gradoNivel: string;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export default function AlumnosPage() {
  const router = useRouter();
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSeccion, setFilterSeccion] = useState('');
  const [filterNivel, setFilterNivel] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchSecciones();
  }, []);

  useEffect(() => {
    fetchAlumnos();
  }, [currentPage, search, filterSeccion, filterNivel]);

  const fetchSecciones = async () => {
    try {
      const response = await api.get<Seccion[]>('/api/secciones');
      setSecciones(response.data);
    } catch (error) {
      console.error('Error fetching secciones:', error);
    }
  };

  const fetchAlumnos = async () => {
    setLoading(true);
    try {
      let endpoint = `/api/alumnos/paginated?page=${currentPage}&size=${pageSize}`;
      
      if (search) {
        endpoint = `/api/alumnos/search?q=${encodeURIComponent(search)}&page=${currentPage}&size=${pageSize}`;
      } else if (filterSeccion) {
        endpoint = `/api/alumnos/seccion/${filterSeccion}?page=${currentPage}&size=${pageSize}`;
      } else if (filterNivel) {
        endpoint = `/api/alumnos/nivel/${filterNivel}?page=${currentPage}&size=${pageSize}`;
      }
      
      const response = await api.get<PageResponse<Alumno>>(endpoint);
      setAlumnos(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (error) {
      console.error('Error fetching alumnos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setFilterSeccion('');
    setFilterNivel('');
    setCurrentPage(0);
  };

  const handleNivelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterNivel(e.target.value);
    setFilterSeccion('');
    setSearch('');
    setCurrentPage(0);
  };

  const handleSeccionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterSeccion(e.target.value);
    setFilterNivel('');
    setSearch('');
    setCurrentPage(0);
  };

  const handleDelete = async (alumno: Alumno) => {
    if (window.confirm(`¿Está seguro de eliminar al alumno ${alumno.nombres} ${alumno.apellidos}?`)) {
      try {
        await api.delete(`/api/alumnos/${alumno.id}`);
        fetchAlumnos();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al eliminar');
      }
    }
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

  const filteredSecciones = filterNivel
    ? secciones.filter((s) => s.gradoNivel === filterNivel)
    : secciones;

  const calculateAge = (fechaNacimiento: string) => {
    const birth = new Date(fechaNacimiento);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Alumnos</h1>
        <Link
          href="/admin/alumnos/nuevo"
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
        >
          Nuevo Alumno
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Buscar por nombre, DNI o código..."
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
            label="Sección"
            value={filterSeccion}
            onChange={handleSeccionChange}
            options={[
              { value: '', label: 'Todas las secciones' },
              ...filteredSecciones.map((s) => ({ 
                value: s.id, 
                label: `${s.gradoNombre} ${s.nombre} (${s.gradoNivel})` 
              })),
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
        ) : alumnos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search || filterSeccion || filterNivel ? 'No se encontraron alumnos' : 'No hay alumnos registrados'}
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alumno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DNI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grado / Sección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Edad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {alumnos.map((alumno) => (
                  <tr
                    key={alumno.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/admin/alumnos/${alumno.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {alumno.apellidos}, {alumno.nombres}
                        </div>
                        {alumno.username && (
                          <div className="text-sm text-gray-500">@{alumno.username}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {alumno.codigoEstudiante}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {alumno.dni}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">
                          {alumno.gradoNombre} {alumno.seccionNombre}
                        </span>
                        {getNivelBadge(alumno.gradoNivel)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {alumno.fechaNacimiento ? `${calculateAge(alumno.fechaNacimiento)} años` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(alumno.estado)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/admin/alumnos/${alumno.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(alumno)}
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
    </div>
  );
}
